-- ============================================================
-- 078: Renombrar funciones billing para consistencia de naming
-- ============================================================
-- Patrón: handle_payment_{product_type}_success
--
-- handle_member_seat_purchase        → handle_payment_seat_success
-- handle_upgrade_subscription_success → handle_payment_upgrade_success
--
-- Se crean las funciones con el nombre nuevo y se mantienen
-- las viejas como wrappers deprecados para backwards compatibility.
--
-- Fecha: 2026-02-21
-- ============================================================

BEGIN;

-- ============================================================
-- 1. handle_member_seat_purchase → handle_payment_seat_success
-- ============================================================

-- Crear función con nombre nuevo (copia exacta)
CREATE OR REPLACE FUNCTION billing.handle_payment_seat_success(
    p_provider text,
    p_provider_payment_id text,
    p_user_id uuid,
    p_organization_id uuid,
    p_plan_id uuid,
    p_seats_purchased integer,
    p_amount numeric,
    p_currency text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
    v_payment_id uuid;
    v_enriched_metadata jsonb;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    v_enriched_metadata := COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'product_name', p_seats_purchased || ' asiento(s) adicional(es)',
        'seats_purchased', p_seats_purchased
    );

    v_step := 'insert_payment';
    v_payment_id := billing.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, p_organization_id,
        'seat_purchase', p_plan_id, NULL, p_amount, p_currency, v_enriched_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    v_step := 'increment_seats';
    PERFORM iam.step_organization_increment_seats(p_organization_id, p_seats_purchased);

    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id,
        'seats_added', p_seats_purchased
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM ops.log_system_error(
        'payment', 'seat_purchase', 'handle_payment_seat_success',
        SQLERRM,
        jsonb_build_object(
            'step', v_step, 'provider', p_provider,
            'provider_payment_id', p_provider_payment_id,
            'organization_id', p_organization_id,
            'seats', p_seats_purchased, 'amount', p_amount
        ),
        'critical'
    );

    RETURN jsonb_build_object(
        'status', 'ok_with_warning',
        'payment_id', v_payment_id,
        'warning_step', v_step
    );
END;
$function$;

-- Convertir la vieja en wrapper (backwards compatibility temporal)
CREATE OR REPLACE FUNCTION billing.handle_member_seat_purchase(
    p_provider text,
    p_provider_payment_id text,
    p_user_id uuid,
    p_organization_id uuid,
    p_plan_id uuid,
    p_seats_purchased integer,
    p_amount numeric,
    p_currency text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
BEGIN
    -- DEPRECATED: usar handle_payment_seat_success
    RETURN billing.handle_payment_seat_success(
        p_provider, p_provider_payment_id, p_user_id,
        p_organization_id, p_plan_id, p_seats_purchased,
        p_amount, p_currency, p_metadata
    );
END;
$function$;


-- ============================================================
-- 2. handle_upgrade_subscription_success → handle_payment_upgrade_success
-- ============================================================

-- Crear función con nombre nuevo (wrapper directo a la unificada)
CREATE OR REPLACE FUNCTION billing.handle_payment_upgrade_success(
    p_provider text,
    p_provider_payment_id text,
    p_user_id uuid,
    p_organization_id uuid,
    p_plan_id uuid,
    p_billing_period text,
    p_amount numeric,
    p_currency text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
BEGIN
    RETURN billing.handle_payment_subscription_success(
        p_provider, p_provider_payment_id, p_user_id,
        p_organization_id, p_plan_id, p_billing_period,
        p_amount, p_currency, p_metadata, true
    );
END;
$function$;

-- La vieja handle_upgrade_subscription_success ya es un wrapper
-- desde el script 077. La actualizamos para que llame al nombre nuevo.
CREATE OR REPLACE FUNCTION billing.handle_upgrade_subscription_success(
    p_provider text,
    p_provider_payment_id text,
    p_user_id uuid,
    p_organization_id uuid,
    p_plan_id uuid,
    p_billing_period text,
    p_amount numeric,
    p_currency text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
BEGIN
    -- DEPRECATED: usar handle_payment_upgrade_success
    RETURN billing.handle_payment_upgrade_success(
        p_provider, p_provider_payment_id, p_user_id,
        p_organization_id, p_plan_id, p_billing_period,
        p_amount, p_currency, p_metadata
    );
END;
$function$;


-- ============================================================
-- Recargar schema PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';

COMMIT;
