-- =============================================================================
-- Migration 039: Clean up unused columns from catalog.task_actions
-- =============================================================================
-- Eliminamos columnas que no tienen sentido en el modelo actual:
--   - sort_order: las acciones no necesitan orden manual
--   - action_type: duplica información sin uso real en el sistema

ALTER TABLE catalog.task_actions
    DROP COLUMN IF EXISTS sort_order,
    DROP COLUMN IF EXISTS action_type;

-- El índice sobre action_type también puede eliminarse
DROP INDEX IF EXISTS catalog.idx_task_actions_action_type;
