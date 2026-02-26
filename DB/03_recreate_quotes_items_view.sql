-- ============================================================================
-- Script 3: Recrear quotes_items_view con costos vivos y effective_unit_price
-- JOIN con costos de receta para calcular precio según alcance y estado
-- ============================================================================

DROP VIEW IF EXISTS finance.quotes_items_view CASCADE;

CREATE OR REPLACE VIEW finance.quotes_items_view AS
WITH recipe_costs AS (
    -- Reutilizamos la lógica de costos de la task_recipes_view
    -- pero solo necesitamos recipe_id → mat/lab/ext para el JOIN
    SELECT
        rv.id AS recipe_id,
        rv.mat_cost,
        rv.lab_cost,
        rv.ext_cost,
        rv.total_cost
    FROM catalog.task_recipes_view rv
)
SELECT
    bi.id,
    bi.quote_id AS budget_id,
    bi.organization_id,
    bi.project_id,
    bi.task_id,
    bi.recipe_id,
    bi.created_at,
    bi.updated_at,
    bi.created_by,
    -- Task info
    t.name AS task_name,
    t.custom_name,
    td.name AS division_name,
    td."order" AS division_order,
    u.name AS unit,
    bi.description,
    bi.quantity,
    bi.currency_id,
    bi.markup_pct,
    bi.tax_pct,
    bi.cost_scope,
    CASE bi.cost_scope
        WHEN 'materials_and_labor'::cost_scope_enum THEN 'Materiales + Mano de obra'
        WHEN 'labor_only'::cost_scope_enum THEN 'Sólo mano de obra'
        ELSE initcap(replace(bi.cost_scope::text, '_', ' '))
    END AS cost_scope_label,
    bi.sort_key AS "position",
    -- Snapshot costs (frozen)
    bi.unit_price,
    bi.snapshot_mat_cost,
    bi.snapshot_lab_cost,
    bi.snapshot_ext_cost,
    -- Live costs from recipe (always current catalog prices)
    COALESCE(rc.mat_cost, 0) AS live_mat_cost,
    COALESCE(rc.lab_cost, 0) AS live_lab_cost,
    COALESCE(rc.ext_cost, 0) AS live_ext_cost,
    -- Live unit price based on cost_scope
    CASE bi.cost_scope
        WHEN 'materials_and_labor'::cost_scope_enum THEN
            COALESCE(rc.mat_cost, 0) + COALESCE(rc.lab_cost, 0) + COALESCE(rc.ext_cost, 0)
        WHEN 'labor_only'::cost_scope_enum THEN
            COALESCE(rc.lab_cost, 0) + COALESCE(rc.ext_cost, 0)
        ELSE COALESCE(rc.total_cost, 0)
    END AS live_unit_price,
    -- Effective unit price: live if draft, snapshot otherwise
    -- Requires JOIN with quote to know status
    CASE
        WHEN q.status = 'draft' THEN
            CASE bi.cost_scope
                WHEN 'materials_and_labor'::cost_scope_enum THEN
                    COALESCE(rc.mat_cost, 0) + COALESCE(rc.lab_cost, 0) + COALESCE(rc.ext_cost, 0)
                WHEN 'labor_only'::cost_scope_enum THEN
                    COALESCE(rc.lab_cost, 0) + COALESCE(rc.ext_cost, 0)
                ELSE COALESCE(rc.total_cost, 0)
            END
        ELSE bi.unit_price
    END AS effective_unit_price
FROM finance.quote_items bi
LEFT JOIN catalog.tasks t ON t.id = bi.task_id
LEFT JOIN catalog.task_divisions td ON td.id = t.task_division_id
LEFT JOIN catalog.units u ON u.id = t.unit_id
LEFT JOIN finance.quotes q ON q.id = bi.quote_id
LEFT JOIN recipe_costs rc ON rc.recipe_id = bi.recipe_id
WHERE bi.is_deleted = false;
