-- =============================================================
-- MIGRACIÓN: Crear schema 'construction' y mover entidades del
-- core de construcción/presupuestos
-- =============================================================
-- Opción B: Schema client directo
--   - Las tablas se mueven a construction.*
--   - El frontend usa .schema('construction').from('quotes')
--   - No hay vistas writable intermediarias
--   - NO se mueven funciones LOG ni NOTIFY
--
-- TABLAS que se mueven:
--   quotes, quote_items,
--   construction_tasks, construction_dependencies,
--   construction_phases, construction_project_phases,
--   construction_phase_tasks, construction_task_material_snapshots
--
-- FUNCIONES que se mueven (solo lógica de negocio pura):
--   approve_quote_and_create_tasks
--   get_next_change_order_number
--
-- VISTAS que se recrean en construction.*:
--   construction.quotes_view
--   construction.contract_summary_view
--   construction.construction_tasks_view
--
-- ⚠️ EJECUTAR EN SUPABASE SQL EDITOR
-- =============================================================

-- ─── PASO 1: Crear el schema ────────────────────────────────
CREATE SCHEMA IF NOT EXISTS construction;

-- ─── PASO 2: Permisos al schema ─────────────────────────────
GRANT USAGE ON SCHEMA construction TO authenticated;
GRANT USAGE ON SCHEMA construction TO service_role;
GRANT USAGE ON SCHEMA construction TO anon;

-- ─── PASO 3: Mover tablas al schema construction ────────────

-- 3.1 Tablas del feature Quotes
ALTER TABLE public.quotes           SET SCHEMA construction;
ALTER TABLE public.quote_items      SET SCHEMA construction;

-- 3.2 Tablas de ejecución de obra
ALTER TABLE public.construction_tasks                   SET SCHEMA construction;
ALTER TABLE public.construction_dependencies            SET SCHEMA construction;
ALTER TABLE public.construction_phases                  SET SCHEMA construction;
ALTER TABLE public.construction_project_phases          SET SCHEMA construction;
ALTER TABLE public.construction_phase_tasks             SET SCHEMA construction;
ALTER TABLE public.construction_task_material_snapshots SET SCHEMA construction;

-- ─── PASO 4: Otorgar permisos sobre las tablas ──────────────
GRANT ALL ON ALL TABLES IN SCHEMA construction TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA construction TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA construction TO anon;

-- ─── PASO 5: Mover funciones de negocio al schema ───────────
-- (NO se mueven log_* ni notify_* — son cross-domain)

-- 5.1 approve_quote_and_create_tasks
CREATE OR REPLACE FUNCTION construction.approve_quote_and_create_tasks(
    p_quote_id  uuid,
    p_member_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'construction', 'public'
AS $function$
DECLARE
    v_quote RECORD;
    v_tasks_created INTEGER := 0;
    v_result JSONB;
BEGIN
    -- ========================================
    -- 1. VALIDATE: Quote exists and is valid
    -- ========================================
    SELECT
        q.id,
        q.status,
        q.project_id,
        q.organization_id,
        q.approved_at
    INTO v_quote
    FROM construction.quotes q
    WHERE q.id = p_quote_id
      AND q.is_deleted = false;

    IF v_quote.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QUOTE_NOT_FOUND',
            'message', 'El presupuesto no existe o fue eliminado'
        );
    END IF;

    IF v_quote.status = 'approved' OR v_quote.approved_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QUOTE_ALREADY_APPROVED',
            'message', 'Este presupuesto ya fue aprobado',
            'approved_at', v_quote.approved_at
        );
    END IF;

    IF v_quote.project_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QUOTE_NO_PROJECT',
            'message', 'El presupuesto debe estar asociado a un proyecto para generar tareas de construcción'
        );
    END IF;

    -- ========================================
    -- 2. IDEMPOTENCY: Check no tasks already exist
    -- ========================================
    IF EXISTS (
        SELECT 1
        FROM construction.construction_tasks ct
        INNER JOIN construction.quote_items qi ON ct.quote_item_id = qi.id
        WHERE qi.quote_id = p_quote_id
          AND ct.is_deleted = false
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'TASKS_ALREADY_EXIST',
            'message', 'Ya existen tareas de construcción para este presupuesto'
        );
    END IF;

    -- ========================================
    -- 3. CREATE CONSTRUCTION TASKS from quote_items
    -- ========================================
    INSERT INTO construction.construction_tasks (
        project_id,
        organization_id,
        task_id,
        quote_item_id,
        quantity,
        original_quantity,
        description,
        cost_scope,
        markup_pct,
        status,
        progress_percent,
        created_by
    )
    SELECT
        qi.project_id,
        qi.organization_id,
        qi.task_id,
        qi.id AS quote_item_id,
        qi.quantity,
        qi.quantity AS original_quantity,
        qi.description,
        qi.cost_scope,
        qi.markup_pct,
        'pending'::text,
        0,
        p_member_id
    FROM construction.quote_items qi
    WHERE qi.quote_id = p_quote_id;

    GET DIAGNOSTICS v_tasks_created = ROW_COUNT;

    -- ========================================
    -- 4. UPDATE QUOTE STATUS to approved
    -- ========================================
    UPDATE construction.quotes
    SET
        status      = 'approved',
        approved_at = NOW(),
        approved_by = p_member_id,
        updated_at  = NOW(),
        updated_by  = p_member_id
    WHERE id = p_quote_id;

    -- ========================================
    -- 5. RETURN SUCCESS
    -- ========================================
    RETURN jsonb_build_object(
        'success', true,
        'quote_id', p_quote_id,
        'project_id', v_quote.project_id,
        'tasks_created', v_tasks_created,
        'approved_at', NOW(),
        'approved_by', p_member_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNEXPECTED_ERROR',
            'message', SQLERRM,
            'detail', SQLSTATE
        );
END;
$function$;

-- 5.2 get_next_change_order_number
CREATE OR REPLACE FUNCTION construction.get_next_change_order_number(
    p_contract_id uuid
)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
    next_number INT;
BEGIN
    SELECT COALESCE(MAX(change_order_number), 0) + 1
    INTO next_number
    FROM construction.quotes
    WHERE parent_quote_id = p_contract_id
      AND quote_type = 'change_order'
      AND is_deleted = FALSE;

    RETURN next_number;
END;
$function$;

-- Permisos sobre funciones
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA construction TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA construction TO service_role;

-- ─── PASO 6: Eliminar funciones legacy de public ─────────────
-- (solo eliminar las que ya están recreadas en construction)
DROP FUNCTION IF EXISTS public.approve_quote_and_create_tasks(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_next_change_order_number(uuid);

-- ─── PASO 7: Crear vistas en schema construction ────────────

-- 7.1 construction.quotes_view
CREATE OR REPLACE VIEW construction.quotes_view AS
SELECT
    q.id,
    q.organization_id,
    q.project_id,
    q.client_id,
    q.name,
    q.description,
    q.status,
    q.quote_type,
    q.version,
    q.currency_id,
    q.exchange_rate,
    q.tax_pct,
    q.tax_label,
    q.discount_pct,
    q.quote_date,
    q.valid_until,
    q.approved_at,
    q.approved_by,
    q.created_at,
    q.updated_at,
    q.created_by,
    q.is_deleted,
    q.deleted_at,
    q.updated_by,
    q.parent_quote_id,
    q.original_contract_value,
    q.change_order_number,
    c.name   AS currency_name,
    c.symbol AS currency_symbol,
    p.name   AS project_name,
    concat_ws(' ', cl.first_name, cl.last_name) AS client_name,
    parent.name AS parent_contract_name,
    COALESCE(stats.item_count, 0)              AS item_count,
    COALESCE(stats.subtotal, 0)                AS subtotal,
    COALESCE(stats.subtotal_with_markup, 0)    AS subtotal_with_markup,
    round(
        COALESCE(stats.subtotal_with_markup, 0) *
        (1 - COALESCE(q.discount_pct, 0) / 100.0),
    2) AS total_after_discount,
    round(
        (COALESCE(stats.subtotal_with_markup, 0) *
        (1 - COALESCE(q.discount_pct, 0) / 100.0)) *
        (1 + COALESCE(q.tax_pct, 0) / 100.0),
    2) AS total_with_tax
FROM construction.quotes q
LEFT JOIN public.currencies c   ON q.currency_id = c.id
LEFT JOIN public.projects   p   ON q.project_id  = p.id
LEFT JOIN public.contacts   cl  ON q.client_id   = cl.id
LEFT JOIN construction.quotes parent ON q.parent_quote_id = parent.id
LEFT JOIN (
    SELECT
        qi.quote_id,
        count(*)                                                          AS item_count,
        sum(qi.quantity * qi.unit_price)                                  AS subtotal,
        sum((qi.quantity * qi.unit_price) *
            (1 + COALESCE(qi.markup_pct, 0) / 100.0))                    AS subtotal_with_markup
    FROM construction.quote_items qi
    WHERE qi.is_deleted = false
    GROUP BY qi.quote_id
) stats ON q.id = stats.quote_id
WHERE q.is_deleted = false;

-- 7.2 construction.contract_summary_view
CREATE OR REPLACE VIEW construction.contract_summary_view AS
SELECT
    c.id,
    c.name,
    c.project_id,
    c.organization_id,
    c.client_id,
    c.status,
    c.currency_id,
    c.original_contract_value,
    c.created_at,
    c.updated_at,
    COALESCE(co_stats.total_cos,            0) AS change_order_count,
    COALESCE(co_stats.approved_cos,         0) AS approved_change_order_count,
    COALESCE(co_stats.pending_cos,          0) AS pending_change_order_count,
    COALESCE(co_stats.approved_changes_value, 0) AS approved_changes_value,
    COALESCE(co_stats.pending_changes_value,  0) AS pending_changes_value,
    (COALESCE(c.original_contract_value, 0) +
     COALESCE(co_stats.approved_changes_value, 0))                AS revised_contract_value,
    (COALESCE(c.original_contract_value, 0) +
     COALESCE(co_stats.approved_changes_value, 0) +
     COALESCE(co_stats.pending_changes_value,  0))                AS potential_contract_value
FROM construction.quotes c
LEFT JOIN (
    SELECT
        co.parent_quote_id,
        count(*)                                                             AS total_cos,
        count(*) FILTER (WHERE co.status = 'approved')                       AS approved_cos,
        count(*) FILTER (WHERE co.status IN ('draft', 'sent'))               AS pending_cos,
        COALESCE(sum(qv.total_with_tax) FILTER (WHERE co.status = 'approved'),         0) AS approved_changes_value,
        COALESCE(sum(qv.total_with_tax) FILTER (WHERE co.status IN ('draft', 'sent')), 0) AS pending_changes_value
    FROM construction.quotes co
    JOIN construction.quotes_view qv ON qv.id = co.id
    WHERE co.quote_type = 'change_order'
      AND co.is_deleted = false
    GROUP BY co.parent_quote_id
) co_stats ON co_stats.parent_quote_id = c.id
WHERE c.quote_type = 'contract'
  AND c.is_deleted = false;

-- 7.3 construction.construction_tasks_view
CREATE OR REPLACE VIEW construction.construction_tasks_view AS
SELECT
    ct.id,
    ct.organization_id,
    ct.project_id,
    ct.task_id,
    ct.recipe_id,
    ct.quote_item_id,
    COALESCE(t.custom_name, t.name, ct.custom_name)  AS task_name,
    COALESCE(u.name, ct.custom_unit)                 AS unit,
    td.name                                          AS division_name,
    ct.cost_scope,
    CASE ct.cost_scope
        WHEN 'materials_and_labor' THEN 'M.O. + MAT.'
        WHEN 'labor_only'          THEN 'M.O.'
        WHEN 'materials_only'      THEN 'MAT'
        ELSE 'M.O. + MAT.'
    END AS cost_scope_label,
    ct.quantity,
    ct.original_quantity,
    CASE
        WHEN ct.original_quantity IS NOT NULL AND ct.original_quantity > 0
        THEN ct.quantity - ct.original_quantity
        ELSE NULL
    END AS quantity_variance,
    ct.planned_start_date,
    ct.planned_end_date,
    ct.actual_start_date,
    ct.actual_end_date,
    CASE
        WHEN ct.actual_end_date IS NOT NULL AND ct.planned_end_date IS NOT NULL
        THEN ct.actual_end_date - ct.planned_end_date
        ELSE NULL
    END AS schedule_variance_days,
    ct.duration_in_days,
    ct.progress_percent,
    ct.status,
    ct.description,
    ct.notes,
    ct.custom_name,
    ct.custom_unit,
    ct.created_at,
    ct.updated_at,
    ct.created_by,
    ct.updated_by,
    ct.is_deleted,
    qi.quote_id,
    q.name   AS quote_name,
    qi.markup_pct AS quote_markup_pct,
    ph.phase_name,
    tr.name  AS recipe_name
FROM construction.construction_tasks ct
LEFT JOIN public.tasks        t  ON t.id  = ct.task_id
LEFT JOIN public.units        u  ON u.id  = t.unit_id
LEFT JOIN public.task_divisions td ON td.id = t.task_division_id
LEFT JOIN construction.quote_items qi ON qi.id = ct.quote_item_id
LEFT JOIN construction.quotes  q  ON q.id = qi.quote_id
LEFT JOIN public.task_recipes  tr ON tr.id = ct.recipe_id
LEFT JOIN LATERAL (
    SELECT cp.name AS phase_name
    FROM construction.construction_phase_tasks cpt
    JOIN construction.construction_phases cp ON cp.id = cpt.project_phase_id
    WHERE cpt.construction_task_id = ct.id
    ORDER BY cpt.created_at DESC
    LIMIT 1
) ph ON true
WHERE ct.is_deleted = false;

-- Permisos sobre vistas
GRANT SELECT ON ALL TABLES IN SCHEMA construction TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA construction TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA construction TO anon;

-- ─── PASO 8: Eliminar vistas legacy de public ────────────────
-- (ya no tienen sentido porque las tablas no están en public)
DROP VIEW IF EXISTS public.quotes_view CASCADE;
DROP VIEW IF EXISTS public.contract_summary_view CASCADE;
DROP VIEW IF EXISTS public.construction_tasks_view CASCADE;

-- ─── VERIFICACIÓN ────────────────────────────────────────────

-- Ver tablas en el schema construction
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'construction'
ORDER BY tablename;

-- Ver funciones en el schema construction
SELECT routine_schema, routine_name
FROM information_schema.routines
WHERE routine_schema = 'construction'
ORDER BY routine_name;

-- Ver vistas en el schema construction
SELECT table_schema, table_name
FROM information_schema.views
WHERE table_schema = 'construction'
ORDER BY table_name;
