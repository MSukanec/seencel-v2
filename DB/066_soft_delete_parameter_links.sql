-- ============================================================================
-- 066: Soft Delete para tablas de links de parámetros
-- Agrega columnas is_deleted + deleted_at a task_system_parameters
-- y task_template_parameters para reemplazar hard delete.
-- ============================================================================

-- 1. task_system_parameters
ALTER TABLE catalog.task_system_parameters
    ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. task_template_parameters
ALTER TABLE catalog.task_template_parameters
    ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 3. Índices parciales para queries filtradas
CREATE INDEX IF NOT EXISTS idx_task_system_parameters_active
    ON catalog.task_system_parameters (system_id)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_task_template_parameters_active
    ON catalog.task_template_parameters (template_id)
    WHERE is_deleted = false;

-- 4. Fix: deleteParameterOption debería ser soft delete
-- (la tabla task_parameter_options ya tiene is_deleted/deleted_at)
-- No requiere ALTER, solo cambio en frontend.
