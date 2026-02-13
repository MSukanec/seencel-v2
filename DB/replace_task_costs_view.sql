-- ============================================================================
-- FIX task_costs_view: precio correcto + semáforo de frescura
-- ============================================================================
-- Fix 1: material_prices.unit_price es por UNIDAD DE VENTA (ej: bolsa).
--         Dividir por materials.default_sale_unit_quantity para obtener
--         precio por UNIDAD DE CÓMPUTO (ej: KG).
-- Fix 2: Agregar oldest_price_date = MIN(valid_from) de todos los
--         componentes para calcular semáforo de frescura en el frontend.
-- ============================================================================

DROP VIEW IF EXISTS public.task_costs_view;

CREATE VIEW public.task_costs_view AS
WITH recipe_material_costs AS (
    -- Costo total de materiales por receta
    SELECT
        trm.recipe_id,
        tr.task_id,
        tr.organization_id,
        SUM(
            trm.total_quantity
            * COALESCE(mp.unit_price, 0)
            / GREATEST(COALESCE(mat.default_sale_unit_quantity, 1), 1)
        ) AS mat_cost,
        MIN(mp.valid_from) AS oldest_mat_price_date
    FROM task_recipe_materials trm
    JOIN task_recipes tr ON tr.id = trm.recipe_id
        AND tr.is_deleted = false
    LEFT JOIN materials mat ON mat.id = trm.material_id
    LEFT JOIN LATERAL (
        SELECT mp_inner.unit_price, mp_inner.valid_from
        FROM material_prices mp_inner
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
    -- Costo total de mano de obra por receta
    SELECT
        trl.recipe_id,
        tr.task_id,
        tr.organization_id,
        SUM(
            trl.quantity * COALESCE(lp.unit_price, 0)
        ) AS lab_cost,
        MIN(lp.valid_from) AS oldest_lab_price_date
    FROM task_recipe_labor trl
    JOIN task_recipes tr ON tr.id = trl.recipe_id
        AND tr.is_deleted = false
    LEFT JOIN LATERAL (
        SELECT lp_inner.unit_price, lp_inner.valid_from
        FROM labor_prices lp_inner
        WHERE lp_inner.labor_type_id = trl.labor_type_id
          AND lp_inner.organization_id = tr.organization_id
          AND (lp_inner.valid_to IS NULL OR lp_inner.valid_to >= CURRENT_DATE)
        ORDER BY lp_inner.valid_from DESC
        LIMIT 1
    ) lp ON true
    WHERE trl.is_deleted = false
    GROUP BY trl.recipe_id, tr.task_id, tr.organization_id
),
recipe_totals AS (
    -- Total por receta = materiales + labor
    SELECT
        tr.id AS recipe_id,
        tr.task_id,
        tr.organization_id,
        COALESCE(rmc.mat_cost, 0) AS mat_cost,
        COALESCE(rlc.lab_cost, 0) AS lab_cost,
        COALESCE(rmc.mat_cost, 0) + COALESCE(rlc.lab_cost, 0) AS total_cost,
        LEAST(rmc.oldest_mat_price_date, rlc.oldest_lab_price_date) AS oldest_price_date
    FROM task_recipes tr
    LEFT JOIN recipe_material_costs rmc
        ON rmc.recipe_id = tr.id
    LEFT JOIN recipe_labor_costs rlc
        ON rlc.recipe_id = tr.id
    WHERE tr.is_deleted = false
)
-- Promedio de costos entre todas las recetas de la tarea para esa org
SELECT
    rt.task_id,
    rt.organization_id,
    ROUND(AVG(rt.total_cost), 2)::numeric(14, 4) AS unit_cost,
    ROUND(AVG(rt.mat_cost), 2)::numeric(14, 4) AS mat_unit_cost,
    ROUND(AVG(rt.lab_cost), 2)::numeric(14, 4) AS lab_unit_cost,
    COUNT(rt.recipe_id)::integer AS recipe_count,
    ROUND(MIN(rt.total_cost), 2)::numeric(14, 4) AS min_cost,
    ROUND(MAX(rt.total_cost), 2)::numeric(14, 4) AS max_cost,
    MIN(rt.oldest_price_date) AS oldest_price_date
FROM recipe_totals rt
GROUP BY rt.task_id, rt.organization_id;
