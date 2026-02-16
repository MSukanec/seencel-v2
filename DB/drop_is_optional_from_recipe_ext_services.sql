-- Eliminar columna is_optional de task_recipe_external_services
ALTER TABLE public.task_recipe_external_services
  DROP COLUMN IF EXISTS is_optional;
