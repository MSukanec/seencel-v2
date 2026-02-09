-- ============================================================
-- CONSTRUCTION_TASKS — Correcciones de integridad
-- Fecha: 2026-02-09
-- ============================================================
-- EJECUTAR TODO JUNTO como un bloque.
-- ============================================================


-- -------------------------------------------------------
-- 1. Cambiar task_id FK de CASCADE a SET NULL
-- -------------------------------------------------------
ALTER TABLE public.construction_tasks
  DROP CONSTRAINT construction_tasks_task_id_fkey;

ALTER TABLE public.construction_tasks
  ADD CONSTRAINT construction_tasks_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES tasks (id)
  ON DELETE SET NULL;


-- -------------------------------------------------------
-- 2. Hacer organization_id NOT NULL
--    ⚠️ Verificar antes: SELECT count(*) FROM construction_tasks WHERE organization_id IS NULL;
-- -------------------------------------------------------
ALTER TABLE public.construction_tasks
  ALTER COLUMN organization_id SET NOT NULL;


-- -------------------------------------------------------
-- 3. Hacer project_id NOT NULL
--    ⚠️ Verificar antes: SELECT count(*) FROM construction_tasks WHERE project_id IS NULL;
-- -------------------------------------------------------
ALTER TABLE public.construction_tasks
  ALTER COLUMN project_id SET NOT NULL;


-- -------------------------------------------------------
-- 4. Dropear la vista ANTES de renombrar columnas
--    (PostgreSQL no permite renombrar columnas si hay
--    vistas dependientes)
-- -------------------------------------------------------
DROP VIEW IF EXISTS public.construction_tasks_view;


-- -------------------------------------------------------
-- 5. Renombrar fechas existentes a "planned" y agregar "actual"
-- -------------------------------------------------------
ALTER TABLE public.construction_tasks
  RENAME COLUMN start_date TO planned_start_date;

ALTER TABLE public.construction_tasks
  RENAME COLUMN end_date TO planned_end_date;

ALTER TABLE public.construction_tasks
  ADD COLUMN actual_start_date date NULL,
  ADD COLUMN actual_end_date date NULL;

COMMENT ON COLUMN public.construction_tasks.planned_start_date IS 'Fecha de inicio planificada al momento de crear/programar la tarea';
COMMENT ON COLUMN public.construction_tasks.planned_end_date IS 'Fecha de fin planificada al momento de crear/programar la tarea';
COMMENT ON COLUMN public.construction_tasks.actual_start_date IS 'Fecha en que realmente comenzó la ejecución';
COMMENT ON COLUMN public.construction_tasks.actual_end_date IS 'Fecha en que realmente finalizó la ejecución';


-- -------------------------------------------------------
-- 6. Recrear la vista con los nuevos nombres de columna
-- -------------------------------------------------------
CREATE OR REPLACE VIEW public.construction_tasks_view AS
SELECT
  ct.id,
  ct.organization_id,
  ct.project_id,
  ct.task_id,
  ct.quote_item_id,
  COALESCE(t.custom_name, t.name, ct.custom_name) AS task_name,
  COALESCE(u.name, ct.custom_unit) AS unit,
  td.name AS division_name,
  ct.cost_scope,
  CASE ct.cost_scope
    WHEN 'materials_and_labor'::cost_scope_enum THEN 'M.O. + MAT.'::text
    WHEN 'labor_only'::cost_scope_enum THEN 'M.O.'::text
    WHEN 'materials_only'::cost_scope_enum THEN 'MAT'::text
    ELSE 'M.O. + MAT.'::text
  END AS cost_scope_label,
  ct.quantity,
  ct.original_quantity,
  CASE
    WHEN ct.original_quantity IS NOT NULL
    AND ct.original_quantity > 0::double precision THEN ct.quantity - ct.original_quantity
    ELSE NULL::real
  END AS quantity_variance,
  ct.planned_start_date,
  ct.planned_end_date,
  ct.actual_start_date,
  ct.actual_end_date,
  CASE
    WHEN ct.actual_end_date IS NOT NULL AND ct.planned_end_date IS NOT NULL
    THEN (ct.actual_end_date - ct.planned_end_date)
    ELSE NULL
  END AS schedule_variance_days,
  ct.duration_in_days,
  ct.progress_percent,
  ct.status,
  ct.description,
  ct.notes,
  ct.custom_name,
  ct.custom_unit,
  ct.created_at,
  ct.updated_at,
  ct.created_by,
  ct.updated_by,
  ct.is_deleted,
  qi.quote_id,
  q.name AS quote_name,
  qi.markup_pct AS quote_markup_pct,
  ph.phase_name
FROM
  construction_tasks ct
  LEFT JOIN tasks t ON t.id = ct.task_id
  LEFT JOIN units u ON u.id = t.unit_id
  LEFT JOIN task_divisions td ON td.id = t.task_division_id
  LEFT JOIN quote_items qi ON qi.id = ct.quote_item_id
  LEFT JOIN quotes q ON q.id = qi.quote_id
  LEFT JOIN LATERAL (
    SELECT
      cp.name AS phase_name
    FROM
      construction_phase_tasks cpt
      JOIN construction_phases cp ON cp.id = cpt.project_phase_id
    WHERE
      cpt.construction_task_id = ct.id
    ORDER BY
      cpt.created_at DESC
    LIMIT
      1
  ) ph ON true
WHERE
  ct.is_deleted = false;
