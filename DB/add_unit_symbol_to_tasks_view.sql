-- ============================================================================
-- MIGRACIÓN: Agregar unit_symbol a tasks_view
-- Fecha: 2026-02-13
-- Descripción: Agrega el símbolo de la unidad (u.symbol) a la vista tasks_view
--              para poder mostrarlo en el catálogo de tareas junto al nombre.
-- ============================================================================

-- DROP la vista existente
DROP VIEW IF EXISTS public.tasks_view;

-- CREATE con el campo unit_symbol agregado
CREATE VIEW public.tasks_view AS
SELECT
  t.id,
  t.code,
  t.name,
  t.custom_name,
  t.description,
  t.is_system,
  t.is_published,
  t.is_deleted,
  t.organization_id,
  t.unit_id,
  t.task_division_id,
  t.task_action_id,
  t.task_element_id,
  t.is_parametric,
  t.parameter_values,
  t.import_batch_id,
  t.created_at,
  t.updated_at,
  t.created_by,
  t.updated_by,
  u.name AS unit_name,
  u.symbol AS unit_symbol,   -- ← NUEVO: símbolo de la unidad (m², ml, u, etc.)
  d.name AS division_name,
  ta.name AS action_name,
  ta.short_code AS action_short_code,
  te.name AS element_name
FROM
  tasks t
  LEFT JOIN units u ON u.id = t.unit_id
  LEFT JOIN task_divisions d ON d.id = t.task_division_id
  LEFT JOIN task_actions ta ON ta.id = t.task_action_id
  LEFT JOIN task_elements te ON te.id = t.task_element_id;
