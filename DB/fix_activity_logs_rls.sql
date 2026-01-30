-- ============================================================
-- FIX: Enable RLS on 'organization_activity_logs' for admin access
-- Date: 2026-01-30
-- Issue: Admins cannot see activity logs from all organizations
-- ============================================================

-- 1. Enable RLS on the base table (if not already)
ALTER TABLE public.organization_activity_logs ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: Admins ven todo, miembros ven su org
CREATE POLICY "MIEMBROS VEN ACTIVITY_LOGS"
ON public.organization_activity_logs
FOR SELECT TO public
USING (is_admin() OR is_org_member(organization_id));

