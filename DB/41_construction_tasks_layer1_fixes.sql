-- ============================================================================
-- CAPA 1 FIXES: construction_tasks + construction_dependencies
-- Fecha: 2026-03-20
-- Contexto: Auditoría de Tareas de Construcción
-- ============================================================================

-- 1. Agregar trigger set_timestamp a construction_tasks
--    (updated_at nunca se auto-actualiza en UPDATEs actualmente)
CREATE OR REPLACE TRIGGER update_construction_tasks_timestamp
    BEFORE UPDATE ON construction.construction_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamp();

-- 2. Hacer updated_at NOT NULL en construction_tasks
ALTER TABLE construction.construction_tasks
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE construction.construction_tasks
    ALTER COLUMN updated_at SET DEFAULT now();

-- 3. Agregar trigger set_timestamp a construction_dependencies
CREATE OR REPLACE TRIGGER update_construction_dependencies_timestamp
    BEFORE UPDATE ON construction.construction_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamp();
