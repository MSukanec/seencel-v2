-- ============================================================
-- SISTEMA DE COBRO POR SEATS ADICIONALES (CON PRORRATEO)
-- ============================================================
-- Este archivo contiene las funciones para manejar la compra
-- de asientos adicionales en organizaciones.
-- 
-- Ejecutar en Supabase en este orden:
-- 1. ALTER TABLE organizations
-- 2. get_organization_seat_status (con prorrateo)
-- 3. step_organization_increment_seats
-- 4. step_log_member_billing_event
-- 5. handle_member_seat_purchase
-- ============================================================

-- ============================================================
-- 1) AGREGAR COLUMNA purchased_seats A ORGANIZATIONS
-- ============================================================
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS purchased_seats integer DEFAULT 0;

COMMENT ON COLUMN public.organizations.purchased_seats IS 'Cantidad de seats adicionales comprados (además de los incluidos en el plan)';


-- ============================================================
-- 2) FUNCIÓN: get_organization_seat_status (CON PRORRATEO)
-- ============================================================
-- Helper para UI - retorna estado actual de seats disponibles
-- INCLUYE cálculo de prorrateo basado en días restantes del ciclo
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_organization_seat_status(
    p_organization_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_max_members integer;
    v_purchased_seats integer;
    v_current_members integer;
    v_pending_invitations integer;
    v_available_seats integer;
    v_plan_price_monthly numeric;
    v_plan_price_annual numeric;
    v_plan_slug text;
    v_billing_period text;
    v_expires_at timestamptz;
    v_days_remaining integer;
    v_total_days integer;
    v_prorated_price_monthly numeric;
    v_prorated_price_annual numeric;
BEGIN
    -- Obtener límite del plan y precios
    SELECT 
        COALESCE((p.features->>'max_members')::integer, 1),
        COALESCE(p.monthly_amount, 0),
        COALESCE(p.annual_amount, 0),
        p.slug
    INTO v_max_members, v_plan_price_monthly, v_plan_price_annual, v_plan_slug
    FROM public.organizations o
    JOIN public.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    -- Obtener seats comprados
    SELECT COALESCE(purchased_seats, 0)
    INTO v_purchased_seats
    FROM public.organizations
    WHERE id = p_organization_id;

    -- Contar miembros billables actuales
    SELECT COUNT(*)
    INTO v_current_members
    FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND is_billable = true;

    -- Contar invitaciones pendientes (ocupan seat)
    SELECT COUNT(*)
    INTO v_pending_invitations
    FROM public.organization_invitations
    WHERE organization_id = p_organization_id
      AND status IN ('pending', 'registered');

    -- Calcular disponibles
    v_available_seats := (v_max_members + v_purchased_seats) - (v_current_members + v_pending_invitations);

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
        
        -- Total de días del período
        IF v_billing_period = 'monthly' THEN
            v_total_days := 30;
        ELSE
            v_total_days := 365;
        END IF;
        
        -- Precio prorrateado = precio * (días restantes / total días)
        -- Para monthly: usamos el precio mensual
        -- Para annual: usamos el precio mensual prorrateado
        IF v_billing_period = 'monthly' THEN
            v_prorated_price_monthly := ROUND(v_plan_price_monthly * (v_days_remaining::numeric / 30.0), 2);
            v_prorated_price_annual := NULL; -- No aplica
        ELSE
            -- Para anual, el precio es por seat POR AÑO
            v_prorated_price_annual := ROUND(v_plan_price_annual * (v_days_remaining::numeric / 365.0), 2);
            v_prorated_price_monthly := NULL; -- No aplica
        END IF;
    ELSE
        -- Sin suscripción activa, no hay prorrateo
        v_days_remaining := 0;
        v_prorated_price_monthly := v_plan_price_monthly;
        v_prorated_price_annual := v_plan_price_annual;
    END IF;

    RETURN jsonb_build_object(
        -- Capacidad
        'max_included', v_max_members,
        'purchased', v_purchased_seats,
        'total_capacity', v_max_members + v_purchased_seats,
        'used', v_current_members,
        'pending_invitations', v_pending_invitations,
        'available', GREATEST(v_available_seats, 0),
        'can_invite', v_available_seats > 0,
        
        -- Precios base
        'seat_price_monthly', v_plan_price_monthly,
        'seat_price_annual', v_plan_price_annual,
        'plan_slug', v_plan_slug,
        
        -- Datos de suscripción para prorrateo
        'billing_period', v_billing_period,
        'expires_at', v_expires_at,
        'days_remaining', v_days_remaining,
        
        -- Precios PRORRATEADOS (lo que realmente pagan)
        'prorated_price', CASE 
            WHEN v_billing_period = 'monthly' THEN v_prorated_price_monthly
            ELSE v_prorated_price_annual
        END
    );
END;
$$;

COMMENT ON FUNCTION public.get_organization_seat_status IS 'Retorna estado de seats con prorrateo calculado según días restantes del ciclo';


-- ============================================================
-- 3) STEP: step_organization_increment_seats
-- ============================================================
CREATE OR REPLACE FUNCTION public.step_organization_increment_seats(
    p_organization_id uuid,
    p_seats_to_add integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.organizations
    SET 
        purchased_seats = COALESCE(purchased_seats, 0) + p_seats_to_add,
        updated_at = now()
    WHERE id = p_organization_id;
END;
$$;

COMMENT ON FUNCTION public.step_organization_increment_seats IS 'Step: incrementa el contador de seats comprados en la organización';


-- ============================================================
-- 4) STEP: step_log_member_billing_event
-- ============================================================
-- NOTA: organization_member_events necesita member_id, pero en compra de seats
-- no hay member aún. Vamos a usar una versión alternativa que no requiere member_id.
-- ============================================================
CREATE OR REPLACE FUNCTION public.step_log_seat_purchase_event(
    p_organization_id uuid,
    p_user_id uuid,
    p_seats integer,
    p_amount numeric,
    p_currency text,
    p_payment_id uuid,
    p_prorated boolean DEFAULT true
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

COMMENT ON FUNCTION public.step_log_seat_purchase_event IS 'Step: registra evento de compra de seat en activity_logs';


-- ============================================================
-- 5) ORQUESTADOR: handle_member_seat_purchase
-- ============================================================
-- Similar a handle_payment_subscription_success pero para seats
-- Recibe monto ya prorrateado del frontend
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_member_seat_purchase(
    p_provider text,
    p_provider_payment_id text,
    p_user_id uuid,
    p_organization_id uuid,
    p_plan_id uuid,
    p_seats_purchased integer,
    p_amount numeric,             -- Monto prorrateado ya calculado
    p_currency text,
    p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

COMMENT ON FUNCTION public.handle_member_seat_purchase IS 'Orquestador: procesa compra de seats adicionales con idempotencia y logging';
