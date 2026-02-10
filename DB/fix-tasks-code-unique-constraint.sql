-- ============================================
-- FIX: tasks_code_lower_uniq constraint
-- 
-- Problema: El constraint actual no excluye registros soft-deleted,
-- lo que impide re-importar tareas con el mismo código que una eliminada.
--
-- Solución: Reemplazar el unique constraint por un partial unique index
-- que solo aplique a registros NO eliminados (is_deleted = false).
-- ============================================

-- 1. Eliminar el constraint actual
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_code_lower_uniq;

-- 2. También eliminar si fue creado como índice
DROP INDEX IF EXISTS tasks_code_lower_uniq;

-- 3. Crear partial unique index que excluye soft-deleted
CREATE UNIQUE INDEX tasks_code_lower_uniq 
ON tasks (organization_id, lower(code)) 
WHERE is_deleted = false AND code IS NOT NULL;
