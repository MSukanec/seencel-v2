-- ============================================================================
-- CLEANUP: ai_organization_usage_limits — Remove boilerplate columns & triggers
-- 
-- This table is auto-managed by the system (incrementAIUsage), not by users.
-- It doesn't need: soft delete, import_batch, created_by/updated_by, nor audit.
-- ============================================================================

-- 1. Drop unnecessary triggers
DROP TRIGGER IF EXISTS set_updated_by_ai_organization_usage_limits ON ai.ai_organization_usage_limits;
DROP TRIGGER IF EXISTS on_ai_org_limit_audit ON ai.ai_organization_usage_limits;

-- 2. Drop unnecessary columns
ALTER TABLE ai.ai_organization_usage_limits
    DROP COLUMN IF EXISTS is_deleted,
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS created_by,
    DROP COLUMN IF EXISTS updated_by,
    DROP COLUMN IF EXISTS import_batch_id;

-- 3. Drop the orphaned audit function (only used by the removed trigger)
DROP FUNCTION IF EXISTS public.log_ai_org_limit_activity() CASCADE;
