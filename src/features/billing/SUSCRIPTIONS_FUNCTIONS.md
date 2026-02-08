# Detalle de DB para FUNCIONES DE SUSCRIPCIONES:

# Funcion get_upgrade_proration:

DECLARE
    -- Plan actual
    v_current_plan_id uuid;
    v_current_plan_slug text;
    v_current_plan_name text;
    v_current_monthly numeric;
    v_current_annual numeric;
    
    -- Plan destino
    v_target_plan_slug text;
    v_target_plan_name text;
    v_target_monthly numeric;
    v_target_annual numeric;
    
    -- Suscripción activa
    v_billing_period text;
    v_expires_at timestamptz;
    v_subscription_amount numeric;
    v_subscription_id uuid;
    
    -- Cálculos
    v_days_remaining integer;
    v_period_total_days integer;
    v_credit numeric;
    v_target_price numeric;
    v_upgrade_price numeric;
BEGIN
    -- ============================================================
    -- 1) Obtener plan actual de la organización
    -- ============================================================
    SELECT 
        o.plan_id,
        p.slug,
        p.name,
        COALESCE(p.monthly_amount, 0),
        COALESCE(p.annual_amount, 0)
    INTO v_current_plan_id, v_current_plan_slug, v_current_plan_name,
         v_current_monthly, v_current_annual
    FROM public.organizations o
    JOIN public.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;
    
    IF v_current_plan_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'ORGANIZATION_NOT_FOUND'
        );
    END IF;
    
    -- Validar que el plan actual sea PRO
    IF v_current_plan_slug NOT ILIKE '%pro%' THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'NOT_PRO_PLAN',
            'current_plan', v_current_plan_slug
        );
    END IF;
    
    -- ============================================================
    -- 2) Obtener plan destino
    -- ============================================================
    SELECT 
        slug,
        name,
        COALESCE(monthly_amount, 0),
        COALESCE(annual_amount, 0)
    INTO v_target_plan_slug, v_target_plan_name,
         v_target_monthly, v_target_annual
    FROM public.plans
    WHERE id = p_target_plan_id;
    
    IF v_target_plan_slug IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'TARGET_PLAN_NOT_FOUND'
        );
    END IF;
    
    -- Validar que el destino sea TEAMS
    IF v_target_plan_slug NOT ILIKE '%team%' THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'NOT_TEAMS_PLAN',
            'target_plan', v_target_plan_slug
        );
    END IF;
    
    -- ============================================================
    -- 3) Obtener suscripción activa
    -- ============================================================
    SELECT 
        s.id,
        s.billing_period,
        s.expires_at,
        s.amount
    INTO v_subscription_id, v_billing_period, v_expires_at, v_subscription_amount
    FROM public.organization_subscriptions s
    WHERE s.organization_id = p_organization_id
      AND s.status = 'active'
    LIMIT 1;
    
    IF v_subscription_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'NO_ACTIVE_SUBSCRIPTION'
        );
    END IF;
    
    -- ============================================================
    -- 4) Calcular prorrateo
    -- ============================================================
    -- Días restantes
    v_days_remaining := GREATEST(0, (v_expires_at::date - CURRENT_DATE));
    
    -- Total de días del período
    IF v_billing_period = 'monthly' THEN
        v_period_total_days := 30;
    ELSE
        v_period_total_days := 365;
    END IF;
    
    -- Crédito: precio pagado × (días restantes / días totales)
    v_credit := ROUND(
        v_subscription_amount * (v_days_remaining::numeric / v_period_total_days::numeric),
        2
    );
    
    -- Precio del plan destino (mismo ciclo)
    IF v_billing_period = 'monthly' THEN
        v_target_price := v_target_monthly;
    ELSE
        v_target_price := v_target_annual;
    END IF;
    
    -- Precio neto del upgrade (mínimo $0.01)
    v_upgrade_price := GREATEST(0.01, v_target_price - v_credit);
    
    -- ============================================================
    -- 5) Retornar resultado
    -- ============================================================
    RETURN jsonb_build_object(
        'ok', true,
        
        -- Plan actual
        'current_plan_id', v_current_plan_id,
        'current_plan_slug', v_current_plan_slug,
        'current_plan_name', v_current_plan_name,
        
        -- Plan destino
        'target_plan_id', p_target_plan_id,
        'target_plan_slug', v_target_plan_slug,
        'target_plan_name', v_target_plan_name,
        'target_price', v_target_price,
        
        -- Suscripción actual
        'subscription_id', v_subscription_id,
        'billing_period', v_billing_period,
        'expires_at', v_expires_at,
        'subscription_amount', v_subscription_amount,
        
        -- Prorrateo
        'days_remaining', v_days_remaining,
        'period_total_days', v_period_total_days,
        'credit', v_credit,
        'upgrade_price', v_upgrade_price
    );
END;

# Función notify_subscription_activated:

DECLARE
    v_plan_name text;
    v_owner_id uuid;
    v_is_upgrade boolean := false;
    v_previous_plan text;
    v_title_owner text;
    v_body_owner text;
    v_title_admin text;
    v_body_admin text;
    v_billing_label text;
BEGIN
    -- Solo notificar cuando la suscripción se crea activa
    IF NEW.status = 'active' THEN
        
        -- Obtener nombre del plan
        SELECT name INTO v_plan_name
        FROM public.plans
        WHERE id = NEW.plan_id;
        
        -- Obtener el owner de la organización
        SELECT owner_id INTO v_owner_id
        FROM public.organizations
        WHERE id = NEW.organization_id;

        -- Etiqueta del período
        v_billing_label := CASE 
            WHEN NEW.billing_period = 'annual' THEN 'anual'
            ELSE 'mensual'
        END;
        
        -- Detectar si es upgrade: ¿hay una suscripción anterior para esta org?
        SELECT p.name INTO v_previous_plan
        FROM public.organization_subscriptions s
        JOIN public.plans p ON p.id = s.plan_id
        WHERE s.organization_id = NEW.organization_id
          AND s.id != NEW.id
          AND s.status IN ('expired', 'cancelled')
        ORDER BY s.created_at DESC
        LIMIT 1;
        
        v_is_upgrade := (v_previous_plan IS NOT NULL);
        
        -- Construir mensajes según sea upgrade o nueva suscripción
        IF v_is_upgrade THEN
            v_title_owner := '⬆️ ¡Plan Mejorado!';
            v_body_owner := 'Tu plan fue mejorado a ' || COALESCE(v_plan_name, '') || '. ¡A disfrutarlo! 🚀';
            v_title_admin := '⬆️ Upgrade de Plan';
            v_body_admin := 'Organización mejoró de ' || COALESCE(v_previous_plan, '?') || ' a ' || COALESCE(v_plan_name, '') || ' (' || v_billing_label || ') por ' || NEW.amount || ' ' || NEW.currency;
        ELSE
            v_title_owner := '¡Plan Activado!';
            v_body_owner := 'Tu plan ' || COALESCE(v_plan_name, '') || ' está activo. ¡Hora de construir! 🚀';
            v_title_admin := '💰 Nueva Suscripción';
            v_body_admin := 'Organización activó plan ' || COALESCE(v_plan_name, '') || ' (' || v_billing_label || ') por ' || NEW.amount || ' ' || NEW.currency;
        END IF;
        
        -- Notificación al dueño de la organización
        IF v_owner_id IS NOT NULL THEN
            PERFORM public.send_notification(
                v_owner_id,
                'success',
                v_title_owner,
                v_body_owner,
                jsonb_build_object(
                    'subscription_id', NEW.id,
                    'plan_id', NEW.plan_id,
                    'plan_name', v_plan_name,
                    'billing_period', NEW.billing_period,
                    'is_upgrade', v_is_upgrade,
                    'url', '/organization/settings?tab=billing'
                ),
                'direct'
            );
        END IF;
        
        -- Notificar a admins de la plataforma
        PERFORM public.send_notification(
            NULL,
            'info',
            v_title_admin,
            v_body_admin,
            jsonb_build_object(
                'subscription_id', NEW.id,
                'organization_id', NEW.organization_id,
                'plan_name', v_plan_name,
                'billing_period', NEW.billing_period,
                'amount', NEW.amount,
                'currency', NEW.currency,
                'is_upgrade', v_is_upgrade,
                'previous_plan', v_previous_plan
            ),
            'admins'
        );
    END IF;
    
    RETURN NEW;
END;


# Funcion step_payment_insert_idempotent:

declare
  v_payment_id uuid;
  v_product_id uuid;
begin
  -- ------------------------------------------------------------
  -- product_id unificado:
  -- - subscription: guardamos plan_id en product_id
  -- - course: guardamos course_id en product_id
  -- ------------------------------------------------------------
  if p_product_type = 'subscription' then
    v_product_id := p_plan_id;
  elsif p_product_type = 'course' then
    v_product_id := p_course_id;
  else
    v_product_id := null;
  end if;

  insert into public.payments (
    provider,
    provider_payment_id,
    user_id,
    organization_id,
    product_type,
    product_id,
    course_id,
    amount,
    currency,
    status,
    metadata,
    gateway,
    approved_at
  )
  values (
    p_provider,
    p_provider_payment_id,
    p_user_id,
    p_organization_id,
    p_product_type,
    v_product_id,
    p_course_id,
    p_amount,
    coalesce(p_currency, 'USD'),
    'completed',
    coalesce(p_metadata, '{}'::jsonb),
    p_provider,
    now()
  )
  on conflict (provider, provider_payment_id)
  do nothing
  returning id into v_payment_id;

  return v_payment_id;

exception
  when others then
    perform public.log_system_error(
      'payment',
      'payments',
      'step_payment_insert_idempotent',
      sqlerrm,
      jsonb_build_object(
        'provider', p_provider,
        'provider_payment_id', p_provider_payment_id,
        'user_id', p_user_id,
        'organization_id', p_organization_id,
        'product_type', p_product_type,
        'plan_id', p_plan_id,
        'course_id', p_course_id,
        'amount', p_amount,
        'currency', p_currency
      ),
      'critical'
    );
    raise;
end;

# Función step_subscription_expire_previous:

BEGIN
  UPDATE public.organization_subscriptions
  SET
    status = 'expired',
    expires_at = now()
  WHERE organization_id = p_organization_id
    AND status = 'active';
END;

# Función step_subscription_create_active:

declare
  v_subscription_id uuid;
  v_expires_at timestamptz;
begin
  if p_billing_period = 'annual' then
    v_expires_at := now() + interval '1 year';
  else
    v_expires_at := now() + interval '1 month';
  end if;

  insert into public.organization_subscriptions (
    organization_id,
    plan_id,
    payment_id,
    status,
    billing_period,
    started_at,
    expires_at,
    amount,
    currency
  )
  values (
    p_organization_id,
    p_plan_id,
    p_payment_id,
    'active',
    p_billing_period,
    now(),
    v_expires_at,
    p_amount,
    p_currency
  )
  returning id into v_subscription_id;

  return v_subscription_id;
end;

# Función step_organization_set_plan:

BEGIN
  UPDATE public.organizations
  SET
    plan_id = p_plan_id,
    updated_at = now()
  WHERE id = p_organization_id;
END;

# Función step_apply_founders_program:

DECLARE
  v_bonus_course_id uuid;
BEGIN
  -- marcar organización como founder
  UPDATE public.organizations
  SET
    settings = coalesce(settings, '{}'::jsonb)
      || jsonb_build_object('is_founder', true),
    updated_at = now()
  WHERE id = p_organization_id;

  -- curso bonus desde app_settings
  SELECT value::uuid
  INTO v_bonus_course_id
  FROM public.app_settings
  WHERE key = 'founder_bonus_course_id'
  LIMIT 1;

  IF v_bonus_course_id IS NOT NULL THEN
    PERFORM public.step_course_enrollment_annual(
      p_user_id,
      v_bonus_course_id
    );
  END IF;
END;

# Función step_send_purchase_email:


DECLARE
    v_user_email text;
    v_user_name text;
BEGIN
    -- Obtener datos del usuario
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM public.users
    WHERE id = p_user_id;

    IF v_user_email IS NULL THEN
        RAISE NOTICE 'step_send_purchase_email: Usuario % no encontrado', p_user_id;
        RETURN;
    END IF;

    -- Email al comprador
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        created_at
    ) VALUES (
        v_user_email,
        COALESCE(v_user_name, 'Usuario'),
        'purchase_confirmation',
        CASE p_product_type
            WHEN 'course' THEN '¡Tu curso está listo!'
            WHEN 'subscription' THEN '¡Bienvenido a SEENCEL ' || p_product_name || '!'
            ELSE 'Confirmación de compra'
        END,
        jsonb_build_object(
            'user_id', p_user_id,
            'user_email', v_user_email,
            'user_name', v_user_name,
            'product_type', p_product_type,
            'product_name', p_product_name,
            'amount', p_amount,
            'currency', p_currency,
            'payment_id', p_payment_id,
            'provider', p_provider  -- ← NUEVO: incluir provider
        ),
        NOW()
    );

    -- También notificar admins
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        created_at
    ) VALUES (
        'contacto@seencel.com',
        'Admin SEENCEL',
        'admin_sale_notification',
        '💰 Nueva venta: ' || p_product_name,
        jsonb_build_object(
            'buyer_email', v_user_email,
            'buyer_name', v_user_name,
            'product_type', p_product_type,
            'product_name', p_product_name,
            'amount', p_amount,
            'currency', p_currency,
            'payment_id', p_payment_id,
            'provider', p_provider  -- ← NUEVO: incluir provider
        ),
        NOW()
    );

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'step_send_purchase_email error: %', SQLERRM;
END;
