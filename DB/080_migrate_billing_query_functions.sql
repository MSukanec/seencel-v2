-- ==========================================
-- 080: Migrar funciones de consulta billing a schema billing
-- ==========================================
-- Mueve get_organization_seat_status, get_upgrade_proration y
-- check_active_project_limit de public a billing.
-- Corrige referencias a public.organizations → iam.organizations
-- y public.plans / public.organization_subscriptions → billing.*
-- ==========================================

-- ==========================================
-- 1. billing.get_organization_seat_status
-- ==========================================
-- ORIGINAL: public.get_organization_seat_status
-- BUGS CORREGIDOS:
--   - public.organizations → iam.organizations
--   - public.organization_subscriptions → billing.organization_subscriptions (ya estaba con billing. pero por search_path)
-- ==========================================

CREATE OR REPLACE FUNCTION billing.get_organization_seat_status(p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'iam', 'public'
AS $function$
DECLARE
    v_seats_included integer;
    v_max_members integer;
    v_purchased_seats integer;
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
    SELECT 
        COALESCE((p.features->>'seats_included')::integer, 1),
        COALESCE((p.features->>'max_members')::integer, 999),
        COALESCE(p.monthly_amount, 0),
        COALESCE(p.annual_amount, 0),
        p.slug
    INTO v_seats_included, v_max_members, v_plan_price_monthly, v_plan_price_annual, v_plan_slug
    FROM iam.organizations o
    JOIN billing.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    SELECT COALESCE(purchased_seats, 0)
    INTO v_purchased_seats
    FROM iam.organizations
    WHERE id = p_organization_id;

    SELECT COUNT(*)
    INTO v_current_members
    FROM iam.organization_members
    WHERE organization_id = p_organization_id
      AND is_active = true;

    SELECT COUNT(*)
    INTO v_pending_invitations
    FROM iam.organization_invitations
    WHERE organization_id = p_organization_id
      AND status IN ('pending', 'registered');

    v_total_capacity := v_seats_included + v_purchased_seats;
    v_available_seats := v_total_capacity - (v_current_members + v_pending_invitations);
    v_can_buy_more := (v_total_capacity < v_max_members);

    SELECT 
        s.billing_period,
        s.expires_at
    INTO v_billing_period, v_expires_at
    FROM billing.organization_subscriptions s
    WHERE s.organization_id = p_organization_id
      AND s.status = 'active'
    LIMIT 1;

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
        'seats_included', v_seats_included,
        'max_members', v_max_members,
        'purchased', v_purchased_seats,
        'total_capacity', v_total_capacity,
        'used', v_current_members,
        'pending_invitations', v_pending_invitations,
        'available', GREATEST(v_available_seats, 0),
        'can_invite', v_available_seats > 0,
        'can_buy_more', v_can_buy_more,
        'seat_price_monthly', v_plan_price_monthly,
        'seat_price_annual', v_plan_price_annual,
        'plan_slug', v_plan_slug,
        'billing_period', v_billing_period,
        'expires_at', v_expires_at,
        'days_remaining', v_days_remaining,
        'prorated_monthly', v_prorated_price_monthly,
        'prorated_annual', v_prorated_price_annual
    );
END;
$function$;

-- Drop legacy version
DROP FUNCTION IF EXISTS public.get_organization_seat_status(uuid);

-- ==========================================
-- 2. billing.get_upgrade_proration
-- ==========================================
-- ORIGINAL: public.get_upgrade_proration
-- BUGS CORREGIDOS:
--   - public.organizations → iam.organizations
--   - public.plans → billing.plans
--   - public.organization_subscriptions → billing.organization_subscriptions
-- ==========================================

CREATE OR REPLACE FUNCTION billing.get_upgrade_proration(p_organization_id uuid, p_target_plan_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'iam', 'public'
AS $function$
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
    v_started_at timestamptz;
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
    -- 1) Obtener plan actual de la organización
    SELECT 
        o.plan_id,
        p.slug,
        p.name,
        COALESCE(p.monthly_amount, 0),
        COALESCE(p.annual_amount, 0)
    INTO v_current_plan_id, v_current_plan_slug, v_current_plan_name,
         v_current_monthly, v_current_annual
    FROM iam.organizations o
    JOIN billing.plans p ON p.id = o.plan_id
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
    
    -- 2) Obtener plan destino
    SELECT 
        slug,
        name,
        COALESCE(monthly_amount, 0),
        COALESCE(annual_amount, 0)
    INTO v_target_plan_slug, v_target_plan_name,
         v_target_monthly, v_target_annual
    FROM billing.plans
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
    
    -- 3) Obtener suscripción activa
    SELECT 
        s.id,
        s.billing_period,
        s.started_at,
        s.expires_at,
        s.amount
    INTO v_subscription_id, v_billing_period, v_started_at, v_expires_at, v_subscription_amount
    FROM billing.organization_subscriptions s
    WHERE s.organization_id = p_organization_id
      AND s.status = 'active'
    LIMIT 1;
    
    IF v_subscription_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'NO_ACTIVE_SUBSCRIPTION'
        );
    END IF;
    
    -- 4) Calcular prorrateo
    v_days_remaining := GREATEST(0, (v_expires_at::date - CURRENT_DATE));
    v_period_total_days := GREATEST(1, (v_expires_at::date - v_started_at::date));
    
    v_credit := ROUND(
        (CASE WHEN v_billing_period = 'monthly' THEN v_current_monthly ELSE v_current_annual END)
        * (v_days_remaining::numeric / v_period_total_days::numeric),
        2
    );
    
    IF v_billing_period = 'monthly' THEN
        v_target_price := v_target_monthly;
    ELSE
        v_target_price := v_target_annual;
    END IF;
    
    v_upgrade_price := GREATEST(0.01, v_target_price - v_credit);
    
    -- 5) Retornar resultado
    RETURN jsonb_build_object(
        'ok', true,
        'current_plan_id', v_current_plan_id,
        'current_plan_slug', v_current_plan_slug,
        'current_plan_name', v_current_plan_name,
        'target_plan_id', p_target_plan_id,
        'target_plan_slug', v_target_plan_slug,
        'target_plan_name', v_target_plan_name,
        'target_price', v_target_price,
        'subscription_id', v_subscription_id,
        'billing_period', v_billing_period,
        'expires_at', v_expires_at,
        'subscription_amount', v_subscription_amount,
        'days_remaining', v_days_remaining,
        'period_total_days', v_period_total_days,
        'credit', v_credit,
        'upgrade_price', v_upgrade_price
    );
END;
$function$;

-- Drop legacy version
DROP FUNCTION IF EXISTS public.get_upgrade_proration(uuid, uuid);

-- ==========================================
-- 3. billing.check_active_project_limit
-- ==========================================
-- ORIGINAL: public.check_active_project_limit
-- BUGS CORREGIDOS:
--   - public.organizations → iam.organizations
-- ==========================================

CREATE OR REPLACE FUNCTION billing.check_active_project_limit(p_organization_id uuid, p_excluded_project_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'iam', 'public'
AS $function$
DECLARE
    v_current_count INT;
    v_max_allowed INT;
    v_plan_features JSONB;
BEGIN
    SELECT COUNT(*)
    INTO v_current_count
    FROM public.projects
    WHERE organization_id = p_organization_id
      AND status = 'active'
      AND is_deleted = false
      AND (p_excluded_project_id IS NULL OR id != p_excluded_project_id);

    SELECT p.features
    INTO v_plan_features
    FROM iam.organizations o
    JOIN billing.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    IF v_plan_features IS NULL THEN
        v_max_allowed := -1;
    ELSE
        v_max_allowed := COALESCE((v_plan_features->>'max_active_projects')::INT, -1);
    END IF;

    RETURN json_build_object(
        'allowed', (v_max_allowed = -1 OR v_current_count < v_max_allowed),
        'current_active_count', v_current_count,
        'max_allowed', v_max_allowed
    );
END;
$function$;

-- Drop legacy version
DROP FUNCTION IF EXISTS public.check_active_project_limit(uuid, uuid);

-- ==========================================
-- 4. PERMISOS
-- ==========================================
-- El schema billing ya existe y tiene permisos.
-- Solo necesitamos asegurar que las nuevas funciones son accesibles.
GRANT EXECUTE ON FUNCTION billing.get_organization_seat_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION billing.get_upgrade_proration(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION billing.check_active_project_limit(uuid, uuid) TO authenticated, service_role;

-- ==========================================
-- 5. VERIFICACIÓN
-- ==========================================
-- Ejecutar después para verificar:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'billing' AND routine_name IN (
--   'get_organization_seat_status', 'get_upgrade_proration', 'check_active_project_limit'
-- );
