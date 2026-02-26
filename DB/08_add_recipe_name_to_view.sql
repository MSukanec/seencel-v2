-- ============================================================================
-- Script 3b: Actualizar quotes_items_view para incluir recipe_name
-- ============================================================================

DROP VIEW IF EXISTS finance.quotes_view CASCADE;
DROP VIEW IF EXISTS finance.quotes_items_view CASCADE;

CREATE OR REPLACE VIEW finance.quotes_items_view AS
WITH recipe_costs AS (
    SELECT
        rv.id AS recipe_id,
        rv.name AS recipe_name,
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
    u.symbol AS unit,
    bi.description,
    -- Recipe info
    rc.recipe_name,
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

-- Permisos
GRANT SELECT ON finance.quotes_items_view TO authenticated;
GRANT SELECT ON finance.quotes_items_view TO anon;

-- Recrear quotes_view (depende de quotes_items_view)
CREATE OR REPLACE VIEW finance.quotes_view AS
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
    c.name AS currency_name,
    c.symbol AS currency_symbol,
    p.name AS project_name,
    concat_ws(' ', cl.first_name, cl.last_name) AS client_name,
    parent.name AS parent_contract_name,
    COALESCE(stats.item_count, 0::bigint) AS item_count,
    COALESCE(stats.subtotal, 0::numeric) AS subtotal,
    COALESCE(stats.subtotal_with_markup, 0::numeric) AS subtotal_with_markup,
    round(
        COALESCE(stats.subtotal_with_markup, 0::numeric)
        * (1::numeric - COALESCE(q.discount_pct, 0::numeric) / 100.0),
        2
    ) AS total_after_discount,
    round(
        COALESCE(stats.subtotal_with_markup, 0::numeric)
        * (1::numeric - COALESCE(q.discount_pct, 0::numeric) / 100.0)
        * (1::numeric + COALESCE(q.tax_pct, 0::numeric) / 100.0),
        2
    ) AS total_with_tax
FROM finance.quotes q
LEFT JOIN finance.currencies c ON q.currency_id = c.id
LEFT JOIN projects.projects p ON q.project_id = p.id
LEFT JOIN contacts.contacts cl ON q.client_id = cl.id
LEFT JOIN finance.quotes parent ON q.parent_quote_id = parent.id
LEFT JOIN (
    SELECT
        qiv.budget_id AS quote_id,
        count(*) AS item_count,
        sum(qiv.quantity * qiv.effective_unit_price) AS subtotal,
        sum(
            (qiv.quantity * qiv.effective_unit_price)
            * (1::numeric + COALESCE(qiv.markup_pct, 0::numeric) / 100.0)
        ) AS subtotal_with_markup
    FROM finance.quotes_items_view qiv
    GROUP BY qiv.budget_id
) stats ON q.id = stats.quote_id
WHERE q.is_deleted = false;

-- Permisos
GRANT SELECT ON finance.quotes_view TO authenticated;
GRANT SELECT ON finance.quotes_view TO anon;

-- Recrear contract_summary_view (depende de quotes_view)
CREATE OR REPLACE VIEW finance.contract_summary_view AS
SELECT c.id,
    c.name,
    c.project_id,
    c.organization_id,
    c.client_id,
    c.status,
    c.currency_id,
    c.original_contract_value,
    c.created_at,
    c.updated_at,
    COALESCE(co_stats.total_cos, 0::bigint) AS change_order_count,
    COALESCE(co_stats.approved_cos, 0::bigint) AS approved_change_order_count,
    COALESCE(co_stats.pending_cos, 0::bigint) AS pending_change_order_count,
    COALESCE(co_stats.approved_changes_value, 0::numeric) AS approved_changes_value,
    COALESCE(co_stats.pending_changes_value, 0::numeric) AS pending_changes_value,
    (COALESCE(c.original_contract_value, 0::numeric) + COALESCE(co_stats.approved_changes_value, 0::numeric)) AS revised_contract_value,
    ((COALESCE(c.original_contract_value, 0::numeric) + COALESCE(co_stats.approved_changes_value, 0::numeric)) + COALESCE(co_stats.pending_changes_value, 0::numeric)) AS potential_contract_value
FROM finance.quotes c
LEFT JOIN (
    SELECT co.parent_quote_id,
        count(*) AS total_cos,
        count(*) FILTER (WHERE co.status = 'approved') AS approved_cos,
        count(*) FILTER (WHERE co.status = ANY (ARRAY['draft', 'sent'])) AS pending_cos,
        COALESCE(sum(qv.total_with_tax) FILTER (WHERE co.status = 'approved'), 0::numeric) AS approved_changes_value,
        COALESCE(sum(qv.total_with_tax) FILTER (WHERE co.status = ANY (ARRAY['draft', 'sent'])), 0::numeric) AS pending_changes_value
    FROM finance.quotes co
    JOIN finance.quotes_view qv ON qv.id = co.id
    WHERE co.quote_type = 'change_order' AND co.is_deleted = false
    GROUP BY co.parent_quote_id
) co_stats ON co_stats.parent_quote_id = c.id
WHERE c.quote_type = 'contract' AND c.is_deleted = false;

-- Permisos
GRANT SELECT ON finance.contract_summary_view TO authenticated;
GRANT SELECT ON finance.contract_summary_view TO anon;
