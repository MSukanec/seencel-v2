-- ============================================================================
-- Remove is_optional from recipe resource tables
-- ============================================================================
-- This column is not used in any business logic and adds unnecessary complexity.
-- No views reference is_optional, so no view changes are needed.
-- ============================================================================

-- 1. task_recipe_materials
ALTER TABLE public.task_recipe_materials DROP COLUMN IF EXISTS is_optional;

-- 2. task_recipe_labor
ALTER TABLE public.task_recipe_labor DROP COLUMN IF EXISTS is_optional;

-- 3. task_recipe_external_services
ALTER TABLE public.task_recipe_external_services DROP COLUMN IF EXISTS is_optional;
