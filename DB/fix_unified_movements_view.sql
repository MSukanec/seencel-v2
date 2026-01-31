-- =====================================================
-- PASO 1: Agregar columna subcontract_payment_id a media_links
-- =====================================================

ALTER TABLE public.media_links 
ADD COLUMN IF NOT EXISTS subcontract_payment_id uuid NULL;

ALTER TABLE public.media_links 
ADD CONSTRAINT media_links_subcontract_payment_fkey 
FOREIGN KEY (subcontract_payment_id) 
REFERENCES subcontract_payments (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_media_links_subcontract_payment 
ON public.media_links USING btree (subcontract_payment_id) 
WHERE (subcontract_payment_id IS NOT NULL);

-- =====================================================
-- PASO 2: DROP y RECREATE vista unificada
-- =====================================================

DROP VIEW IF EXISTS public.unified_financial_movements_view CASCADE;

CREATE VIEW public.unified_financial_movements_view AS

-- =====================================================
-- 1. GENERAL COSTS PAYMENTS (Gastos Generales) - EGRESO
-- =====================================================
SELECT
    gcp.id,
    'general_cost'::text AS movement_type,
    gcp.organization_id,
    NULL::uuid AS project_id,
    gcp.payment_date,
    date_trunc('month'::text, gcp.payment_date::timestamp with time zone) AS payment_month,
    gcp.amount,
    gcp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(gcp.exchange_rate, 1::numeric) AS exchange_rate,
    gcp.amount * COALESCE(gcp.exchange_rate, 1::numeric) AS functional_amount,
    -1 AS amount_sign,
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
    (EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.general_cost_payment_id = gcp.id
    )) AS has_attachments
FROM general_costs_payments gcp
LEFT JOIN currencies cur ON cur.id = gcp.currency_id
LEFT JOIN organization_wallets ow ON ow.id = gcp.wallet_id
LEFT JOIN wallets w ON w.id = ow.wallet_id
LEFT JOIN general_costs gc ON gc.id = gcp.general_cost_id
LEFT JOIN general_cost_categories gcc ON gcc.id = gc.category_id
LEFT JOIN organization_members om_created ON om_created.id = gcp.created_by
LEFT JOIN users u_created ON u_created.id = om_created.user_id
WHERE gcp.is_deleted = false

UNION ALL

-- =====================================================
-- 2. MATERIAL PAYMENTS (Pagos de Materiales) - EGRESO
-- =====================================================
SELECT
    mp.id,
    'material_payment'::text AS movement_type,
    mp.organization_id,
    mp.project_id,
    mp.payment_date,
    date_trunc('month'::text, mp.payment_date::timestamp with time zone) AS payment_month,
    mp.amount,
    mp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(mp.exchange_rate, 1::numeric) AS exchange_rate,
    mp.amount * COALESCE(mp.exchange_rate, 1::numeric) AS functional_amount,
    -1 AS amount_sign,
    mp.status,
    mp.wallet_id,
    w.name AS wallet_name,
    mt.name AS concept_name,
    NULL::text AS category_name,
    COALESCE(prov.company_name, prov.first_name || ' ' || prov.last_name) AS contact_name,
    mp.notes,
    mp.reference,
    mp.created_at,
    mp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.material_payment_id = mp.id
    )) AS has_attachments
FROM material_payments mp
LEFT JOIN currencies cur ON cur.id = mp.currency_id
LEFT JOIN organization_wallets ow ON ow.id = mp.wallet_id
LEFT JOIN wallets w ON w.id = ow.wallet_id
LEFT JOIN material_types mt ON mt.id = mp.material_type_id
LEFT JOIN material_invoices mi ON mi.id = mp.purchase_id
LEFT JOIN contacts prov ON prov.id = mi.provider_id
LEFT JOIN organization_members om_created ON om_created.id = mp.created_by
LEFT JOIN users u_created ON u_created.id = om_created.user_id
WHERE mp.is_deleted = false OR mp.is_deleted IS NULL

UNION ALL

-- =====================================================
-- 3. LABOR PAYMENTS (Pagos de Mano de Obra) - EGRESO
-- =====================================================
SELECT
    lp.id,
    'labor_payment'::text AS movement_type,
    lp.organization_id,
    lp.project_id,
    lp.payment_date,
    date_trunc('month'::text, lp.payment_date::timestamp with time zone) AS payment_month,
    lp.amount,
    lp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(lp.exchange_rate, 1::numeric) AS exchange_rate,
    lp.amount * COALESCE(lp.exchange_rate, 1::numeric) AS functional_amount,
    -1 AS amount_sign,
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
    (EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.labor_payment_id = lp.id
    )) AS has_attachments
FROM labor_payments lp
LEFT JOIN currencies cur ON cur.id = lp.currency_id
LEFT JOIN organization_wallets ow ON ow.id = lp.wallet_id
LEFT JOIN wallets w ON w.id = ow.wallet_id
LEFT JOIN project_labor pl ON pl.id = lp.labor_id
LEFT JOIN contacts ct ON ct.id = pl.contact_id
LEFT JOIN labor_categories lc ON lc.id = pl.labor_type_id
LEFT JOIN organization_members om_created ON om_created.id = lp.created_by
LEFT JOIN users u_created ON u_created.id = om_created.user_id
WHERE lp.is_deleted = false OR lp.is_deleted IS NULL

UNION ALL

-- =====================================================
-- 4. SUBCONTRACT PAYMENTS (Pagos de Subcontratos) - EGRESO
-- =====================================================
SELECT
    sp.id,
    'subcontract_payment'::text AS movement_type,
    sp.organization_id,
    sp.project_id,
    sp.payment_date,
    date_trunc('month'::text, sp.payment_date::timestamp with time zone) AS payment_month,
    sp.amount,
    sp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(sp.exchange_rate, 1::numeric) AS exchange_rate,
    sp.amount * COALESCE(sp.exchange_rate, 1::numeric) AS functional_amount,
    -1 AS amount_sign,
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
    (EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.subcontract_payment_id = sp.id
    )) AS has_attachments
FROM subcontract_payments sp
LEFT JOIN currencies cur ON cur.id = sp.currency_id
LEFT JOIN organization_wallets ow ON ow.id = sp.wallet_id
LEFT JOIN wallets w ON w.id = ow.wallet_id
LEFT JOIN subcontracts s ON s.id = sp.subcontract_id
LEFT JOIN contacts ct ON ct.id = s.contact_id
LEFT JOIN organization_members om_created ON om_created.id = sp.created_by
LEFT JOIN users u_created ON u_created.id = om_created.user_id
WHERE sp.is_deleted = false OR sp.is_deleted IS NULL

UNION ALL

-- =====================================================
-- 5. CLIENT PAYMENTS (Cobros de Clientes) - INGRESO
-- =====================================================
SELECT
    cp.id,
    'client_payment'::text AS movement_type,
    cp.organization_id,
    cp.project_id,
    cp.payment_date,
    date_trunc('month'::text, cp.payment_date::timestamp with time zone) AS payment_month,
    cp.amount,
    cp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(cp.exchange_rate, 1::numeric) AS exchange_rate,
    cp.amount * COALESCE(cp.exchange_rate, 1::numeric) AS functional_amount,
    1 AS amount_sign,  -- INGRESO (positivo)
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
    (EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.client_payment_id = cp.id
    )) AS has_attachments
FROM client_payments cp
LEFT JOIN currencies cur ON cur.id = cp.currency_id
LEFT JOIN organization_wallets ow ON ow.id = cp.wallet_id
LEFT JOIN wallets w ON w.id = ow.wallet_id
LEFT JOIN project_clients pc ON pc.id = cp.client_id
LEFT JOIN contacts ct ON ct.id = pc.contact_id
LEFT JOIN client_commitments cc ON cc.id = cp.commitment_id
LEFT JOIN organization_members om_created ON om_created.id = cp.created_by
LEFT JOIN users u_created ON u_created.id = om_created.user_id
WHERE cp.is_deleted = false OR cp.is_deleted IS NULL;

-- =====================================================
-- Verificación: Consulta de prueba
-- =====================================================
-- SELECT movement_type, amount_sign, count(*), sum(amount) 
-- FROM unified_financial_movements_view 
-- GROUP BY movement_type, amount_sign
-- ORDER BY movement_type;
