-- ============================================================
-- 036_add_expression_template.sql
--
-- Agrega columna `expression_template` a task_elements y
-- task_construction_systems.
--
-- PROPÓSITO:
--   Permite configurar cómo se renderiza cada entidad dentro
--   del nombre compuesto de un template de tarea.
--   El placeholder {value} es reemplazado por el nombre de
--   la entidad en el momento de generar el nombre del template.
--
-- EJEMPLOS:
--   element.expression_template = "de {value}"
--     → "de Muro", "de Contrapiso", "de Cañería"
--   element.expression_template = "{value}"
--     → "Obra Completa" (sin preposición)
--   system.expression_template = "con {value}"
--     → "con Hormigón armado"
--   system.expression_template = "de {value}"
--     → "de Mampostería cerámica hueca"
--
-- DEFAULT:
--   Si expression_template es NULL o vacío, el frontend usa
--   "de {value}" como fallback (comportamiento actual).
-- ============================================================

-- task_elements
ALTER TABLE catalog.task_elements
    ADD COLUMN IF NOT EXISTS expression_template text NULL;

-- task_construction_systems
ALTER TABLE catalog.task_construction_systems
    ADD COLUMN IF NOT EXISTS expression_template text NULL;

-- ============================================================
-- POPULATING DEFAULTS (optional, run después de ADD COLUMN)
--
-- Rellena los registros existentes con el template por defecto
-- "de {value}" para mantener el comportamiento actual:
--
-- UPDATE catalog.task_elements
-- SET expression_template = 'de {value}'
-- WHERE expression_template IS NULL;
--
-- UPDATE catalog.task_construction_systems
-- SET expression_template = 'de {value}'
-- WHERE expression_template IS NULL;
-- ============================================================
