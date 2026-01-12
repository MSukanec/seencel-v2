-- =========================================================
-- 1. CREAR NUEVOS PERMISOS (clients.view y clients.manage)
-- =========================================================

INSERT INTO public.permissions (key, description, category, is_system)
VALUES 
  ('clients.view', 'Ver clientes', 'clients', true),
  ('clients.manage', 'Gestionar clientes', 'clients', true)
ON CONFLICT (key) DO NOTHING;


-- =========================================================
-- 2. MIGRACIÓN: POBLAR ORGANIZACIONES EXISTENTES
-- =========================================================
DO $$
DECLARE
  v_view_perm_id uuid;
  v_manage_perm_id uuid;
BEGIN
  -- Obtener IDs de los permisos recién creados
  SELECT id INTO v_view_perm_id FROM permissions WHERE key = 'clients.view';
  SELECT id INTO v_manage_perm_id FROM permissions WHERE key = 'clients.manage';

  -- Validar que existan (por seguridad)
  IF v_view_perm_id IS NULL OR v_manage_perm_id IS NULL THEN
    RAISE EXCEPTION 'No se encontraron los permisos de clients. Revise el INSERT anterior.';
  END IF;

  -- -------------------------------------------------------
  -- A. ROLES: ADMINISTRADOR (View + Manage)
  -- -------------------------------------------------------
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id
  FROM roles r
  WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_manage_perm_id
  FROM roles r
  WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- -------------------------------------------------------
  -- B. ROLES: EDITOR (View + Manage)
  -- -------------------------------------------------------
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id
  FROM roles r
  WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_manage_perm_id
  FROM roles r
  WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- -------------------------------------------------------
  -- C. ROLES: LECTOR (Solo View)
  -- -------------------------------------------------------
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id
  FROM roles r
  WHERE r.name = 'Lector' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  RAISE NOTICE 'Migración completada: Permisos de CLIENTS asignados a roles existentes.';
END $$;
