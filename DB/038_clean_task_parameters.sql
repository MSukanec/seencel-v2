-- =============================================================================
-- Migration 038: Clean up unused columns from catalog.task_parameters
-- =============================================================================
-- Eliminamos columnas que nunca tuvieron uso real:
--   - "order": el orden se maneja en task_template_parameters.order por template
--   - default_value: nunca se usa en el sistema
--   - validation_rules: nunca se definieron reglas, siempre null

ALTER TABLE catalog.task_parameters
    DROP COLUMN IF EXISTS "order",
    DROP COLUMN IF EXISTS default_value,
    DROP COLUMN IF EXISTS validation_rules;

-- Note: expression_template se CONSERVA — se usará para alias/sufijos en generación de nombre.
-- Note: is_required se CONSERVA en task_parameters como valor base por defecto,
--       pero el valor definitivo (obligatorio por template) está en task_template_parameters.is_required.
