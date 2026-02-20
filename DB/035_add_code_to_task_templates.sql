-- ============================================================
-- 035_add_code_to_task_templates.sql
--
-- Agrega columna `code` a catalog.task_templates.
--
-- El código del template es la raíz del código de toda tarea
-- generada desde él. Ej: template "EJE-MUR" genera tareas
-- "EJE-MUR-LCH", "EJE-MUR-HRM", etc.
--
-- Diseño:
--   - varchar(20): suficiente para codigos como "EJE-MUR-TSQ"
--   - UNIQUE: una sola plantilla por combinación de código
--   - NOT NULL: se genera automáticamente en el frontend
--     a partir de action.short_code + element.code
-- ============================================================

ALTER TABLE catalog.task_templates
    ADD COLUMN code varchar(20) NULL;

-- Índice único parcial (solo sobre registros no eliminados)
CREATE UNIQUE INDEX idx_task_templates_code
    ON catalog.task_templates (code)
    WHERE is_deleted = false;

-- ============================================================
-- NOTA PARA EL ADMIN:
-- Después de ejecutar esta migración, ir a cada template
-- existente y asignarle su código manualmente, o ejecutar
-- un UPDATE generativo:
--
-- UPDATE catalog.task_templates tt
-- SET code = CONCAT(
--     UPPER(SUBSTRING(ta.short_code, 1, 3)), '-',
--     UPPER(SUBSTRING(te.code, 1, 3))
-- )
-- FROM catalog.task_actions ta, catalog.task_elements te
-- WHERE tt.task_action_id = ta.id
--   AND tt.task_element_id = te.id
--   AND tt.code IS NULL
--   AND tt.is_deleted = false;
-- ============================================================
