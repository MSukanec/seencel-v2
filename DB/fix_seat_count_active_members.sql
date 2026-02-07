CREATE OR REPLACE FUNCTION public.get_organization_seat_status(p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;
