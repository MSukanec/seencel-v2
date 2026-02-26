-- ============================================================================
-- Script 2: Recrear task_recipes_view con costos por receta
-- Agrega mat_cost, lab_cost, ext_cost, total_cost a nivel individual
-- ============================================================================

-- Usar la misma lógica de CTEs que task_costs_view pero sin agregar por tarea
DROP VIEW IF EXISTS catalog.task_recipes_view CASCADE;

CREATE OR REPLACE VIEW catalog.task_recipes_view AS
WITH recipe_material_costs AS (
    SELECT
        trm.recipe_id,
        sum(
            (trm.total_quantity * COALESCE(mp.unit_price, 0::numeric))
            / GREATEST(COALESCE(mat.default_sale_unit_quantity, 1::numeric), 1::numeric)
        ) AS mat_cost
    FROM catalog.task_recipe_materials trm
    JOIN catalog.task_recipes tr ON tr.id = trm.recipe_id AND tr.is_deleted = false
    LEFT JOIN catalog.materials mat ON mat.id = trm.material_id
    LEFT JOIN LATERAL (
        SELECT mp_inner.unit_price
        FROM catalog.material_prices mp_inner
        WHERE mp_inner.material_id = trm.material_id
          AND mp_inner.organization_id = tr.organization_id
          AND mp_inner.valid_from <= CURRENT_DATE
          AND (mp_inner.valid_to IS NULL OR mp_inner.valid_to >= CURRENT_DATE)
        ORDER BY mp_inner.valid_from DESC
        LIMIT 1
    ) mp ON true
    WHERE trm.is_deleted = false
    GROUP BY trm.recipe_id
),
recipe_labor_costs AS (
    SELECT
        trl.recipe_id,
        sum(trl.quantity * COALESCE(lp.unit_price, 0::numeric)) AS lab_cost
    FROM catalog.task_recipe_labor trl
    JOIN catalog.task_recipes tr ON tr.id = trl.recipe_id AND tr.is_deleted = false
    LEFT JOIN LATERAL (
        SELECT lp_inner.unit_price
        FROM catalog.labor_prices lp_inner
        WHERE lp_inner.labor_type_id = trl.labor_type_id
          AND lp_inner.organization_id = tr.organization_id
          AND (lp_inner.valid_to IS NULL OR lp_inner.valid_to >= CURRENT_DATE)
        ORDER BY lp_inner.valid_from DESC
        LIMIT 1
    ) lp ON true
    WHERE trl.is_deleted = false
    GROUP BY trl.recipe_id
),
recipe_ext_service_costs AS (
    SELECT
        tres.recipe_id,
        sum(tres.unit_price) AS ext_cost
    FROM catalog.task_recipe_external_services tres
    JOIN catalog.task_recipes tr ON tr.id = tres.recipe_id AND tr.is_deleted = false
    WHERE tres.is_deleted = false
    GROUP BY tres.recipe_id
)
SELECT
    tr.id,
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
    -- Joined fields (unchanged)
    t.name AS task_name,
    t.custom_name AS task_custom_name,
    COALESCE(t.custom_name, t.name) AS task_display_name,
    td.name AS division_name,
    u.name AS unit_name,
    o.name AS org_name,
    (
        (SELECT count(*) FROM catalog.task_recipe_materials trm WHERE trm.recipe_id = tr.id AND trm.is_deleted = false)
        +
        (SELECT count(*) FROM catalog.task_recipe_labor trl WHERE trl.recipe_id = tr.id AND trl.is_deleted = false)
    ) AS item_count,
    -- NEW: Cost breakdown per recipe (live from catalog)
    COALESCE(rmc.mat_cost, 0)::numeric(14,2) AS mat_cost,
    COALESCE(rlc.lab_cost, 0)::numeric(14,2) AS lab_cost,
    COALESCE(rec.ext_cost, 0)::numeric(14,2) AS ext_cost,
    (COALESCE(rmc.mat_cost, 0) + COALESCE(rlc.lab_cost, 0) + COALESCE(rec.ext_cost, 0))::numeric(14,2) AS total_cost
FROM catalog.task_recipes tr
LEFT JOIN catalog.tasks t ON t.id = tr.task_id
LEFT JOIN catalog.task_divisions td ON td.id = t.task_division_id
LEFT JOIN catalog.units u ON u.id = t.unit_id
LEFT JOIN iam.organizations o ON o.id = tr.organization_id
LEFT JOIN recipe_material_costs rmc ON rmc.recipe_id = tr.id
LEFT JOIN recipe_labor_costs rlc ON rlc.recipe_id = tr.id
LEFT JOIN recipe_ext_service_costs rec ON rec.recipe_id = tr.id
WHERE tr.is_deleted = false;
