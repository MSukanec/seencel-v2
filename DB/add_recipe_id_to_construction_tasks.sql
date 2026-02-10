-- ============================================================================
-- Add recipe_id to construction_tasks
-- ============================================================================

-- 1. Add recipe_id column with FK
ALTER TABLE public.construction_tasks
ADD COLUMN recipe_id uuid NULL;

ALTER TABLE public.construction_tasks
ADD CONSTRAINT construction_tasks_recipe_id_fkey 
  FOREIGN KEY (recipe_id) 
  REFERENCES task_recipes (id) 
  ON DELETE SET NULL;

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_construction_tasks_recipe_id 
  ON public.construction_tasks USING btree (recipe_id) 
  TABLESPACE pg_default;

-- ============================================================================
-- Update construction_tasks_view to include recipe info
-- ============================================================================

DROP VIEW IF EXISTS public.construction_tasks_view;

CREATE VIEW public.construction_tasks_view AS
SELECT
  ct.id,
  ct.organization_id,
  ct.project_id,
  ct.task_id,
  ct.recipe_id,
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
    WHEN ct.actual_end_date IS NOT NULL
    AND ct.planned_end_date IS NOT NULL THEN ct.actual_end_date - ct.planned_end_date
    ELSE NULL::integer
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
  ph.phase_name,
  tr.name AS recipe_name
FROM
  construction_tasks ct
  LEFT JOIN tasks t ON t.id = ct.task_id
  LEFT JOIN units u ON u.id = t.unit_id
  LEFT JOIN task_divisions td ON td.id = t.task_division_id
  LEFT JOIN quote_items qi ON qi.id = ct.quote_item_id
  LEFT JOIN quotes q ON q.id = qi.quote_id
  LEFT JOIN task_recipes tr ON tr.id = ct.recipe_id
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
