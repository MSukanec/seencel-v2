-- ============================================================================
-- Clasificación Dual de Rubros: system_division_id
-- ============================================================================
-- Agrega una segunda FK a catalog.tasks para clasificación estándar (sistema)
-- Esto permite que una tarea tenga:
--   - task_division_id     → rubro PROPIO del usuario (para presupuestos)
--   - system_division_id   → rubro ESTÁNDAR del sistema (para analytics/benchmarking)
-- ============================================================================
-- ⚠️ IMPORTANTE: Este script dropea y recrea 6 vistas en cadena.
-- Orden de dependencias:
--   catalog.tasks_view
--   catalog.organization_task_prices_view
--   catalog.task_recipes_view → finance.quotes_items_view → finance.quotes_view → finance.contract_summary_view
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- PASO 1: DROP vistas en orden inverso de dependencia
-- ═══════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS finance.contract_summary_view;
DROP VIEW IF EXISTS finance.quotes_view;
DROP VIEW IF EXISTS finance.quotes_items_view;
DROP VIEW IF EXISTS catalog.task_recipes_view;
DROP VIEW IF EXISTS catalog.organization_task_prices_view;
DROP VIEW IF EXISTS catalog.tasks_view;

-- ═══════════════════════════════════════════════════════════════
-- PASO 2: ALTER TABLE — agregar system_division_id
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE catalog.tasks
ADD COLUMN IF NOT EXISTS system_division_id uuid
REFERENCES catalog.task_divisions(id)
ON DELETE SET NULL;

-- Índice parcial
CREATE INDEX IF NOT EXISTS idx_tasks_system_division_id
ON catalog.tasks(system_division_id)
WHERE is_deleted = false;

-- ═══════════════════════════════════════════════════════════════
-- PASO 3: BACKFILL — copiar task_division_id → system_division_id
-- para tareas que ya usan rubros del sistema
-- ═══════════════════════════════════════════════════════════════

UPDATE catalog.tasks t
SET system_division_id = t.task_division_id
FROM catalog.task_divisions d
WHERE d.id = t.task_division_id
  AND d.is_system = true
  AND t.system_division_id IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- PASO 4: RECREAR VISTAS — en orden de dependencia (hojas primero)
-- ═══════════════════════════════════════════════════════════════

-- ─── 4.1: catalog.tasks_view (INVOKER) ──────────────────────
CREATE VIEW catalog.tasks_view AS
SELECT t.id,
    t.code,
    t.name,
    t.custom_name,
    t.description,
    t.is_system,
    t.is_published,
    t.status,
    t.is_deleted,
    t.organization_id,
    t.unit_id,
    t.task_division_id,
    t.system_division_id,
    t.task_action_id,
    t.task_element_id,
    t.is_parametric,
    t.parameter_values,
    t.import_batch_id,
    t.created_at,
    t.updated_at,
    t.created_by,
    t.updated_by,
    u.name AS unit_name,
    u.symbol AS unit_symbol,
    d.name AS division_name,
    sd.name AS system_division_name,
    ta.name AS action_name,
    ta.short_code AS action_short_code,
    te.name AS element_name
   FROM (((((catalog.tasks t
     LEFT JOIN catalog.units u ON ((u.id = t.unit_id)))
     LEFT JOIN catalog.task_divisions d ON ((d.id = t.task_division_id)))
     LEFT JOIN catalog.task_divisions sd ON ((sd.id = t.system_division_id)))
     LEFT JOIN catalog.task_actions ta ON ((ta.id = t.task_action_id)))
     LEFT JOIN catalog.task_elements te ON ((te.id = t.task_element_id)));

-- ─── 4.2: catalog.organization_task_prices_view (INVOKER) ───
CREATE VIEW catalog.organization_task_prices_view AS
SELECT p.id,
    p.organization_id,
    p.task_id,
    t.custom_name AS task_name,
    td.name AS division_name,
    td."order" AS division_order,
    sd.name AS system_division_name,
    u.name AS unit,
    p.labor_unit_cost,
    p.material_unit_cost,
    p.supply_unit_cost,
    COALESCE(p.total_unit_cost, ((COALESCE(p.labor_unit_cost, (0)::numeric) + COALESCE(p.material_unit_cost, (0)::numeric)) + COALESCE(p.supply_unit_cost, (0)::numeric))) AS total_unit_cost,
    p.currency_code,
    p.note,
    p.created_at,
    p.updated_at
   FROM ((((catalog.organization_task_prices p
     LEFT JOIN catalog.tasks t ON ((t.id = p.task_id)))
     LEFT JOIN catalog.task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN catalog.task_divisions sd ON ((sd.id = t.system_division_id)))
     LEFT JOIN catalog.units u ON ((u.id = t.unit_id)));

-- ─── 4.3: catalog.task_recipes_view (DEFINER) ──────────────
CREATE VIEW catalog.task_recipes_view
WITH (security_invoker = false)
AS
WITH recipe_material_costs AS (
         SELECT trm.recipe_id,
            sum(((trm.total_quantity * COALESCE(mp.unit_price, (0)::numeric)) / GREATEST(COALESCE(mat.default_sale_unit_quantity, (1)::numeric), (1)::numeric))) AS mat_cost
           FROM (((catalog.task_recipe_materials trm
             JOIN catalog.task_recipes tr_1 ON (((tr_1.id = trm.recipe_id) AND (tr_1.is_deleted = false))))
             LEFT JOIN catalog.materials mat ON ((mat.id = trm.material_id)))
             LEFT JOIN LATERAL ( SELECT mp_inner.unit_price
                   FROM catalog.material_prices mp_inner
                  WHERE ((mp_inner.material_id = trm.material_id) AND (mp_inner.organization_id = tr_1.organization_id) AND (mp_inner.valid_from <= CURRENT_DATE) AND ((mp_inner.valid_to IS NULL) OR (mp_inner.valid_to >= CURRENT_DATE)))
                  ORDER BY mp_inner.valid_from DESC
                 LIMIT 1) mp ON (true))
          WHERE (trm.is_deleted = false)
          GROUP BY trm.recipe_id
        ), recipe_labor_costs AS (
         SELECT trl.recipe_id,
            sum((trl.quantity * COALESCE(lp.unit_price, (0)::numeric))) AS lab_cost
           FROM ((catalog.task_recipe_labor trl
             JOIN catalog.task_recipes tr_1 ON (((tr_1.id = trl.recipe_id) AND (tr_1.is_deleted = false))))
             LEFT JOIN LATERAL ( SELECT lp_inner.unit_price
                   FROM catalog.labor_prices lp_inner
                  WHERE ((lp_inner.labor_type_id = trl.labor_type_id) AND (lp_inner.organization_id = tr_1.organization_id) AND ((lp_inner.valid_to IS NULL) OR (lp_inner.valid_to >= CURRENT_DATE)))
                  ORDER BY lp_inner.valid_from DESC
                 LIMIT 1) lp ON (true))
          WHERE (trl.is_deleted = false)
          GROUP BY trl.recipe_id
        ), recipe_ext_service_costs AS (
         SELECT tres.recipe_id,
            sum(tres.unit_price) AS ext_cost
           FROM (catalog.task_recipe_external_services tres
             JOIN catalog.task_recipes tr_1 ON (((tr_1.id = tres.recipe_id) AND (tr_1.is_deleted = false))))
          WHERE (tres.is_deleted = false)
          GROUP BY tres.recipe_id
        )
 SELECT tr.id,
    tr.task_id,
    tr.organization_id,
    tr.name,
    tr.is_public,
    tr.region,
    tr.rating_avg,
    tr.rating_count,
    tr.usage_count,
    tr.created_at,
    tr.updated_at,
    tr.is_deleted,
    tr.import_batch_id,
    tr.status,
    t.name AS task_name,
    t.custom_name AS task_custom_name,
    COALESCE(t.custom_name, t.name) AS task_display_name,
    td.name AS division_name,
    sd.name AS system_division_name,
    u.name AS unit_name,
    o.name AS org_name,
    (( SELECT count(*) AS count
           FROM catalog.task_recipe_materials trm
          WHERE ((trm.recipe_id = tr.id) AND (trm.is_deleted = false))) + ( SELECT count(*) AS count
           FROM catalog.task_recipe_labor trl
          WHERE ((trl.recipe_id = tr.id) AND (trl.is_deleted = false)))) AS item_count,
    (COALESCE(rmc.mat_cost, (0)::numeric))::numeric(14,2) AS mat_cost,
    (COALESCE(rlc.lab_cost, (0)::numeric))::numeric(14,2) AS lab_cost,
    (COALESCE(rec.ext_cost, (0)::numeric))::numeric(14,2) AS ext_cost,
    (((COALESCE(rmc.mat_cost, (0)::numeric) + COALESCE(rlc.lab_cost, (0)::numeric)) + COALESCE(rec.ext_cost, (0)::numeric)))::numeric(14,2) AS total_cost
   FROM ((((((((catalog.task_recipes tr
     LEFT JOIN catalog.tasks t ON ((t.id = tr.task_id)))
     LEFT JOIN catalog.task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN catalog.task_divisions sd ON ((sd.id = t.system_division_id)))
     LEFT JOIN catalog.units u ON ((u.id = t.unit_id)))
     LEFT JOIN iam.organizations o ON ((o.id = tr.organization_id)))
     LEFT JOIN recipe_material_costs rmc ON ((rmc.recipe_id = tr.id)))
     LEFT JOIN recipe_labor_costs rlc ON ((rlc.recipe_id = tr.id)))
     LEFT JOIN recipe_ext_service_costs rec ON ((rec.recipe_id = tr.id)))
  WHERE (tr.is_deleted = false);

-- ─── 4.4: finance.quotes_items_view (DEFINER) ──────────────
-- NOTA: Esta vista NO cambia, solo necesita recrearse porque depende de task_recipes_view
CREATE VIEW finance.quotes_items_view
WITH (security_invoker = false)
AS
WITH recipe_costs AS (
         SELECT rv.id AS recipe_id,
            rv.name AS recipe_name,
            rv.mat_cost,
            rv.lab_cost,
            rv.ext_cost,
            rv.total_cost
           FROM catalog.task_recipes_view rv
        )
 SELECT bi.id,
    bi.quote_id AS budget_id,
    bi.organization_id,
    bi.project_id,
    bi.task_id,
    bi.recipe_id,
    bi.created_at,
    bi.updated_at,
    bi.created_by,
    t.name AS task_name,
    t.custom_name,
    td.name AS division_name,
    td."order" AS division_order,
    u.symbol AS unit,
    bi.description,
    rc.recipe_name,
    bi.quantity,
    bi.currency_id,
    bi.markup_pct,
    bi.tax_pct,
    bi.cost_scope,
        CASE bi.cost_scope
            WHEN 'materials_and_labor'::cost_scope_enum THEN 'Materiales + Mano de obra'::text
            WHEN 'labor_only'::cost_scope_enum THEN 'Sólo mano de obra'::text
            ELSE initcap(replace((bi.cost_scope)::text, '_'::text, ' '::text))
        END AS cost_scope_label,
    bi.sort_key AS "position",
    bi.unit_price,
    bi.snapshot_mat_cost,
    bi.snapshot_lab_cost,
    bi.snapshot_ext_cost,
    COALESCE(rc.mat_cost, (0)::numeric) AS live_mat_cost,
    COALESCE(rc.lab_cost, (0)::numeric) AS live_lab_cost,
    COALESCE(rc.ext_cost, (0)::numeric) AS live_ext_cost,
        CASE bi.cost_scope
            WHEN 'materials_and_labor'::cost_scope_enum THEN ((COALESCE(rc.mat_cost, (0)::numeric) + COALESCE(rc.lab_cost, (0)::numeric)) + COALESCE(rc.ext_cost, (0)::numeric))
            WHEN 'labor_only'::cost_scope_enum THEN (COALESCE(rc.lab_cost, (0)::numeric) + COALESCE(rc.ext_cost, (0)::numeric))
            ELSE COALESCE(rc.total_cost, (0)::numeric)
        END AS live_unit_price,
        CASE
            WHEN (q.status = 'draft'::text) THEN
            CASE bi.cost_scope
                WHEN 'materials_and_labor'::cost_scope_enum THEN ((COALESCE(rc.mat_cost, (0)::numeric) + COALESCE(rc.lab_cost, (0)::numeric)) + COALESCE(rc.ext_cost, (0)::numeric))
                WHEN 'labor_only'::cost_scope_enum THEN (COALESCE(rc.lab_cost, (0)::numeric) + COALESCE(rc.ext_cost, (0)::numeric))
                ELSE COALESCE(rc.total_cost, (0)::numeric)
            END
            ELSE bi.unit_price
        END AS effective_unit_price
   FROM (((((finance.quote_items bi
     LEFT JOIN catalog.tasks t ON ((t.id = bi.task_id)))
     LEFT JOIN catalog.task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN catalog.units u ON ((u.id = t.unit_id)))
     LEFT JOIN finance.quotes q ON ((q.id = bi.quote_id)))
     LEFT JOIN recipe_costs rc ON ((rc.recipe_id = bi.recipe_id)))
  WHERE (bi.is_deleted = false);

-- ─── 4.5: finance.quotes_view (DEFINER) ─────────────────────
-- NOTA: Esta vista NO cambia, solo necesita recrearse porque depende de quotes_items_view
CREATE VIEW finance.quotes_view
WITH (security_invoker = false)
AS
SELECT q.id,
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
    concat_ws(' '::text, cl.first_name, cl.last_name) AS client_name,
    parent.name AS parent_contract_name,
    COALESCE(stats.item_count, (0)::bigint) AS item_count,
    COALESCE(stats.subtotal, (0)::numeric) AS subtotal,
    COALESCE(stats.subtotal_with_markup, (0)::numeric) AS subtotal_with_markup,
    round((COALESCE(stats.subtotal_with_markup, (0)::numeric) * ((1)::numeric - (COALESCE(q.discount_pct, (0)::numeric) / 100.0))), 2) AS total_after_discount,
    round(((COALESCE(stats.subtotal_with_markup, (0)::numeric) * ((1)::numeric - (COALESCE(q.discount_pct, (0)::numeric) / 100.0))) * ((1)::numeric + (COALESCE(q.tax_pct, (0)::numeric) / 100.0))), 2) AS total_with_tax
   FROM (((((finance.quotes q
     LEFT JOIN finance.currencies c ON ((q.currency_id = c.id)))
     LEFT JOIN projects.projects p ON ((q.project_id = p.id)))
     LEFT JOIN contacts.contacts cl ON ((q.client_id = cl.id)))
     LEFT JOIN finance.quotes parent ON ((q.parent_quote_id = parent.id)))
     LEFT JOIN ( SELECT qiv.budget_id AS quote_id,
            count(*) AS item_count,
            sum((qiv.quantity * qiv.effective_unit_price)) AS subtotal,
            sum(((qiv.quantity * qiv.effective_unit_price) * ((1)::numeric + (COALESCE(qiv.markup_pct, (0)::numeric) / 100.0)))) AS subtotal_with_markup
           FROM finance.quotes_items_view qiv
          GROUP BY qiv.budget_id) stats ON ((q.id = stats.quote_id)))
  WHERE (q.is_deleted = false);

-- ─── 4.6: finance.contract_summary_view (DEFINER) ───────────
-- NOTA: Esta vista NO cambia, solo necesita recrearse porque depende de quotes_view
CREATE VIEW finance.contract_summary_view
WITH (security_invoker = false)
AS
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
    COALESCE(co_stats.total_cos, (0)::bigint) AS change_order_count,
    COALESCE(co_stats.approved_cos, (0)::bigint) AS approved_change_order_count,
    COALESCE(co_stats.pending_cos, (0)::bigint) AS pending_change_order_count,
    COALESCE(co_stats.approved_changes_value, (0)::numeric) AS approved_changes_value,
    COALESCE(co_stats.pending_changes_value, (0)::numeric) AS pending_changes_value,
    (COALESCE(c.original_contract_value, (0)::numeric) + COALESCE(co_stats.approved_changes_value, (0)::numeric)) AS revised_contract_value,
    ((COALESCE(c.original_contract_value, (0)::numeric) + COALESCE(co_stats.approved_changes_value, (0)::numeric)) + COALESCE(co_stats.pending_changes_value, (0)::numeric)) AS potential_contract_value
   FROM (finance.quotes c
     LEFT JOIN ( SELECT co.parent_quote_id,
            count(*) AS total_cos,
            count(*) FILTER (WHERE (co.status = 'approved'::text)) AS approved_cos,
            count(*) FILTER (WHERE (co.status = ANY (ARRAY['draft'::text, 'sent'::text]))) AS pending_cos,
            COALESCE(sum(qv.total_with_tax) FILTER (WHERE (co.status = 'approved'::text)), (0)::numeric) AS approved_changes_value,
            COALESCE(sum(qv.total_with_tax) FILTER (WHERE (co.status = ANY (ARRAY['draft'::text, 'sent'::text]))), (0)::numeric) AS pending_changes_value
           FROM (finance.quotes co
             JOIN finance.quotes_view qv ON ((qv.id = co.id)))
          WHERE ((co.quote_type = 'change_order'::text) AND (co.is_deleted = false))
          GROUP BY co.parent_quote_id) co_stats ON ((co_stats.parent_quote_id = c.id)))
  WHERE ((c.quote_type = 'contract'::text) AND (c.is_deleted = false));

-- ═══════════════════════════════════════════════════════════════
-- PASO 5: Restaurar SECURITY settings
-- ═══════════════════════════════════════════════════════════════
-- task_recipes_view, quotes_items_view, quotes_view y contract_summary_view
-- son todas SECURITY DEFINER (security_invoker = false)
-- Ya se crearon con WITH (security_invoker = false) arriba

COMMIT;
