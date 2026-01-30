-- =====================================================
-- MIGRACIÓN: Labor Module Improvements
-- Fecha: 2026-01-30
-- =====================================================

-- 1. RENOMBRAR COLUMNA EN MEDIA_LINKS
-- Cambiar personnel_payment_id a labor_payment_id para consistencia
-- =====================================================
ALTER TABLE media_links 
RENAME COLUMN personnel_payment_id TO labor_payment_id;

-- Actualizar comentario de la columna
COMMENT ON COLUMN media_links.labor_payment_id IS 'FK a labor_payments para adjuntos de pagos de mano de obra';


-- 2. CREAR VISTA PROJECT_LABOR_VIEW
-- Trae todos los datos necesarios del trabajador incluyendo contacto y avatar
-- =====================================================
CREATE OR REPLACE VIEW public.project_labor_view AS
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
    
    -- Datos del tipo de labor
    lt.name AS labor_type_name,
    lt.description AS labor_type_description,
    
    -- Datos del proyecto
    proj.name AS project_name,
    
    -- Creador (miembro que lo agregó)
    om_created.id AS creator_member_id,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    
    -- Tiene adjuntos (contacto tiene archivos?)
    EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.contact_id = ct.id
    ) AS contact_has_attachments,
    
    -- Conteo de pagos totales al trabajador
    COALESCE(payment_stats.total_payments, 0) AS total_payments_count,
    COALESCE(payment_stats.total_amount, 0) AS total_amount_paid
    
FROM project_labor pl
LEFT JOIN contacts ct ON ct.id = pl.contact_id
LEFT JOIN labor_types lt ON lt.id = pl.labor_type_id
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


-- 3. ACTUALIZAR VISTA LABOR_PAYMENTS_VIEW (si usa la columna vieja)
-- La vista ya debería funcionar porque usa labor_payments.id directamente
-- Pero agregamos has_attachments para consistencia con material_payments_view
-- =====================================================
CREATE OR REPLACE VIEW public.labor_payments_view AS
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
    lt.name AS labor_type_name,
    proj.name AS project_name,
    om_created.id AS creator_member_id,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    -- NUEVO: has_attachments usando la columna renombrada
    EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.labor_payment_id = lp.id
    ) AS has_attachments
FROM labor_payments lp
LEFT JOIN currencies cur ON cur.id = lp.currency_id
LEFT JOIN organization_wallets ow ON ow.id = lp.wallet_id
LEFT JOIN wallets w ON w.id = ow.wallet_id
LEFT JOIN project_labor pl ON pl.id = lp.labor_id
LEFT JOIN contacts ct ON ct.id = pl.contact_id
LEFT JOIN labor_types lt ON lt.id = pl.labor_type_id
LEFT JOIN projects proj ON proj.id = lp.project_id
LEFT JOIN organization_members om_created ON om_created.id = lp.created_by
LEFT JOIN users u_created ON u_created.id = om_created.user_id
WHERE lp.is_deleted = false OR lp.is_deleted IS NULL;


-- 4. ACTUALIZAR UNIFIED_FINANCIAL_MOVEMENTS_VIEW
-- Usar la nueva columna labor_payment_id en lugar de personnel_payment_id
-- =====================================================
CREATE OR REPLACE VIEW public.unified_financial_movements_view AS

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
    gcp.amount * COALESCE(gcp.exchange_rate, 1) AS functional_amount,
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

-- Material Payments
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
    mp.amount * COALESCE(mp.exchange_rate, 1) AS functional_amount,
    mp.status,
    mp.wallet_id,
    w.name AS wallet_name,
    mt.name AS concept_name,
    NULL::text AS category_name,
    COALESCE(ct.display_name_override, ct.full_name, CONCAT(ct.first_name, ' ', ct.last_name)) AS contact_name,
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
LEFT JOIN contacts ct ON ct.id = mp.supplier_id
LEFT JOIN organization_members om_created ON om_created.id = mp.created_by
LEFT JOIN users u_created ON u_created.id = om_created.user_id
WHERE mp.is_deleted = false OR mp.is_deleted IS NULL

UNION ALL

-- Labor Payments (usando la columna renombrada labor_payment_id)
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
    lp.amount * COALESCE(lp.exchange_rate, 1) AS functional_amount,
    lp.status,
    lp.wallet_id,
    w.name AS wallet_name,
    lt.name AS concept_name,
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
LEFT JOIN labor_types lt ON lt.id = pl.labor_type_id
LEFT JOIN organization_members om_created ON om_created.id = lp.created_by
LEFT JOIN users u_created ON u_created.id = om_created.user_id
WHERE lp.is_deleted = false OR lp.is_deleted IS NULL;


-- 5. CREAR CARPETA EN STORAGE PARA LABOR-PAYMENTS
-- La carpeta se crea automáticamente al subir el primer archivo
-- Pero puedes agregar una política si es necesario

-- Ejemplo de política RLS para acceso a archivos de labor-payments:
-- (Solo si no existe una política genérica que ya lo cubra)
/*
CREATE POLICY "labor_payments_folder_access" ON storage.objects
FOR ALL
USING (
    bucket_id = 'private-assets'
    AND (storage.foldername(name))[1] = 'finance'
    AND (storage.foldername(name))[2] = 'labor-payments'
    AND EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid()
        AND om.organization_id = (storage.foldername(name))[3]::uuid
    )
);
*/
