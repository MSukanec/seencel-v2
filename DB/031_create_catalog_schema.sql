-- ==========================================
-- 031 — CREATE SCHEMA catalog
-- ==========================================
-- Mueve todas las tablas de definición del catálogo técnico (tasks, materials,
-- labor, units) desde public al nuevo schema catalog.
--
-- DOMINIO: Definiciones reutilizables (el "libro técnico").
-- NO incluye: operaciones de compra, pagos de MO, facturas, obra.
--
-- ORDEN DE EJECUCIÓN: Respetar el orden estrictamente (dependencias FK).
-- Post-ejecución: ejecutar `npm run db:schema` para regenerar DB/schema/.
-- ==========================================

-- ==========================================
-- 1. CREAR SCHEMA Y PERMISOS
-- ==========================================
CREATE SCHEMA IF NOT EXISTS catalog;

GRANT USAGE ON SCHEMA catalog TO authenticated, service_role, anon;

-- ==========================================
-- 2. MOVER TABLAS (orden de dependencias)
-- ==========================================

-- GRUPO A: Units (sin dependencias internas)
ALTER TABLE public.unit_categories SET SCHEMA catalog;
ALTER TABLE public.units SET SCHEMA catalog;

-- GRUPO B: Task Taxonomy base (sin dependencias internas o solo system)
ALTER TABLE public.task_actions SET SCHEMA catalog;
ALTER TABLE public.task_construction_systems SET SCHEMA catalog;
ALTER TABLE public.task_parameters SET SCHEMA catalog;

-- GRUPO C: Task Taxonomy compuesta (depende de units y B)
ALTER TABLE public.task_elements SET SCHEMA catalog;     -- FK → catalog.units
ALTER TABLE public.task_divisions SET SCHEMA catalog;    -- FK → public.organization_members (cross-schema OK)

-- GRUPO D: Tablas pivot de taxonomía
ALTER TABLE public.task_element_actions SET SCHEMA catalog;
ALTER TABLE public.task_element_parameters SET SCHEMA catalog;
ALTER TABLE public.task_element_systems SET SCHEMA catalog;
ALTER TABLE public.task_division_actions SET SCHEMA catalog;
ALTER TABLE public.task_division_elements SET SCHEMA catalog;

-- GRUPO E: Materials (depende de units)
ALTER TABLE public.material_categories SET SCHEMA catalog;
ALTER TABLE public.materials SET SCHEMA catalog;         -- FK → catalog.units, catalog.material_categories
ALTER TABLE public.material_prices SET SCHEMA catalog;   -- FK → catalog.materials
ALTER TABLE public.organization_material_prices SET SCHEMA catalog; -- FK → catalog.materials

-- GRUPO F: Labor (depende de units)
ALTER TABLE public.labor_levels SET SCHEMA catalog;
ALTER TABLE public.labor_roles SET SCHEMA catalog;
ALTER TABLE public.labor_categories SET SCHEMA catalog;  -- FK → public.organizations (cross-schema OK)
ALTER TABLE public.labor_types SET SCHEMA catalog;       -- FK → catalog.labor_levels, catalog.labor_roles, catalog.units, catalog.labor_categories
ALTER TABLE public.labor_prices SET SCHEMA catalog;      -- FK → catalog.labor_types

-- GRUPO G: Tasks catálogo (depende de units + taxonomía)
ALTER TABLE public.task_parameter_options SET SCHEMA catalog; -- FK → catalog.units, catalog.materials, catalog.task_parameters
ALTER TABLE public.tasks SET SCHEMA catalog;             -- FK → catalog.units, catalog.task_divisions, catalog.task_elements, catalog.task_actions
ALTER TABLE public.task_task_parameters SET SCHEMA catalog;   -- FK → catalog.tasks, catalog.task_parameters

-- GRUPO H: Recipes (depende de tasks + materials + labor)
ALTER TABLE public.task_recipes SET SCHEMA catalog;      -- FK → catalog.tasks
ALTER TABLE public.task_recipe_materials SET SCHEMA catalog; -- FK → catalog.task_recipes, catalog.materials, catalog.units
ALTER TABLE public.task_recipe_labor SET SCHEMA catalog;     -- FK → catalog.task_recipes, catalog.labor_types, catalog.units
ALTER TABLE public.task_recipe_external_services SET SCHEMA catalog; -- FK → catalog.task_recipes, catalog.units
ALTER TABLE public.task_recipe_ratings SET SCHEMA catalog;   -- FK → catalog.task_recipes

-- Permisos sobre todas las tablas del nuevo schema
GRANT ALL ON ALL TABLES IN SCHEMA catalog TO authenticated, service_role;

-- ==========================================
-- 3. RECREAR VISTAS EN CATALOG
-- (Las vistas no se mueven — se DROP + CREATE)
-- Las vistas en public que las referenciaban también se actualizan aquí.
-- ==========================================

-- ------------------------------------------
-- 3.1 tasks_view → catalog.tasks_view
-- ------------------------------------------
DROP VIEW IF EXISTS public.tasks_view;

CREATE OR REPLACE VIEW catalog.tasks_view AS
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
    ta.name AS action_name,
    ta.short_code AS action_short_code,
    te.name AS element_name
FROM catalog.tasks t
    LEFT JOIN catalog.units u ON (u.id = t.unit_id)
    LEFT JOIN catalog.task_divisions d ON (d.id = t.task_division_id)
    LEFT JOIN catalog.task_actions ta ON (ta.id = t.task_action_id)
    LEFT JOIN catalog.task_elements te ON (te.id = t.task_element_id);

-- ------------------------------------------
-- 3.2 task_recipes_view → catalog.task_recipes_view
-- ------------------------------------------
DROP VIEW IF EXISTS public.task_recipes_view;

CREATE OR REPLACE VIEW catalog.task_recipes_view AS
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
    u.name AS unit_name,
    o.name AS org_name,
    (( SELECT count(*) AS count
           FROM catalog.task_recipe_materials trm
          WHERE (trm.recipe_id = tr.id)) + ( SELECT count(*) AS count
           FROM catalog.task_recipe_labor trl
          WHERE (trl.recipe_id = tr.id))) AS item_count
FROM catalog.task_recipes tr
    LEFT JOIN catalog.tasks t ON (t.id = tr.task_id)
    LEFT JOIN catalog.task_divisions td ON (td.id = t.task_division_id)
    LEFT JOIN catalog.units u ON (u.id = t.unit_id)
    LEFT JOIN public.organizations o ON (o.id = tr.organization_id)
WHERE (tr.is_deleted = false);

-- ------------------------------------------
-- 3.3 task_costs_view → catalog.task_costs_view
-- ------------------------------------------
DROP VIEW IF EXISTS public.task_costs_view;

CREATE OR REPLACE VIEW catalog.task_costs_view AS
WITH recipe_material_costs AS (
    SELECT trm.recipe_id,
        tr.task_id,
        tr.organization_id,
        sum(((trm.total_quantity * COALESCE(mp.unit_price, (0)::numeric)) / GREATEST(COALESCE(mat.default_sale_unit_quantity, (1)::numeric), (1)::numeric))) AS mat_cost,
        min(mp.valid_from) AS oldest_mat_price_date
    FROM catalog.task_recipe_materials trm
        JOIN catalog.task_recipes tr ON ((tr.id = trm.recipe_id) AND (tr.is_deleted = false))
        LEFT JOIN catalog.materials mat ON (mat.id = trm.material_id)
        LEFT JOIN LATERAL (
            SELECT mp_inner.unit_price, mp_inner.valid_from
            FROM catalog.material_prices mp_inner
            WHERE mp_inner.material_id = trm.material_id
              AND mp_inner.organization_id = tr.organization_id
              AND mp_inner.valid_from <= CURRENT_DATE
              AND (mp_inner.valid_to IS NULL OR mp_inner.valid_to >= CURRENT_DATE)
            ORDER BY mp_inner.valid_from DESC
            LIMIT 1
        ) mp ON true
    WHERE trm.is_deleted = false
    GROUP BY trm.recipe_id, tr.task_id, tr.organization_id
),
recipe_labor_costs AS (
    SELECT trl.recipe_id,
        tr.task_id,
        tr.organization_id,
        sum((trl.quantity * COALESCE(lp.unit_price, (0)::numeric))) AS lab_cost,
        min(lp.valid_from) AS oldest_lab_price_date
    FROM catalog.task_recipe_labor trl
        JOIN catalog.task_recipes tr ON ((tr.id = trl.recipe_id) AND (tr.is_deleted = false))
        LEFT JOIN LATERAL (
            SELECT lp_inner.unit_price, lp_inner.valid_from
            FROM catalog.labor_prices lp_inner
            WHERE lp_inner.labor_type_id = trl.labor_type_id
              AND lp_inner.organization_id = tr.organization_id
              AND (lp_inner.valid_to IS NULL OR lp_inner.valid_to >= CURRENT_DATE)
            ORDER BY lp_inner.valid_from DESC
            LIMIT 1
        ) lp ON true
    WHERE trl.is_deleted = false
    GROUP BY trl.recipe_id, tr.task_id, tr.organization_id
),
recipe_ext_service_costs AS (
    SELECT tres.recipe_id,
        tr.task_id,
        tr.organization_id,
        sum(tres.unit_price) AS ext_cost
    FROM catalog.task_recipe_external_services tres
        JOIN catalog.task_recipes tr ON ((tr.id = tres.recipe_id) AND (tr.is_deleted = false))
    WHERE tres.is_deleted = false
    GROUP BY tres.recipe_id, tr.task_id, tr.organization_id
),
recipe_totals AS (
    SELECT tr.id AS recipe_id,
        tr.task_id,
        tr.organization_id,
        COALESCE(rmc.mat_cost, (0)::numeric) AS mat_cost,
        COALESCE(rlc.lab_cost, (0)::numeric) AS lab_cost,
        COALESCE(rec.ext_cost, (0)::numeric) AS ext_cost,
        ((COALESCE(rmc.mat_cost, (0)::numeric) + COALESCE(rlc.lab_cost, (0)::numeric)) + COALESCE(rec.ext_cost, (0)::numeric)) AS total_cost,
        LEAST(rmc.oldest_mat_price_date, rlc.oldest_lab_price_date) AS oldest_price_date
    FROM catalog.task_recipes tr
        LEFT JOIN recipe_material_costs rmc ON (rmc.recipe_id = tr.id)
        LEFT JOIN recipe_labor_costs rlc ON (rlc.recipe_id = tr.id)
        LEFT JOIN recipe_ext_service_costs rec ON (rec.recipe_id = tr.id)
    WHERE tr.is_deleted = false
)
SELECT rt.task_id,
    rt.organization_id,
    (round(avg(rt.total_cost), 2))::numeric(14,4) AS unit_cost,
    (round(avg(rt.mat_cost), 2))::numeric(14,4) AS mat_unit_cost,
    (round(avg(rt.lab_cost), 2))::numeric(14,4) AS lab_unit_cost,
    (round(avg(rt.ext_cost), 2))::numeric(14,4) AS ext_unit_cost,
    (count(rt.recipe_id))::integer AS recipe_count,
    (round(min(rt.total_cost), 2))::numeric(14,4) AS min_cost,
    (round(max(rt.total_cost), 2))::numeric(14,4) AS max_cost,
    min(rt.oldest_price_date) AS oldest_price_date
FROM recipe_totals rt
GROUP BY rt.task_id, rt.organization_id;

-- ------------------------------------------
-- 3.4 materials_view → catalog.materials_view
-- ------------------------------------------
DROP VIEW IF EXISTS public.materials_view;

CREATE OR REPLACE VIEW catalog.materials_view AS
SELECT m.id,
    m.name,
    m.code,
    m.description,
    m.material_type,
    m.is_system,
    m.organization_id,
    m.is_deleted,
    m.created_at,
    m.updated_at,
    m.unit_id,
    u.name AS unit_of_computation,
    u.symbol AS unit_symbol,
    m.category_id,
    mc.name AS category_name,
    m.default_provider_id,
    m.default_sale_unit_id,
    m.default_sale_unit_quantity,
    su.name AS sale_unit_name,
    su.symbol AS sale_unit_symbol,
    mp.unit_price AS org_unit_price,
    mp.currency_id AS org_price_currency_id,
    mp.valid_from AS org_price_valid_from
FROM catalog.materials m
    LEFT JOIN catalog.units u ON (m.unit_id = u.id)
    LEFT JOIN catalog.material_categories mc ON (m.category_id = mc.id)
    LEFT JOIN catalog.units su ON (m.default_sale_unit_id = su.id)
    LEFT JOIN LATERAL (
        SELECT mp_inner.unit_price, mp_inner.currency_id, mp_inner.valid_from
        FROM catalog.material_prices mp_inner
        WHERE mp_inner.material_id = m.id
          AND mp_inner.organization_id = m.organization_id
          AND mp_inner.valid_from <= CURRENT_DATE
          AND (mp_inner.valid_to IS NULL OR mp_inner.valid_to >= CURRENT_DATE)
        ORDER BY mp_inner.valid_from DESC
        LIMIT 1
    ) mp ON true
WHERE m.is_deleted = false;

-- ------------------------------------------
-- 3.5 labor_view → catalog.labor_view
-- (Depende de labor_avg_prices — si existe en public, el JOIN hace cross-schema)
-- ------------------------------------------
DROP VIEW IF EXISTS public.labor_view;

CREATE OR REPLACE VIEW catalog.labor_view AS
SELECT lt.id AS labor_id,
    lt.name AS labor_name,
    lt.description AS labor_description,
    lt.unit_id,
    u.name AS unit_name,
    u.symbol AS unit_symbol,
    lpc.organization_id,
    lpc.unit_price AS current_price,
    lpc.currency_id AS current_currency_id,
    c.code AS current_currency_code,
    c.symbol AS current_currency_symbol,
    lpc.valid_from,
    lpc.valid_to,
    lpc.updated_at,
    lap.avg_price,
    lap.price_count,
    lap.min_price,
    lap.max_price
FROM catalog.labor_types lt
    LEFT JOIN catalog.units u ON (u.id = lt.unit_id)
    LEFT JOIN (
        SELECT DISTINCT ON (lp.labor_type_id, lp.organization_id)
            lp.labor_type_id AS labor_id,
            lp.organization_id,
            lp.currency_id,
            lp.unit_price,
            lp.valid_from,
            lp.valid_to,
            lp.updated_at
        FROM catalog.labor_prices lp
        WHERE (lp.valid_to IS NULL OR lp.valid_to >= CURRENT_DATE)
        ORDER BY lp.labor_type_id, lp.organization_id, lp.valid_from DESC
    ) lpc ON (lpc.labor_id = lt.id)
    LEFT JOIN public.currencies c ON (c.id = lpc.currency_id)
    LEFT JOIN public.labor_avg_prices lap ON (lap.labor_id = lt.id);

-- ------------------------------------------
-- 3.6 budget_items_view (permanece en public, pero refs actualizadas)
-- Esta vista está en public porque combina construction.quote_items + catalog.tasks
-- ------------------------------------------
DROP VIEW IF EXISTS public.budget_items_view;

CREATE OR REPLACE VIEW public.budget_items_view AS
SELECT bi.id,
    bi.quote_id AS budget_id,
    bi.organization_id,
    bi.project_id,
    bi.task_id,
    bi.created_at,
    bi.updated_at,
    bi.created_by,
    t.custom_name,
    td.name AS division_name,
    td."order" AS division_order,
    u.name AS unit,
    bi.description,
    bi.quantity,
    bi.unit_price,
    bi.currency_id,
    bi.markup_pct,
    bi.tax_pct,
    bi.cost_scope,
    CASE bi.cost_scope
        WHEN 'materials_and_labor'::cost_scope_enum THEN 'Materiales + Mano de obra'::text
        WHEN 'materials_only'::cost_scope_enum THEN 'Sólo materiales'::text
        WHEN 'labor_only'::cost_scope_enum THEN 'Sólo mano de obra'::text
        ELSE initcap(replace((bi.cost_scope)::text, '_'::text, ' '::text))
    END AS cost_scope_label,
    bi.sort_key AS "position"
FROM construction.quote_items bi
    LEFT JOIN catalog.tasks t ON (t.id = bi.task_id)
    LEFT JOIN catalog.task_divisions td ON (td.id = t.task_division_id)
    LEFT JOIN catalog.units u ON (u.id = t.unit_id);

-- ------------------------------------------
-- 3.7 organization_task_prices_view (permanece en public, refs actualizadas)
-- ------------------------------------------
DROP VIEW IF EXISTS public.organization_task_prices_view;

CREATE OR REPLACE VIEW public.organization_task_prices_view AS
SELECT p.id,
    p.organization_id,
    p.task_id,
    t.custom_name AS task_name,
    td.name AS division_name,
    td."order" AS division_order,
    u.name AS unit,
    p.labor_unit_cost,
    p.material_unit_cost,
    p.supply_unit_cost,
    COALESCE(p.total_unit_cost, ((COALESCE(p.labor_unit_cost, (0)::numeric) + COALESCE(p.material_unit_cost, (0)::numeric)) + COALESCE(p.supply_unit_cost, (0)::numeric))) AS total_unit_cost,
    p.currency_code,
    p.note,
    p.created_at,
    p.updated_at
FROM public.organization_task_prices p
    LEFT JOIN catalog.tasks t ON (t.id = p.task_id)
    LEFT JOIN catalog.task_divisions td ON (td.id = t.task_division_id)
    LEFT JOIN catalog.units u ON (u.id = t.unit_id);

-- ------------------------------------------
-- 3.8 project_material_requirements_view (permanece en public, refs actualizadas)
-- ------------------------------------------
DROP VIEW IF EXISTS public.project_material_requirements_view;

CREATE OR REPLACE VIEW public.project_material_requirements_view AS
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
FROM construction.construction_task_material_snapshots ctms
    JOIN construction.construction_tasks ct ON (ct.id = ctms.construction_task_id)
    JOIN catalog.materials m ON (m.id = ctms.material_id)
    LEFT JOIN catalog.units u ON (u.id = m.unit_id)
    LEFT JOIN catalog.material_categories mc ON (mc.id = m.category_id)
WHERE ct.is_deleted = false
  AND ct.status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'paused'::text])
GROUP BY ctms.project_id, ctms.organization_id, ctms.material_id, m.name, u.name, m.category_id, mc.name;

-- ==========================================
-- 4. GRANTS SOBRE VISTAS
-- ==========================================
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA catalog TO service_role;

-- ==========================================
-- 5. VERIFICACIÓN (ejecutar al final)
-- ==========================================
SELECT table_name FROM information_schema.tables WHERE table_schema = 'catalog' ORDER BY table_name;
SELECT table_name FROM information_schema.views WHERE table_schema = 'catalog' ORDER BY table_name;
