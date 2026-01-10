-- SETUP RLS FOR ORGANIZATIONS TABLE
-- Includes legacy support for owners without membership records

BEGIN;

-- 1. Create Permissions if they don't exist
INSERT INTO public.permissions (key, description, category, is_system)
VALUES 
  ('organization.view', 'Ver detalles de la organización', 'organization', true),
  ('organization.manage', 'Gestionar configuración de la organización', 'organization', true)
ON CONFLICT (key) DO NOTHING;

-- 2. Assign Permissions to Roles (Migration for existing roles)
DO $$
DECLARE
  v_view_perm_id uuid;
  v_manage_perm_id uuid;
BEGIN
  SELECT id INTO v_view_perm_id FROM permissions WHERE key = 'organization.view';
  SELECT id INTO v_manage_perm_id FROM permissions WHERE key = 'organization.manage';

  -- ADMIN: View & Manage
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id
  FROM roles r WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_manage_perm_id
  FROM roles r WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- EDITOR: View (Assume Editors can view org details but not change settings? Or maybe manage?)
  -- Strict approach: Editors only VIEW metadata.
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id
  FROM roles r WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- LECTOR: View
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id
  FROM roles r WHERE r.name = 'Lector' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT DO NOTHING;

END $$;

-- 3. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies

-- DROP existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "MIEMBROS VEN ORGANIZATIONS" ON public.organizations;
DROP POLICY IF EXISTS "USUARIOS AUTENTICADOS CREAN ORGANIZATIONS" ON public.organizations;
DROP POLICY IF EXISTS "ADMINISTRADORES EDITAN ORGANIZATIONS" ON public.organizations;

-- POLICY: SELECT (View)
-- Allow if member has 'organization.view' OR is created_by (Legacy)
CREATE POLICY "MIEMBROS VEN ORGANIZATIONS"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  )
  OR
  (
    -- Legacy / Fallback ownership check
    created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
  )
);

-- POLICY: INSERT (Create)
-- Authenticated users can create organizations
CREATE POLICY "USUARIOS AUTENTICADOS CREAN ORGANIZATIONS"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- POLICY: UPDATE (Edit)
-- Allow if member has 'organization.manage' OR is created_by (Legacy Owner)
CREATE POLICY "ADMINISTRADORES EDITAN ORGANIZATIONS"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  (
    EXISTS (
        SELECT 1 FROM organization_members om
        JOIN role_permissions rp ON om.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE om.organization_id = organizations.id
        AND om.user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        AND p.key = 'organization.manage'
    )
  )
  OR
  (
    -- Legacy / Fallback ownership check
    created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
  )
);

COMMIT;
