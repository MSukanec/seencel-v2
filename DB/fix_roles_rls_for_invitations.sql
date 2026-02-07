-- ============================================================
-- NEW RLS POLICY: Invited users can see their assigned role
-- Similar pattern to existing member-based policies, but for
-- users who have a pending invitation with a role_id assigned.
-- Does NOT modify existing policies.
-- ============================================================

CREATE POLICY "Invited users can view their assigned role"
ON public.roles
FOR SELECT
USING (
    id IN (
        SELECT oi.role_id
        FROM organization_invitations oi
        JOIN users u ON u.auth_id = auth.uid()
        WHERE oi.email = u.email
          AND oi.status = 'pending'
          AND oi.role_id IS NOT NULL
    )
);
