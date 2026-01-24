-- ============================================================================
-- Migración: Cleanup - Eliminar description y custom_name
-- Fecha: 2026-01-24
-- Descripción: Simplifica tabla tasks, migra datos necesarios
-- ============================================================================

-- ============================================================================
-- PASO 1: Migrar datos de custom_name a name (si name está vacío)
-- ============================================================================

-- Cualquier tarea que tenga custom_name pero no name, copiar el valor
UPDATE tasks 
SET name = custom_name 
WHERE name IS NULL AND custom_name IS NOT NULL;

-- ============================================================================
-- PASO 2: Eliminar índices que dependen de custom_name
-- ============================================================================

DROP INDEX IF EXISTS tasks_custom_name_system_uniq;
DROP INDEX IF EXISTS tasks_custom_name_org_uniq;

-- ============================================================================
-- PASO 3: Crear nuevos índices sobre name
-- ============================================================================

-- Para tareas de sistema: name único globalmente
CREATE UNIQUE INDEX IF NOT EXISTS tasks_name_system_uniq 
ON tasks (lower(name)) 
WHERE (is_system = true AND name IS NOT NULL AND is_deleted = false);

-- Para tareas de organización: name único por org
CREATE UNIQUE INDEX IF NOT EXISTS tasks_name_org_uniq 
ON tasks (organization_id, lower(name)) 
WHERE (is_system = false AND name IS NOT NULL AND is_deleted = false);

-- ============================================================================
-- PASO 4: Eliminar columnas obsoletas
-- ============================================================================

ALTER TABLE tasks DROP COLUMN IF EXISTS custom_name;
ALTER TABLE tasks DROP COLUMN IF EXISTS description;

-- ============================================================================
-- NOTA: Verificar que no haya código que use estas columnas antes de ejecutar
-- ============================================================================
