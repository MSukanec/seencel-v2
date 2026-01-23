-- ============================================================================
-- RLS POLICIES FOR MATERIALS TABLE
-- Following: RLS-GUIDELINES.md
-- Permissions: materials.view, materials.manage (already exist)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. SELECT POLICY
-- ============================================================================
-- SPECIAL CASE: Materials can be:
--   a) System materials (is_system = true, organization_id = NULL) → Everyone can see
--   b) Organization materials → Members with materials.view can see
-- ============================================================================

DROP POLICY IF EXISTS "MIEMBROS VEN MATERIALS" ON public.materials;
DROP POLICY IF EXISTS "TODOS VEN MATERIALS SISTEMA" ON public.materials;

CREATE POLICY "MIEMBROS VEN MATERIALS"
ON public.materials
FOR SELECT
TO public
USING (
  -- System materials: everyone can see
  (organization_id IS NULL AND is_system = true)
  OR
  -- Organization materials: need materials.view permission
  can_view_org(organization_id, 'materials.view'::text)
);

-- ============================================================================
-- 2. INSERT POLICY
-- ============================================================================
-- Members with materials.manage can create org materials
-- Admins can create system materials (organization_id = NULL, is_system = true)
-- ============================================================================

DROP POLICY IF EXISTS "MIEMBROS CREAN MATERIALS" ON public.materials;

CREATE POLICY "MIEMBROS CREAN MATERIALS"
ON public.materials
FOR INSERT
TO public
WITH CHECK (
  -- Option A: Organization materials - need materials.manage permission
  (
    organization_id IS NOT NULL
    AND can_mutate_org(organization_id, 'materials.manage'::text)
  )
  OR
  -- Option B: System materials - only global admins
  (
    organization_id IS NULL 
    AND is_system = true 
    AND is_admin()
  )
);

-- ============================================================================
-- 3. UPDATE POLICY
-- ============================================================================
-- Only members with materials.manage can update organization materials
-- System materials can only be updated by admins
-- ============================================================================

DROP POLICY IF EXISTS "MIEMBROS EDITAN MATERIALS" ON public.materials;

CREATE POLICY "MIEMBROS EDITAN MATERIALS"
ON public.materials
FOR UPDATE
TO public
USING (
  -- Organization materials: need materials.manage
  (organization_id IS NOT NULL AND can_mutate_org(organization_id, 'materials.manage'::text))
  OR
  -- System materials: only global admins
  (is_system = true AND is_admin())
);

-- ============================================================================
-- DONE!
-- ============================================================================
-- Summary:
-- ✅ SELECT: System materials visible to all, org materials need materials.view
-- ✅ INSERT: Only org materials, requires materials.manage
-- ✅ UPDATE: Org materials need materials.manage, system materials need is_admin()
-- ✅ No DELETE policy (soft delete via is_deleted = true)
-- ============================================================================
