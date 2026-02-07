# Funciones para INVITAR MIEMBROS:

# Función get_organization_seat_status:

DECLARE
    v_seats_included integer;    -- Seats GRATIS del plan
    v_max_members integer;       -- Límite máximo posible
    v_purchased_seats integer;   -- Seats comprados
    v_current_members integer;
    v_pending_invitations integer;
    v_total_capacity integer;
    v_available_seats integer;
    v_plan_price_monthly numeric;
    v_plan_price_annual numeric;
    v_plan_slug text;
    v_billing_period text;
    v_expires_at timestamptz;
    v_days_remaining integer;
    v_prorated_price_monthly numeric;
    v_prorated_price_annual numeric;
    v_can_buy_more boolean;
BEGIN
    -- Obtener configuración del plan
    SELECT 
        COALESCE((p.features->>'seats_included')::integer, 1),  -- Gratis (default 1 = owner)
        COALESCE((p.features->>'max_members')::integer, 999),   -- Límite máximo
        COALESCE(p.monthly_amount, 0),
        COALESCE(p.annual_amount, 0),
        p.slug
    INTO v_seats_included, v_max_members, v_plan_price_monthly, v_plan_price_annual, v_plan_slug
    FROM public.organizations o
    JOIN public.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    -- Obtener seats comprados
    SELECT COALESCE(purchased_seats, 0)
    INTO v_purchased_seats
    FROM public.organizations
    WHERE id = p_organization_id;

    -- Contar miembros activos (todos ocupan asiento, sin importar si son billables o no)
    SELECT COUNT(*)
    INTO v_current_members
    FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND is_active = true;

    -- Contar invitaciones pendientes (ocupan seat)
    SELECT COUNT(*)
    INTO v_pending_invitations
    FROM public.organization_invitations
    WHERE organization_id = p_organization_id
      AND status IN ('pending', 'registered');

    -- Calcular capacidad y disponibilidad
    v_total_capacity := v_seats_included + v_purchased_seats;
    v_available_seats := v_total_capacity - (v_current_members + v_pending_invitations);
    
    -- ¿Puede comprar más? Solo si no alcanzó el límite máximo
    v_can_buy_more := (v_total_capacity < v_max_members);

    -- Obtener datos de suscripción activa para prorrateo
    SELECT 
        s.billing_period,
        s.expires_at
    INTO v_billing_period, v_expires_at
    FROM public.organization_subscriptions s
    WHERE s.organization_id = p_organization_id
      AND s.status = 'active'
    LIMIT 1;

    -- Calcular días restantes y prorrateo
    IF v_expires_at IS NOT NULL THEN
        v_days_remaining := GREATEST(0, (v_expires_at::date - CURRENT_DATE));
        
        IF v_billing_period = 'monthly' THEN
            v_prorated_price_monthly := ROUND(v_plan_price_monthly * (v_days_remaining::numeric / 30.0), 2);
            v_prorated_price_annual := NULL;
        ELSE
            v_prorated_price_annual := ROUND(v_plan_price_annual * (v_days_remaining::numeric / 365.0), 2);
            v_prorated_price_monthly := NULL;
        END IF;
    ELSE
        v_days_remaining := 0;
        v_prorated_price_monthly := v_plan_price_monthly;
        v_prorated_price_annual := v_plan_price_annual;
    END IF;

    RETURN jsonb_build_object(
        -- Capacidad
        'seats_included', v_seats_included,
        'max_members', v_max_members,
        'purchased', v_purchased_seats,
        'total_capacity', v_total_capacity,
        'used', v_current_members,
        'pending_invitations', v_pending_invitations,
        'available', GREATEST(v_available_seats, 0),
        'can_invite', v_available_seats > 0,
        'can_buy_more', v_can_buy_more,
        
        -- Precios base
        'seat_price_monthly', v_plan_price_monthly,
        'seat_price_annual', v_plan_price_annual,
        'plan_slug', v_plan_slug,
        
        -- Datos de suscripción para prorrateo
        'billing_period', v_billing_period,
        'expires_at', v_expires_at,
        'days_remaining', v_days_remaining,
        
        -- Precio PRORRATEADO
        'prorated_price', CASE 
            WHEN v_billing_period = 'monthly' THEN v_prorated_price_monthly
            ELSE v_prorated_price_annual
        END
    );
END;

# Función handle_contact_link_user:

declare
  v_user_id uuid;
begin
  -- Buscar usuario con el mismo email (case-insensitive)
  select u.id
  into v_user_id
  from public.users u
  where lower(u.email) = lower(new.email)
  limit 1;

  -- Si existe, vincularlo al contacto
  if v_user_id is not null then
    new.linked_user_id := v_user_id;
  end if;

  return new;
end;

# Función handle_new_org_member_contact:

declare
  v_user record;
  v_exists_same_link boolean;
  v_exists_local_match boolean;
begin
  -- Traer datos básicos del usuario
  select u.id, u.full_name, u.email
  into v_user
  from public.users u
  where u.id = new.user_id
  limit 1;

  -- Si no hay usuario, no hacer nada
  if v_user.id is null then
    return new;
  end if;

  -- Si no hay email, no intentamos vincular contactos
  if v_user.email is null then
    return new;
  end if;

  -- 1) ¿Ya existe un contacto vinculado a este user_id en esta organización?
  select exists (
    select 1
    from public.contacts c
    where c.organization_id = new.organization_id
      and c.linked_user_id = v_user.id
  )
  into v_exists_same_link;

  if v_exists_same_link then
    return new;
  end if;

  -- 2) ¿Existe un contacto local (sin linked_user_id) que coincida por email?
  select exists (
    select 1
    from public.contacts c
    where c.organization_id = new.organization_id
      and c.linked_user_id is null
      and c.email is not distinct from v_user.email
  )
  into v_exists_local_match;

  if v_exists_local_match then
    -- Promover contacto local a vinculado
    update public.contacts c
    set
      linked_user_id = v_user.id,
      full_name      = coalesce(v_user.full_name, c.full_name),
      email          = coalesce(v_user.email, c.email),
      updated_at     = now()
    where c.organization_id = new.organization_id
      and c.linked_user_id is null
      and c.email is not distinct from v_user.email;

    return new;
  end if;

  -- 3) Crear nuevo contacto vinculado
  insert into public.contacts (
    organization_id,
    linked_user_id,
    full_name,
    email,
    created_at,
    updated_at
  )
  values (
    new.organization_id,
    v_user.id,
    v_user.full_name,
    v_user.email,
    now(),
    now()
  );

  return new;
end;

# Función handle_member_seat_purchase:

DECLARE
    v_payment_id uuid;
    v_step text := 'start';
BEGIN
    -- ============================================================
    -- 1) Idempotencia fuerte
    -- ============================================================
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    -- ============================================================
    -- 2) Registrar pago
    -- ============================================================
    v_step := 'insert_payment';
    v_payment_id := public.step_payment_insert_idempotent(
        p_provider,
        p_provider_payment_id,
        p_user_id,
        p_organization_id,
        'seat_purchase',  -- product_type
        p_plan_id,
        NULL,             -- course_id
        p_amount,
        p_currency,
        p_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    -- ============================================================
    -- 3) Incrementar seats disponibles
    -- ============================================================
    v_step := 'increment_seats';
    PERFORM public.step_organization_increment_seats(
        p_organization_id,
        p_seats_purchased
    );

    -- ============================================================
    -- 4) Registrar evento de compra
    -- ============================================================
    v_step := 'log_event';
    PERFORM public.step_log_seat_purchase_event(
        p_organization_id,
        p_user_id,
        p_seats_purchased,
        p_amount,
        p_currency,
        v_payment_id,
        true  -- prorated
    );

    -- ============================================================
    -- 5) Email de confirmación
    -- ============================================================
    v_step := 'send_email';
    PERFORM public.step_send_purchase_email(
        p_user_id,
        'seat_purchase',
        p_seats_purchased || ' asiento(s) adicional(es)',
        p_amount,
        p_currency,
        v_payment_id
    );

    -- ============================================================
    -- OK
    -- ============================================================
    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id,
        'seats_added', p_seats_purchased
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM public.log_system_error(
        'payment',
        'seat_purchase',
        'handle_member_seat_purchase',
        SQLERRM,
        jsonb_build_object(
            'step', v_step,
            'provider', p_provider,
            'provider_payment_id', p_provider_payment_id,
            'organization_id', p_organization_id,
            'seats', p_seats_purchased,
            'amount', p_amount
        ),
        'critical'
    );

    RETURN jsonb_build_object(
        'status', 'ok_with_warning',
        'payment_id', v_payment_id,
        'warning_step', v_step
    );
END;

# Función step_log_seat_purchase_event:

DECLARE
    v_event_id uuid;
BEGIN
    -- Log en activity_logs para auditoría general
    INSERT INTO public.activity_logs (
        organization_id,
        user_id,
        action,
        component,
        new_data
    ) VALUES (
        p_organization_id,
        p_user_id,
        'seat_purchased',
        'billing',
        jsonb_build_object(
            'seats', p_seats,
            'amount', p_amount,
            'currency', p_currency,
            'payment_id', p_payment_id,
            'prorated', p_prorated
        )
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;

# Función step_organization_increment_seats:

BEGIN
    UPDATE public.organizations
    SET 
        purchased_seats = COALESCE(purchased_seats, 0) + p_seats_to_add,
        updated_at = now()
    WHERE id = p_organization_id;
END;





