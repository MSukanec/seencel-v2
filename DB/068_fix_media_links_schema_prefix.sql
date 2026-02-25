-- ============================================================
-- 068: Fix cross-schema references: media_links → public.media_links
-- ============================================================
-- Todas estas vistas usan `FROM media_links` sin schema prefix.
-- Como están en schemas no-public (finance, projects), Postgres
-- podría no encontrar la tabla si el search_path no incluye public.
-- Con SECURITY INVOKER esto es especialmente problemático.
-- ============================================================

-- ============================
-- 1. finance.general_costs_payments_view
-- ============================
DROP VIEW IF EXISTS finance.general_costs_payments_view;
CREATE VIEW finance.general_costs_payments_view
WITH (security_invoker = true)
AS
SELECT gcp.id,
    gcp.organization_id,
    gcp.payment_date,
    date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone) AS payment_month,
    gcp.amount,
    gcp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(gcp.exchange_rate, (1)::numeric) AS exchange_rate,
    gcp.status,
    gcp.wallet_id,
    w.name AS wallet_name,
    gcp.notes,
    gcp.reference,
    gc.id AS general_cost_id,
    gc.name AS general_cost_name,
    gc.is_recurring,
    gc.recurrence_interval,
    gcc.id AS category_id,
    gcc.name AS category_name,
    gcp.created_by,
    u.full_name AS creator_full_name,
    u.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM public.media_links ml
          WHERE (ml.general_cost_payment_id = gcp.id))) AS has_attachments
   FROM ((((((finance.general_costs_payments gcp
     LEFT JOIN finance.general_costs gc ON ((gc.id = gcp.general_cost_id)))
     LEFT JOIN finance.general_cost_categories gcc ON ((gcc.id = gc.category_id)))
     LEFT JOIN iam.organization_members om ON ((om.id = gcp.created_by)))
     LEFT JOIN iam.users u ON ((u.id = om.user_id)))
     LEFT JOIN finance.wallets w ON ((w.id = gcp.wallet_id)))
     LEFT JOIN finance.currencies cur ON ((cur.id = gcp.currency_id)))
  WHERE (gcp.is_deleted = false);

-- ============================
-- 2. finance.labor_payments_view
-- ============================
DROP VIEW IF EXISTS finance.labor_payments_view;
CREATE VIEW finance.labor_payments_view
WITH (security_invoker = true)
AS
SELECT lp.id,
    lp.organization_id,
    lp.project_id,
    lp.labor_id,
    lp.payment_date,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    lp.amount,
    lp.currency_id,
    lp.exchange_rate,
    lp.status,
    lp.wallet_id,
    lp.notes,
    lp.reference,
    lp.created_at,
    lp.updated_at,
    lp.created_by,
    lp.updated_by,
    lp.is_deleted,
    lp.deleted_at,
    lp.import_batch_id,
    (lp.amount * lp.exchange_rate) AS functional_amount,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    cur.name AS currency_name,
    ow.id AS org_wallet_id,
    w.name AS wallet_name,
    pl.contact_id,
    pl.labor_type_id,
    pl.status AS labor_status,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    ct.national_id AS contact_national_id,
    ct.phone AS contact_phone,
    ct.email AS contact_email,
    ct.image_url AS contact_image_url,
    lc.name AS labor_type_name,
    proj.name AS project_name,
    om_created.id AS creator_member_id,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM public.media_links ml
          WHERE (ml.labor_payment_id = lp.id))) AS has_attachments
   FROM (((((((((finance.labor_payments lp
     LEFT JOIN finance.currencies cur ON ((cur.id = lp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = lp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN projects.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN contacts.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = lp.project_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = lp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((lp.is_deleted = false) OR (lp.is_deleted IS NULL));

-- ============================
-- 3. finance.material_payments_view
-- ============================
DROP VIEW IF EXISTS finance.material_payments_view;
CREATE VIEW finance.material_payments_view
WITH (security_invoker = true)
AS
SELECT mp.id,
    mp.organization_id,
    mp.project_id,
    mp.payment_date,
    date_trunc('month'::text, (mp.payment_date)::timestamp with time zone) AS payment_month,
    mp.amount,
    mp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(mp.exchange_rate, (1)::numeric) AS exchange_rate,
    mp.status,
    mp.wallet_id,
    w.name AS wallet_name,
    mp.notes,
    mp.reference,
    mp.purchase_id,
    mi.invoice_number,
    mi.provider_id,
    COALESCE(prov.company_name, ((prov.first_name || ' '::text) || prov.last_name)) AS provider_name,
    p.name AS project_name,
    mp.material_type_id,
    mt.name AS material_type_name,
    mp.created_by,
    u.full_name AS creator_full_name,
    u.avatar_url AS creator_avatar_url,
    mp.created_at,
    mp.updated_at,
    (EXISTS ( SELECT 1
           FROM public.media_links ml
          WHERE (ml.material_payment_id = mp.id))) AS has_attachments
   FROM (((((((((finance.material_payments mp
     LEFT JOIN finance.material_invoices mi ON ((mi.id = mp.purchase_id)))
     LEFT JOIN contacts.contacts prov ON ((prov.id = mi.provider_id)))
     LEFT JOIN projects.projects p ON ((p.id = mp.project_id)))
     LEFT JOIN iam.organization_members om ON ((om.id = mp.created_by)))
     LEFT JOIN iam.users u ON ((u.id = om.user_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = mp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.currencies cur ON ((cur.id = mp.currency_id)))
     LEFT JOIN catalog.material_types mt ON ((mt.id = mp.material_type_id)))
  WHERE ((mp.is_deleted = false) OR (mp.is_deleted IS NULL));

-- ============================
-- 4. finance.unified_financial_movements_view
-- (Tiene 5 subqueries con media_links en cada UNION ALL)
-- ============================
DROP VIEW IF EXISTS finance.unified_financial_movements_view;
CREATE VIEW finance.unified_financial_movements_view
WITH (security_invoker = true)
AS
-- GENERAL COSTS
SELECT gcp.id,
    'general_cost'::text AS movement_type,
    gcp.organization_id,
    NULL::uuid AS project_id,
    gcp.payment_date,
    date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone) AS payment_month,
    gcp.amount,
    gcp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(gcp.exchange_rate, (1)::numeric) AS exchange_rate,
    (gcp.amount * COALESCE(gcp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    gcp.status,
    gcp.wallet_id,
    w.name AS wallet_name,
    gc.name AS concept_name,
    gcc.name AS category_name,
    NULL::text AS contact_name,
    gcp.notes,
    gcp.reference,
    gcp.created_at,
    gcp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM public.media_links ml
          WHERE (ml.general_cost_payment_id = gcp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM (((((((finance.general_costs_payments gcp
     LEFT JOIN finance.currencies cur ON ((cur.id = gcp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = gcp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.general_costs gc ON ((gc.id = gcp.general_cost_id)))
     LEFT JOIN finance.general_cost_categories gcc ON ((gcc.id = gc.category_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = gcp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE (gcp.is_deleted = false)
UNION ALL
-- MATERIAL PAYMENTS
 SELECT mp.id,
    'material_payment'::text AS movement_type,
    mp.organization_id,
    mp.project_id,
    mp.payment_date,
    date_trunc('month'::text, (mp.payment_date)::timestamp with time zone) AS payment_month,
    mp.amount,
    mp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(mp.exchange_rate, (1)::numeric) AS exchange_rate,
    (mp.amount * COALESCE(mp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    mp.status,
    mp.wallet_id,
    w.name AS wallet_name,
    mt.name AS concept_name,
    NULL::text AS category_name,
    COALESCE(prov.company_name, ((prov.first_name || ' '::text) || prov.last_name)) AS contact_name,
    mp.notes,
    mp.reference,
    mp.created_at,
    mp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM public.media_links ml
          WHERE (ml.material_payment_id = mp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM ((((((((finance.material_payments mp
     LEFT JOIN finance.currencies cur ON ((cur.id = mp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = mp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN catalog.material_types mt ON ((mt.id = mp.material_type_id)))
     LEFT JOIN finance.material_invoices mi ON ((mi.id = mp.purchase_id)))
     LEFT JOIN contacts.contacts prov ON ((prov.id = mi.provider_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = mp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((mp.is_deleted = false) OR (mp.is_deleted IS NULL))
UNION ALL
-- LABOR PAYMENTS
 SELECT lp.id,
    'labor_payment'::text AS movement_type,
    lp.organization_id,
    lp.project_id,
    lp.payment_date,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    lp.amount,
    lp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(lp.exchange_rate, (1)::numeric) AS exchange_rate,
    (lp.amount * COALESCE(lp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    lp.status,
    lp.wallet_id,
    w.name AS wallet_name,
    lc.name AS concept_name,
    NULL::text AS category_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_name,
    lp.notes,
    lp.reference,
    lp.created_at,
    lp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM public.media_links ml
          WHERE (ml.labor_payment_id = lp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM ((((((((finance.labor_payments lp
     LEFT JOIN finance.currencies cur ON ((cur.id = lp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = lp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN projects.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN contacts.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = lp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((lp.is_deleted = false) OR (lp.is_deleted IS NULL))
UNION ALL
-- SUBCONTRACT PAYMENTS
 SELECT sp.id,
    'subcontract_payment'::text AS movement_type,
    sp.organization_id,
    sp.project_id,
    sp.payment_date,
    date_trunc('month'::text, (sp.payment_date)::timestamp with time zone) AS payment_month,
    sp.amount,
    sp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(sp.exchange_rate, (1)::numeric) AS exchange_rate,
    (sp.amount * COALESCE(sp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    sp.status,
    sp.wallet_id,
    w.name AS wallet_name,
    s.title AS concept_name,
    NULL::text AS category_name,
    COALESCE(ct.full_name, ct.company_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_name,
    sp.notes,
    sp.reference,
    sp.created_at,
    sp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM public.media_links ml
          WHERE (ml.subcontract_payment_id = sp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM (((((((finance.subcontract_payments sp
     LEFT JOIN finance.currencies cur ON ((cur.id = sp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = sp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.subcontracts s ON ((s.id = sp.subcontract_id)))
     LEFT JOIN contacts.contacts ct ON ((ct.id = s.contact_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = sp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((sp.is_deleted = false) OR (sp.is_deleted IS NULL))
UNION ALL
-- CLIENT PAYMENTS
 SELECT cp.id,
    'client_payment'::text AS movement_type,
    cp.organization_id,
    cp.project_id,
    cp.payment_date,
    date_trunc('month'::text, (cp.payment_date)::timestamp with time zone) AS payment_month,
    cp.amount,
    cp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(cp.exchange_rate, (1)::numeric) AS exchange_rate,
    (cp.amount * COALESCE(cp.exchange_rate, (1)::numeric)) AS functional_amount,
    1 AS amount_sign,
    cp.status,
    cp.wallet_id,
    w.name AS wallet_name,
    cc.concept AS concept_name,
    NULL::text AS category_name,
    COALESCE(ct.full_name, ct.company_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_name,
    cp.notes,
    cp.reference,
    cp.created_at,
    cp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM public.media_links ml
          WHERE (ml.client_payment_id = cp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM ((((((((finance.client_payments cp
     LEFT JOIN finance.currencies cur ON ((cur.id = cp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = cp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN projects.project_clients pc ON ((pc.id = cp.client_id)))
     LEFT JOIN contacts.contacts ct ON ((ct.id = pc.contact_id)))
     LEFT JOIN finance.client_commitments cc ON ((cc.id = cp.commitment_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = cp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((cp.is_deleted = false) OR (cp.is_deleted IS NULL));

-- ============================
-- 5. projects.project_labor_view
-- ============================
DROP VIEW IF EXISTS projects.project_labor_view;
CREATE VIEW projects.project_labor_view
WITH (security_invoker = true)
AS
SELECT pl.id,
    pl.project_id,
    pl.organization_id,
    pl.contact_id,
    pl.labor_type_id,
    pl.status,
    pl.notes,
    pl.start_date,
    pl.end_date,
    pl.created_at,
    pl.updated_at,
    pl.created_by,
    pl.updated_by,
    pl.is_deleted,
    pl.deleted_at,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    ct.full_name AS contact_full_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    ct.national_id AS contact_national_id,
    ct.phone AS contact_phone,
    ct.email AS contact_email,
    ct.image_url AS contact_image_url,
    lc.name AS labor_type_name,
    lc.description AS labor_type_description,
    proj.name AS project_name,
    om_created.id AS creator_member_id,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM public.media_links ml
          WHERE (ml.contact_id = ct.id))) AS contact_has_attachments,
    COALESCE(payment_stats.total_payments, 0) AS total_payments_count,
    COALESCE(payment_stats.total_amount, (0)::numeric) AS total_amount_paid
   FROM ((((((projects.project_labor pl
     LEFT JOIN contacts.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = pl.project_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = pl.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS total_payments,
            sum(lp.amount) AS total_amount
           FROM finance.labor_payments lp
          WHERE ((lp.labor_id = pl.id) AND ((lp.is_deleted = false) OR (lp.is_deleted IS NULL)) AND (lp.status = 'confirmed'::text))) payment_stats ON (true))
  WHERE (pl.is_deleted = false);

-- ============================================================
-- IMPORTANTE: Después de ejecutar, recargar el schema cache de PostgREST:
-- En Supabase Dashboard: Settings > API > Reload Schema Cache
-- O enviar: NOTIFY pgrst, 'reload schema';
-- 
-- Luego ejecutar el introspector:
-- node scripts/introspect-db.mjs
-- ============================================================
