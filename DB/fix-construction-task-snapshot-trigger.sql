-- ============================================
-- FIX: create_construction_task_material_snapshot trigger
-- 
-- Problema: El trigger referencia "task_materials" que no existe.
-- La tabla correcta es "task_recipe_materials".
-- Además, el WHERE usaba task_id pero la FK correcta es recipe_id.
--
-- Ahora el sistema usa multi-receta, así que el snapshot debe
-- basarse en recipe_id (no task_id) de la construction_task.
-- ============================================

CREATE OR REPLACE FUNCTION create_construction_task_material_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create snapshot if recipe_id is set
    IF NEW.recipe_id IS NOT NULL THEN
        INSERT INTO construction_task_material_snapshots (
            construction_task_id,
            material_id,
            quantity_planned,
            amount_per_unit,
            unit_id,
            source_task_id,
            organization_id,
            project_id,
            snapshot_at
        )
        SELECT
            NEW.id,
            trm.material_id,
            (COALESCE(NEW.quantity, 0) * COALESCE(trm.amount, 0))::NUMERIC(20, 4),
            trm.amount,
            m.unit_id,
            NEW.task_id,
            NEW.organization_id,
            NEW.project_id,
            NOW()
        FROM task_recipe_materials trm
        INNER JOIN materials m ON m.id = trm.material_id
        WHERE trm.recipe_id = NEW.recipe_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
