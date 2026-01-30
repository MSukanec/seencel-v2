-- =====================================================
-- MIGRACIÓN: Actualizar vistas para labor_categories
-- Fecha: 2026-01-30 (PARTE 2 - SOLO VISTAS)
-- =====================================================

-- 8.1 Actualizar project_labor_view
DROP VIEW IF EXISTS public.project_labor_view;
CREATE VIEW public.project_labor_view AS
SELECT 
    pl.id,
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
    
    -- Datos del contacto
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    ct.full_name AS contact_full_name,
    COALESCE(
        ct.display_name_override,
        ct.full_name,
        CONCAT(ct.first_name, ' ', ct.last_name)
    ) AS contact_display_name,
    ct.national_id AS contact_national_id,
    ct.phone AS contact_phone,
    ct.email AS contact_email,
    ct.image_url AS contact_image_url,
    
    -- Datos del tipo de labor (ahora de labor_categories)
    lc.name AS labor_type_name,
    lc.description AS labor_type_description,
    
    -- Datos del proyecto
    proj.name AS project_name,
    
    -- Creador
    om_created.id AS creator_member_id,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    
    -- Tiene adjuntos
    EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.contact_id = ct.id
    ) AS contact_has_attachments,
    
    -- Conteo de pagos totales
    COALESCE(payment_stats.total_payments, 0) AS total_payments_count,
    COALESCE(payment_stats.total_amount, 0) AS total_amount_paid
    
FROM project_labor pl
LEFT JOIN contacts ct ON ct.id = pl.contact_id
LEFT JOIN labor_categories lc ON lc.id = pl.labor_type_id
LEFT JOIN projects proj ON proj.id = pl.project_id
LEFT JOIN organization_members om_created ON om_created.id = pl.created_by
LEFT JOIN users u_created ON u_created.id = om_created.user_id
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*)::int AS total_payments,
        SUM(lp.amount) AS total_amount
    FROM labor_payments lp
    WHERE lp.labor_id = pl.id
      AND (lp.is_deleted = false OR lp.is_deleted IS NULL)
      AND lp.status = 'confirmed'
) payment_stats ON true
WHERE pl.is_deleted = false;


-- 8.2 Actualizar labor_payments_view
DROP VIEW IF EXISTS public.labor_payments_view;
CREATE VIEW public.labor_payments_view AS
SELECT
    lp.id,
    lp.organization_id,
    lp.project_id,
    lp.labor_id,
    lp.payment_date,
    date_trunc('month'::text, lp.payment_date::timestamp with time zone) AS payment_month,
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
    lp.amount * lp.exchange_rate AS functional_amount,
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
    COALESCE(
        ct.display_name_override,
        ct.full_name,
        CONCAT(ct.first_name, ' ', ct.last_name)
    ) AS contact_display_name,
    ct.national_id AS contact_national_id,
    ct.phone AS contact_phone,
    ct.email AS contact_email,
    ct.image_url AS contact_image_url,
    lc.name AS labor_type_name,
    proj.name AS project_name,
    om_created.id AS creator_member_id,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.labor_payment_id = lp.id
    ) AS has_attachments
FROM labor_payments lp
LEFT JOIN currencies cur ON cur.id = lp.currency_id
LEFT JOIN organization_wallets ow ON ow.id = lp.wallet_id
LEFT JOIN wallets w ON w.id = ow.wallet_id
LEFT JOIN project_labor pl ON pl.id = lp.labor_id
LEFT JOIN contacts ct ON ct.id = pl.contact_id
LEFT JOIN labor_categories lc ON lc.id = pl.labor_type_id
LEFT JOIN projects proj ON proj.id = lp.project_id
LEFT JOIN organization_members om_created ON om_created.id = lp.created_by
LEFT JOIN users u_created ON u_created.id = om_created.user_id
WHERE lp.is_deleted = false OR lp.is_deleted IS NULL;


-- 8.3 Actualizar unified_financial_movements_view
-- NOTA: material_payments NO tiene supplier_id, el contact viene de material_invoices.provider_id
DROP VIEW IF EXISTS public.unified_financial_movements_view;
CREATE VIEW public.unified_financial_movements_view AS

-- General Costs
SELECT
    gcp.id,
    'general_cost'::text AS movement_type,
    gcp.organization_id,
    NULL::uuid AS project_id,
    gcp.payment_date AS date,
    date_trunc('month'::text, gcp.payment_date::timestamp with time zone) AS payment_month,
    gcp.amount,
    gcp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    gcp.exchange_rate,
    gcp.amount * COALESCE(gcp.exchange_rate, 1::numeric) AS functional_amount,
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
    EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.general_cost_payment_id = gcp.id
    ) AS has_attachments
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

-- Material Payments (contact viene de material_invoices.provider_id, NO de mp.supplier_id)
SELECT
    mp.id,
    'material_payment'::text AS movement_type,
    mp.organization_id,
    mp.project_id,
    mp.payment_date AS date,
    date_trunc('month'::text, mp.payment_date::timestamp with time zone) AS payment_month,
    mp.amount,
    mp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    mp.exchange_rate,
    mp.amount * COALESCE(mp.exchange_rate, 1::numeric) AS functional_amount,
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
    EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.material_payment_id = mp.id
    ) AS has_attachments
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

-- Labor Payments (usando labor_categories en vez de labor_types)
SELECT
    lp.id,
    'labor_payment'::text AS movement_type,
    lp.organization_id,
    lp.project_id,
    lp.payment_date AS date,
    date_trunc('month'::text, lp.payment_date::timestamp with time zone) AS payment_month,
    lp.amount,
    lp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    lp.exchange_rate,
    lp.amount * COALESCE(lp.exchange_rate, 1::numeric) AS functional_amount,
    lp.status,
    lp.wallet_id,
    w.name AS wallet_name,
    lc.name AS concept_name,
    NULL::text AS category_name,
    COALESCE(ct.display_name_override, ct.full_name, CONCAT(ct.first_name, ' ', ct.last_name)) AS contact_name,
    lp.notes,
    lp.reference,
    lp.created_at,
    lp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.labor_payment_id = lp.id
    ) AS has_attachments
FROM labor_payments lp
LEFT JOIN currencies cur ON cur.id = lp.currency_id
LEFT JOIN organization_wallets ow ON ow.id = lp.wallet_id
LEFT JOIN wallets w ON w.id = ow.wallet_id
LEFT JOIN project_labor pl ON pl.id = lp.labor_id
LEFT JOIN contacts ct ON ct.id = pl.contact_id
LEFT JOIN labor_categories lc ON lc.id = pl.labor_type_id
LEFT JOIN organization_members om_created ON om_created.id = lp.created_by
LEFT JOIN users u_created ON u_created.id = om_created.user_id
WHERE lp.is_deleted = false OR lp.is_deleted IS NULL;


-- 9. COMENTARIOS
COMMENT ON TABLE public.labor_categories IS 'Categorías de trabajo para mano de obra. Puede ser de sistema (is_system=true, org_id=null) o de organización (is_system=false, org_id=UUID)';
COMMENT ON COLUMN public.labor_categories.is_system IS 'Si es true, es una categoría predefinida del sistema visible para todas las orgs';
COMMENT ON COLUMN public.labor_categories.organization_id IS 'NULL para categorías de sistema, UUID para categorías específicas de una org';
