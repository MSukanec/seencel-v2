-- ============================================================
-- 007: Fix organizations RLS for soft delete
-- ============================================================
-- Problem: When doing a soft delete (UPDATE is_deleted = true),
-- the USING clause requires is_deleted = false (passes on the OLD row),
-- but PostgreSQL implicitly re-evaluates SELECT policies on the
-- resulting row. Since the SELECT policy also requires is_deleted = false,
-- the UPDATE fails after the row is mutated.
--
-- Fix: The WITH CHECK on UPDATE should NOT include is_deleted = false,
-- so the resulting row (with is_deleted = true) passes validation.
-- The current WITH CHECK is correct for this, but we need to ensure
-- it's explicitly set (not inherited from USING).
--
-- Additionally, we must ensure the SELECT policy doesn't block
-- the UPDATE by allowing the owner/admin to see their own org
-- even when deleted (for the UPDATE operation context).
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "DUEÑOS EDITAN SU ORGANIZACION" ON public.organizations;
DROP POLICY IF EXISTS "USUARIOS VEN ORGANIZACIONES" ON public.organizations;

-- Recreate UPDATE policy with explicit WITH CHECK that allows soft delete
-- USING: Only non-deleted orgs can be targeted for update (owner or admin)
-- WITH CHECK: The resulting row only needs owner or admin check (no is_deleted constraint)
CREATE POLICY "DUEÑOS EDITAN SU ORGANIZACION"
ON public.organizations
FOR UPDATE
TO public
USING (
  (is_deleted = false)
  AND (
    (owner_id = (SELECT users.id FROM users WHERE users.auth_id = auth.uid()))
    OR is_admin()
  )
)
WITH CHECK (
  (owner_id = (SELECT users.id FROM users WHERE users.auth_id = auth.uid()))
  OR is_admin()
);

-- Recreate SELECT policy allowing owners/admins to see deleted orgs too
-- This is necessary because PostgreSQL checks SELECT visibility on the
-- resulting row during UPDATE operations.
CREATE POLICY "USUARIOS VEN ORGANIZACIONES"
ON public.organizations
FOR SELECT
TO public
USING (
  (is_deleted = false)
  OR (owner_id = (SELECT users.id FROM users WHERE users.auth_id = auth.uid()))
  OR is_admin()
);
