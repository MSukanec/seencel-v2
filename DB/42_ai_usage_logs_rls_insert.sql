-- ============================================================================
-- FIX: ai schema tables missing INSERT/UPDATE policies
-- Without these, logAIUsage() and incrementAIUsage() silently fail
-- because RLS blocks the operations (only SELECT existed)
-- ============================================================================

-- ─── ai_usage_logs ───────────────────────────────────────────────────────────
-- Used by logAIUsage() to record each AI call

CREATE POLICY "MEMBERS INSERT AI_USAGE_LOGS"
ON ai.ai_usage_logs
FOR INSERT
TO authenticated
WITH CHECK (
    iam.is_org_member(organization_id)
);

-- ─── ai_organization_usage_limits ────────────────────────────────────────────
-- Used by incrementAIUsage() to create/update daily counters
-- Used by checkAIUsageLimit() to reset daily counter when day changes

CREATE POLICY "MEMBERS INSERT AI_ORGANIZATION_USAGE_LIMITS"
ON ai.ai_organization_usage_limits
FOR INSERT
TO authenticated
WITH CHECK (
    iam.is_org_member(organization_id)
);

CREATE POLICY "MEMBERS UPDATE AI_ORGANIZATION_USAGE_LIMITS"
ON ai.ai_organization_usage_limits
FOR UPDATE
TO authenticated
USING (
    iam.is_org_member(organization_id)
);
