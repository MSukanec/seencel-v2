-- ============================================================
-- BATCH 6: Migrate remaining views to their correct schemas
-- ============================================================
-- finance: labor_by_type_view, labor_monthly_summary_view
-- ops: ops_alerts_enriched_view, system_errors_enriched_view
-- construction: project_material_requirements_view
-- iam: organizations_view

-- ==========================================
-- 1. labor_by_type_view → finance
-- ==========================================

DROP VIEW IF EXISTS public.labor_by_type_view CASCADE;

CREATE OR REPLACE VIEW finance.labor_by_type_view AS
SELECT lp.organization_id,
    lp.project_id,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    pl.labor_type_id,
    lt.name AS labor_type_name,
    sum((lp.amount * lp.exchange_rate)) AS total_functional_amount,
    count(*) AS payments_count
   FROM ((finance.labor_payments lp
     LEFT JOIN projects.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN catalog.labor_categories lt ON ((lt.id = pl.labor_type_id)))
  WHERE ((lp.status = 'confirmed'::text) AND ((lp.is_deleted IS NULL) OR (lp.is_deleted = false)))
  GROUP BY lp.organization_id, lp.project_id, (date_trunc('month'::text, (lp.payment_date)::timestamp with time zone)), pl.labor_type_id, lt.name;

GRANT SELECT ON finance.labor_by_type_view TO authenticated, service_role;

-- ==========================================
-- 2. labor_monthly_summary_view → finance
-- ==========================================

DROP VIEW IF EXISTS public.labor_monthly_summary_view CASCADE;

CREATE OR REPLACE VIEW finance.labor_monthly_summary_view AS
SELECT lp.organization_id,
    lp.project_id,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    sum((lp.amount * lp.exchange_rate)) AS total_functional_amount,
    count(*) AS payments_count,
    count(DISTINCT lp.labor_id) AS unique_workers_count
   FROM finance.labor_payments lp
  WHERE ((lp.status = 'confirmed'::text) AND ((lp.is_deleted IS NULL) OR (lp.is_deleted = false)))
  GROUP BY lp.organization_id, lp.project_id, (date_trunc('month'::text, (lp.payment_date)::timestamp with time zone));

GRANT SELECT ON finance.labor_monthly_summary_view TO authenticated, service_role;

-- ==========================================
-- 3. ops_alerts_enriched_view → ops
-- ==========================================

DROP VIEW IF EXISTS public.ops_alerts_enriched_view CASCADE;

CREATE OR REPLACE VIEW ops.ops_alerts_enriched_view AS
SELECT oa.id,
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
    oa.user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    oa.organization_id,
    o.name AS org_name,
    pl.name AS org_plan_name,
    oa.payment_id,
    p.amount AS payment_amount,
    p.currency AS payment_currency,
    p.product_type AS payment_product_type,
    p.status AS payment_status,
    ack_u.full_name AS ack_by_name,
    res_u.full_name AS resolved_by_name
   FROM ((((((ops.ops_alerts oa
     LEFT JOIN iam.users u ON ((u.id = oa.user_id)))
     LEFT JOIN iam.organizations o ON ((o.id = oa.organization_id)))
     LEFT JOIN billing.plans pl ON ((pl.id = o.plan_id)))
     LEFT JOIN billing.payments p ON ((p.id = oa.payment_id)))
     LEFT JOIN iam.users ack_u ON ((ack_u.id = oa.ack_by)))
     LEFT JOIN iam.users res_u ON ((res_u.id = oa.resolved_by)));

GRANT SELECT ON ops.ops_alerts_enriched_view TO authenticated, service_role;

-- ==========================================
-- 4. system_errors_enriched_view → ops
-- ==========================================

DROP VIEW IF EXISTS public.system_errors_enriched_view CASCADE;

CREATE OR REPLACE VIEW ops.system_errors_enriched_view AS
SELECT sel.id,
    sel.domain,
    sel.entity,
    sel.function_name,
    sel.error_message,
    sel.context,
    sel.severity,
    sel.created_at,
    ((sel.context ->> 'user_id'::text))::uuid AS context_user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    ((sel.context ->> 'organization_id'::text))::uuid AS context_org_id,
    o.name AS org_name,
    pl.name AS plan_name,
    ((sel.context ->> 'amount'::text))::numeric AS payment_amount,
    (sel.context ->> 'currency'::text) AS payment_currency,
    (sel.context ->> 'provider'::text) AS payment_provider,
    (sel.context ->> 'course_id'::text) AS context_course_id,
    (sel.context ->> 'step'::text) AS error_step
   FROM (((audit.system_error_logs sel
     LEFT JOIN iam.users u ON ((u.id = ((sel.context ->> 'user_id'::text))::uuid)))
     LEFT JOIN iam.organizations o ON ((o.id = ((sel.context ->> 'organization_id'::text))::uuid)))
     LEFT JOIN billing.plans pl ON ((pl.id = o.plan_id)));

GRANT SELECT ON ops.system_errors_enriched_view TO authenticated, service_role;

-- ==========================================
-- 5. project_material_requirements_view → construction
-- ==========================================

DROP VIEW IF EXISTS public.project_material_requirements_view CASCADE;

CREATE OR REPLACE VIEW construction.project_material_requirements_view AS
SELECT ctms.project_id,
    ctms.organization_id,
    ctms.material_id,
    m.name AS material_name,
    u.name AS unit_name,
    m.category_id,
    mc.name AS category_name,
    (sum(ctms.quantity_planned))::numeric(20,4) AS total_required,
    count(DISTINCT ctms.construction_task_id) AS task_count,
    array_agg(DISTINCT ctms.construction_task_id) AS construction_task_ids
   FROM ((((construction.construction_task_material_snapshots ctms
     JOIN construction.construction_tasks ct ON ((ct.id = ctms.construction_task_id)))
     JOIN catalog.materials m ON ((m.id = ctms.material_id)))
     LEFT JOIN catalog.units u ON ((u.id = m.unit_id)))
     LEFT JOIN catalog.material_categories mc ON ((mc.id = m.category_id)))
  WHERE ((ct.is_deleted = false) AND (ct.status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'paused'::text])))
  GROUP BY ctms.project_id, ctms.organization_id, ctms.material_id, m.name, u.name, m.category_id, mc.name;

GRANT SELECT ON construction.project_material_requirements_view TO authenticated, service_role;

-- ==========================================
-- 6. organizations_view → iam
-- ==========================================

DROP VIEW IF EXISTS public.organizations_view CASCADE;

CREATE OR REPLACE VIEW iam.organizations_view AS
SELECT o.id,
    o.name,
    o.logo_url,
    o.owner_id,
    o.plan_id,
    o.is_active,
    o.is_deleted,
    o.deleted_at,
    o.is_demo,
    o.business_mode,
    o.settings,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.purchased_seats,
    p.name AS plan_name,
    p.slug AS plan_slug,
    p.features AS plan_features,
    u.full_name AS owner_name,
    u.email AS owner_email,
    ( SELECT (count(*))::integer AS count
           FROM iam.organization_members om
          WHERE ((om.organization_id = o.id) AND (om.is_active = true))) AS active_members_count
   FROM ((iam.organizations o
     LEFT JOIN billing.plans p ON ((o.plan_id = p.id)))
     LEFT JOIN iam.users u ON ((o.owner_id = u.id)));

GRANT SELECT ON iam.organizations_view TO authenticated, service_role;
