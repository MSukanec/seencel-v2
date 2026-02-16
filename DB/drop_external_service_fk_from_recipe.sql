-- ============================================================================
-- Limpiar task_recipe_external_services después de eliminar external_services
-- ============================================================================

-- 1. Dropar constraints FK e índices que referencian external_service_id
ALTER TABLE public.task_recipe_external_services
  DROP CONSTRAINT IF EXISTS task_recipe_external_services_external_service_id_fkey;

DROP INDEX IF EXISTS public.idx_task_recipe_ext_services_service;
DROP INDEX IF EXISTS public.uq_task_recipe_ext_services_recipe_service;

-- 2. Dropar la columna external_service_id
ALTER TABLE public.task_recipe_external_services
  DROP COLUMN IF EXISTS external_service_id;

-- 3. Recrear el unique index sin external_service_id
--    (si necesitás un nuevo unique constraint, ajustalo según el nuevo diseño)
--    Por ahora no se recrea — definilo cuando tengas claro el nuevo modelo.
