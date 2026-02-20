-- ============================================================
-- 037_drop_element_default_unit.sql
--
-- Elimina la columna default_unit_id de catalog.task_elements.
--
-- MOTIVO:
--   La unidad de medida es un atributo del TEMPLATE de tarea
--   (task_templates.unit_id), no del elemento constructivo.
--   Un mismo elemento (ej: "Muro") puede medirse en m², ml o
--   m³ dependiendo de la tarea específica, por lo que un
--   default en el elemento no tiene sentido semántico.
-- ============================================================

ALTER TABLE catalog.task_elements
    DROP COLUMN IF EXISTS default_unit_id;
