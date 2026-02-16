-- ============================================================================
-- Refactor: task_recipe_external_services
-- 1. DROP task_costs_view (depende de tres.quantity)
-- 2. DROP columna quantity (siempre es 1)
-- 3. ADD columna includes_materials (bool, default false)
-- 4. Recrear task_costs_view con unit_price directo (sin quantity)
-- ============================================================================

-- ─── Paso 1: Eliminar vista dependiente ────────────────────────────────────
DROP VIEW IF EXISTS public.task_costs_view;

-- ─── Paso 2: Modificar tabla ───────────────────────────────────────────────
ALTER TABLE public.task_recipe_external_services
DROP COLUMN IF EXISTS quantity;

ALTER TABLE public.task_recipe_external_services
ADD COLUMN IF NOT EXISTS includes_materials boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.task_recipe_external_services.includes_materials
IS 'true = Llave en mano (incluye materiales). false = Solo servicio/mano de obra (default).';

-- ─── Paso 3: Recrear task_costs_view ───────────────────────────────────────
-- Cambio: recipe_ext_service_costs ahora usa SUM(tres.unit_price) sin quantity
CREATE OR REPLACE VIEW public.task_costs_view AS
WITH recipe_material_costs AS (
    SELECT trm.recipe_id,
        tr.task_id,
        tr.organization_id,
        sum(((trm.total_quantity * COALESCE(mp.unit_price, (0)::numeric)) / GREATEST(COALESCE(mat.default_sale_unit_quantity, (1)::numeric), (1)::numeric))) AS mat_cost,
        min(mp.valid_from) AS oldest_mat_price_date
    FROM (((task_recipe_materials trm
        JOIN task_recipes tr ON (((tr.id = trm.recipe_id) AND (tr.is_deleted = false))))
        LEFT JOIN materials mat ON ((mat.id = trm.material_id)))
        LEFT JOIN LATERAL (
            SELECT mp_inner.unit_price,
                mp_inner.valid_from
            FROM material_prices mp_inner
            WHERE ((mp_inner.material_id = trm.material_id)
                AND (mp_inner.organization_id = tr.organization_id)
                AND (mp_inner.valid_from <= CURRENT_DATE)
                AND ((mp_inner.valid_to IS NULL) OR (mp_inner.valid_to >= CURRENT_DATE)))
            ORDER BY mp_inner.valid_from DESC
            LIMIT 1
        ) mp ON (true))
    WHERE (trm.is_deleted = false)
    GROUP BY trm.recipe_id, tr.task_id, tr.organization_id
), recipe_labor_costs AS (
    SELECT trl.recipe_id,
        tr.task_id,
        tr.organization_id,
        sum((trl.quantity * COALESCE(lp.unit_price, (0)::numeric))) AS lab_cost,
        min(lp.valid_from) AS oldest_lab_price_date
    FROM ((task_recipe_labor trl
        JOIN task_recipes tr ON (((tr.id = trl.recipe_id) AND (tr.is_deleted = false))))
        LEFT JOIN LATERAL (
            SELECT lp_inner.unit_price,
                lp_inner.valid_from
            FROM labor_prices lp_inner
            WHERE ((lp_inner.labor_type_id = trl.labor_type_id)
                AND (lp_inner.organization_id = tr.organization_id)
                AND ((lp_inner.valid_to IS NULL) OR (lp_inner.valid_to >= CURRENT_DATE)))
            ORDER BY lp_inner.valid_from DESC
            LIMIT 1
        ) lp ON (true))
    WHERE (trl.is_deleted = false)
    GROUP BY trl.recipe_id, tr.task_id, tr.organization_id
), recipe_ext_service_costs AS (
    -- CAMBIO: quantity eliminada, se usa unit_price directamente
    SELECT tres.recipe_id,
        tr.task_id,
        tr.organization_id,
        sum(tres.unit_price) AS ext_cost
    FROM (task_recipe_external_services tres
        JOIN task_recipes tr ON (((tr.id = tres.recipe_id) AND (tr.is_deleted = false))))
    WHERE (tres.is_deleted = false)
    GROUP BY tres.recipe_id, tr.task_id, tr.organization_id
), recipe_totals AS (
    SELECT tr.id AS recipe_id,
        tr.task_id,
        tr.organization_id,
        COALESCE(rmc.mat_cost, (0)::numeric) AS mat_cost,
        COALESCE(rlc.lab_cost, (0)::numeric) AS lab_cost,
        COALESCE(rec.ext_cost, (0)::numeric) AS ext_cost,
        ((COALESCE(rmc.mat_cost, (0)::numeric) + COALESCE(rlc.lab_cost, (0)::numeric)) + COALESCE(rec.ext_cost, (0)::numeric)) AS total_cost,
        LEAST(rmc.oldest_mat_price_date, rlc.oldest_lab_price_date) AS oldest_price_date
    FROM (((task_recipes tr
        LEFT JOIN recipe_material_costs rmc ON ((rmc.recipe_id = tr.id)))
        LEFT JOIN recipe_labor_costs rlc ON ((rlc.recipe_id = tr.id)))
        LEFT JOIN recipe_ext_service_costs rec ON ((rec.recipe_id = tr.id)))
    WHERE (tr.is_deleted = false)
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
