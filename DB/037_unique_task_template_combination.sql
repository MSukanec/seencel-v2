-- =============================================================================
-- ADD UNIQUE CONSTRAINT: catalog.task_templates
-- Objetivo: Garantizar que NO puedan existir dos templates con la misma
--           combinación semántica de (action + element + system).
--
-- Definición de unicidad:
--   Un template es la combinación de:
--     - task_action_id: qué operación se realiza (ej: Revocar)
--     - task_element_id: sobre qué elemento (ej: Pared)
--     - task_construction_system_id: con qué sistema constructivo (ej: Mamp. ladrillo)
--
--   Esa tripleta define unívocamente una tarea paramétrica.
--   Dos templates con esa misma tripleta son duplicados semánticos.
--   El constraint aplica solo sobre registros NO eliminados (partial index).
-- =============================================================================

-- Partial unique index: solo aplica sobre templates activos (no soft-deleted)
-- Esto permite que un template eliminado no bloquee la creación de uno nuevo
-- con la misma combinación.
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_templates_unique_combination
    ON catalog.task_templates (task_action_id, task_element_id, task_construction_system_id)
    WHERE is_deleted = false;
