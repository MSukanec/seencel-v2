-- ============================================================
-- MONITORING ENRICHED VIEWS
-- Resuelven UUIDs a nombres humanos para el panel de admin
-- ============================================================

-- ============================================================
-- 1. system_errors_enriched_view
-- JOIN de system_error_logs con users, organizations, plans
-- Extrae user_id y organization_id del campo context JSONB
-- NOTA: user_id en context puede ser auth_id (Supabase Auth)
--       por eso se hace JOIN doble: por users.id y por users.auth_id
-- ============================================================
CREATE OR REPLACE VIEW public.system_errors_enriched_view AS
SELECT
    sel.id,
    sel.domain,
    sel.entity,
    sel.function_name,
    sel.error_message,
    sel.context,
    sel.severity,
    sel.created_at,

    -- Resuelve user_id del context JSONB
    -- Intentar primero como users.id, si no como auth_id
    COALESCE(u_by_id.id, u_by_auth.id) AS resolved_user_id,
    COALESCE(u_by_id.email, u_by_auth.email) AS user_email,
    COALESCE(u_by_id.full_name, u_by_auth.full_name) AS user_name,

    -- Resuelve organization_id del context JSONB
    (sel.context->>'organization_id')::uuid AS context_org_id,
    o.name AS org_name,
    pl.name AS plan_name,

    -- Info de pago si existe en context
    (sel.context->>'amount')::numeric AS payment_amount,
    sel.context->>'currency' AS payment_currency,
    sel.context->>'provider' AS payment_provider,
    sel.context->>'course_id' AS context_course_id,
    sel.context->>'step' AS error_step

FROM public.system_error_logs sel

-- JOIN por users.id (si el context tiene users.id)
LEFT JOIN public.users u_by_id
    ON u_by_id.id = (sel.context->>'user_id')::uuid

-- JOIN por users.auth_id (si el context tiene auth_id en vez de users.id)
LEFT JOIN public.users u_by_auth
    ON u_by_auth.auth_id = (sel.context->>'user_id')::uuid
    AND u_by_id.id IS NULL  -- Solo si el primer JOIN no matcheó

LEFT JOIN public.organizations o
    ON o.id = (sel.context->>'organization_id')::uuid

LEFT JOIN public.plans pl
    ON pl.id = o.plan_id;


-- ============================================================
-- 2. ops_alerts_enriched_view
-- JOIN de ops_alerts con users, organizations, plans, payments
-- ============================================================
CREATE OR REPLACE VIEW public.ops_alerts_enriched_view AS
SELECT
    oa.id,
    oa.created_at,
    oa.updated_at,
    oa.severity,
    oa.status,
    oa.alert_type,
    oa.title,
    oa.description,
    oa.provider,
    oa.provider_payment_id,
    oa.fingerprint,
    oa.evidence,
    oa.ack_at,
    oa.resolved_at,

    -- Datos del usuario afectado
    oa.user_id,
    u.email AS user_email,
    u.full_name AS user_name,

    -- Datos de la organización afectada
    oa.organization_id,
    o.name AS org_name,
    pl.name AS org_plan_name,

    -- Datos del pago relacionado
    oa.payment_id,
    p.amount AS payment_amount,
    p.currency AS payment_currency,
    p.product_type AS payment_product_type,
    p.status AS payment_status,

    -- Quién acknowledgeó
    ack_u.full_name AS ack_by_name,

    -- Quién resolvió
    res_u.full_name AS resolved_by_name

FROM public.ops_alerts oa

LEFT JOIN public.users u
    ON u.id = oa.user_id

LEFT JOIN public.organizations o
    ON o.id = oa.organization_id

LEFT JOIN public.plans pl
    ON pl.id = o.plan_id

LEFT JOIN public.payments p
    ON p.id = oa.payment_id

LEFT JOIN public.users ack_u
    ON ack_u.id = oa.ack_by

LEFT JOIN public.users res_u
    ON res_u.id = oa.resolved_by;
