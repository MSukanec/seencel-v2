-- ============================================================
-- 041_create_billing_schema.sql
-- Migrar tablas del dominio billing de public → billing schema
-- 16 tablas + actualización de vistas cross-schema
-- ============================================================

-- 1. Crear schema y permisos
CREATE SCHEMA IF NOT EXISTS billing;

GRANT USAGE ON SCHEMA billing TO anon, authenticated, service_role;

-- ============================================================
-- 2. Migrar tablas (orden por dependencias FK)
-- ============================================================

-- Paso 1: Tablas raíz sin dependencias billing
ALTER TABLE IF EXISTS public.payment_events        SET SCHEMA billing;
ALTER TABLE IF EXISTS public.payment_plans         SET SCHEMA billing;
ALTER TABLE IF EXISTS public.plans                 SET SCHEMA billing;
ALTER TABLE IF EXISTS public.payments              SET SCHEMA billing;
ALTER TABLE IF EXISTS public.billing_profiles      SET SCHEMA billing;
ALTER TABLE IF EXISTS public.coupons               SET SCHEMA billing;

-- Paso 2: Tablas que dependen de plans y coupons
ALTER TABLE IF EXISTS public.coupon_plans          SET SCHEMA billing;
ALTER TABLE IF EXISTS public.coupon_courses        SET SCHEMA billing;

-- Paso 3: Tablas de suscripciones (dependen de plans, payments, coupons)
ALTER TABLE IF EXISTS public.organization_subscriptions    SET SCHEMA billing;
ALTER TABLE IF EXISTS public.organization_billing_cycles   SET SCHEMA billing;
ALTER TABLE IF EXISTS public.organization_member_events    SET SCHEMA billing;
ALTER TABLE IF EXISTS public.subscription_notifications_log SET SCHEMA billing;

-- Paso 4: Tablas de redemptions y gateways (dependen de la mayoría)
ALTER TABLE IF EXISTS public.coupon_redemptions    SET SCHEMA billing;
ALTER TABLE IF EXISTS public.bank_transfer_payments SET SCHEMA billing;
ALTER TABLE IF EXISTS public.mp_preferences        SET SCHEMA billing;
ALTER TABLE IF EXISTS public.paypal_preferences    SET SCHEMA billing;

-- ============================================================
-- 3. Permisos en tablas del nuevo schema
-- ============================================================

GRANT ALL ON ALL TABLES IN SCHEMA billing TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA billing TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA billing TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA billing
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA billing
    GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA billing
    GRANT ALL ON TABLES TO service_role;

-- ============================================================
-- 4. Recrear vistas en public que referenciaban billing tables
-- ============================================================

-- admin_organizations_view: referenciaba public.plans → ahora billing.plans
DROP VIEW IF EXISTS public.admin_organizations_view;
CREATE OR REPLACE VIEW public.admin_organizations_view AS
SELECT o.id,
    o.name,
    o.logo_url,
    o.created_at,
    o.updated_at,
    o.is_active,
    o.is_deleted,
    o.is_demo,
    o.settings,
    o.purchased_seats,
    ow.full_name AS owner_name,
    ow.email AS owner_email,
    pl.name AS plan_name,
    pl.slug AS plan_slug,
    COALESCE(mc.member_count, 0) AS member_count,
    COALESCE(pc.project_count, 0) AS project_count,
    al.last_activity_at
FROM (((((organizations o
    LEFT JOIN users ow ON ((ow.id = o.owner_id)))
    LEFT JOIN billing.plans pl ON ((pl.id = o.plan_id)))
    LEFT JOIN LATERAL ( SELECT (count(*))::integer AS member_count
            FROM organization_members om
           WHERE ((om.organization_id = o.id) AND (om.is_active = true))) mc ON (true))
    LEFT JOIN LATERAL ( SELECT (count(*))::integer AS project_count
            FROM projects p
           WHERE ((p.organization_id = o.id) AND (p.is_deleted = false))) pc ON (true))
    LEFT JOIN LATERAL ( SELECT max(oal.created_at) AS last_activity_at
            FROM organization_activity_logs oal
           WHERE (oal.organization_id = o.id)) al ON (true))
WHERE (o.is_deleted = false);

-- ============================================================
-- 5. Verificación
-- ============================================================

-- SELECT tablename FROM pg_tables WHERE schemaname = 'billing' ORDER BY tablename;
-- Debe retornar 16 tablas:
-- bank_transfer_payments, billing_profiles, coupon_courses, coupon_plans,
-- coupon_redemptions, coupons, mp_preferences, organization_billing_cycles,
-- organization_member_events, organization_subscriptions, payment_events,
-- payment_plans, payments, paypal_preferences, plans, subscription_notifications_log
