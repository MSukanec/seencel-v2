-- ==============================================================================
-- RLS CONFIGURATION FOR SITELOG FEATURE
-- ==============================================================================

-- 1. INSERT PERMISSIONS
-- ------------------------------------------------------------------------------
INSERT INTO public.permissions (key, description, category, is_system)
VALUES 
  ('sitelog.view', 'Ver bitácora de obra', 'sitelog', true),
  ('sitelog.manage', 'Gestionar bitácora de obra', 'sitelog', true)
ON CONFLICT (key) DO NOTHING;


-- 2. UPDATE ASSIGNMENT FUNCTION (Adding sitelog keys)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.step_assign_org_role_permissions(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_admin_role_id  uuid;
  v_editor_role_id uuid;
  v_viewer_role_id uuid;
BEGIN
  ----------------------------------------------------------------
  -- Obtener roles
  ----------------------------------------------------------------
  SELECT id INTO v_admin_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Administrador'
    AND is_system = false;
  SELECT id INTO v_editor_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Editor'
    AND is_system = false;
  SELECT id INTO v_viewer_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Lector'
    AND is_system = false;

  ----------------------------------------------------------------
  -- ADMIN → todos los permisos system (YA INCLUYE KANBAN y CLIENTS porque is_system=true)
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_admin_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_admin_role_id, p.id
  FROM public.permissions p
  WHERE p.is_system = true;

  ----------------------------------------------------------------
  -- EDITOR → permisos declarados (Incluye KANBAN y CLIENTS)
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_editor_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_editor_role_id, p.id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'projects.manage',
    'general_costs.view',
    'general_costs.manage',
    'members.view',
    'contacts.view',
    'contacts.manage',
    'kanban.view',
    'kanban.manage',
    'clients.view',
    'clients.manage',
    'sitelog.view',   -- NUEVO SITELOG
    'sitelog.manage'  -- NUEVO SITELOG
  );

  ----------------------------------------------------------------
  -- LECTOR → permisos declarados (Incluye KANBAN y CLIENTS)
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_viewer_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_viewer_role_id, p.id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'general_costs.view',
    'members.view',
    'roles.view',
    'contacts.view',
    'kanban.view',
    'clients.view',
    'sitelog.view'    -- NUEVO SITELOG
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'function',
      'step_assign_org_role_permissions',
      'permissions',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;
$function$;


-- 3. MIGRATION FOR EXISTING ORGS
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_view_perm_id uuid;
  v_manage_perm_id uuid;
BEGIN
  SELECT id INTO v_view_perm_id FROM permissions WHERE key = 'sitelog.view';
  SELECT id INTO v_manage_perm_id FROM permissions WHERE key = 'sitelog.manage';

  -- ADMIN (Add to all existing Admins)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id FROM roles r WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL ON CONFLICT DO NOTHING;
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_manage_perm_id FROM roles r WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL ON CONFLICT DO NOTHING;

  -- EDITOR (View + Manage)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id FROM roles r WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL ON CONFLICT DO NOTHING;
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_manage_perm_id FROM roles r WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL ON CONFLICT DO NOTHING;

  -- LECTOR (View Only)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id FROM roles r WHERE r.name = 'Lector' AND r.is_system = false AND r.organization_id IS NOT NULL ON CONFLICT DO NOTHING;
END $$;


-- 4. POLICIES: site_log_types (HYBRID: Global + Tenant)
-- ------------------------------------------------------------------------------
ALTER TABLE public.site_log_types ENABLE ROW LEVEL SECURITY;

-- SELECT: MIEMBROS VEN SITE_LOG_TYPES
DROP POLICY IF EXISTS "VER TIPOS DE BITACORA" ON public.site_log_types;
DROP POLICY IF EXISTS "MIEMBROS VEN SITE_LOG_TYPES" ON public.site_log_types;

CREATE POLICY "MIEMBROS VEN SITE_LOG_TYPES" ON public.site_log_types FOR SELECT TO public USING (
  (organization_id IS NULL) -- Global types visible to everyone
  OR 
  (can_view_org(organization_id, 'sitelog.view'::text)) -- Custom types visible to members
);

-- INSERT: MIEMBROS CREAN SITE_LOG_TYPES
DROP POLICY IF EXISTS "GESTIONAR TIPOS PERSONALIZADOS" ON public.site_log_types;
DROP POLICY IF EXISTS "ADMINS GESTIONAN TIPOS GLOBALES" ON public.site_log_types;
DROP POLICY IF EXISTS "MIEMBROS CREAN SITE_LOG_TYPES" ON public.site_log_types;

CREATE POLICY "MIEMBROS CREAN SITE_LOG_TYPES" ON public.site_log_types FOR INSERT TO public WITH CHECK (
  (organization_id IS NULL AND is_admin()) -- Admins create global
  OR
  (organization_id IS NOT NULL AND can_mutate_org(organization_id, 'sitelog.manage'::text)) -- Members create custom
);

-- UPDATE: MIEMBROS EDITAN SITE_LOG_TYPES
DROP POLICY IF EXISTS "MIEMBROS EDITAN SITE_LOG_TYPES" ON public.site_log_types;

CREATE POLICY "MIEMBROS EDITAN SITE_LOG_TYPES" ON public.site_log_types FOR UPDATE TO public USING (
  (organization_id IS NULL AND is_admin()) -- Admins edit global
  OR
  (organization_id IS NOT NULL AND can_mutate_org(organization_id, 'sitelog.manage'::text)) -- Members edit custom
);


-- 5. POLICIES: site_logs (STANDARD TENANT)
-- ------------------------------------------------------------------------------
ALTER TABLE public.site_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: MIEMBROS VEN SITE_LOGS
DROP POLICY IF EXISTS "MIEMBROS VEN BITACORA" ON public.site_logs;
DROP POLICY IF EXISTS "MIEMBROS VEN SITE_LOGS" ON public.site_logs;

CREATE POLICY "MIEMBROS VEN SITE_LOGS" ON public.site_logs FOR SELECT TO public USING (
  can_view_org(organization_id, 'sitelog.view'::text)
);

-- INSERT: MIEMBROS CREAN SITE_LOGS
DROP POLICY IF EXISTS "MIEMBROS CREAN BITACORA" ON public.site_logs;
DROP POLICY IF EXISTS "MIEMBROS CREAN SITE_LOGS" ON public.site_logs;

CREATE POLICY "MIEMBROS CREAN SITE_LOGS" ON public.site_logs FOR INSERT TO public WITH CHECK (
  can_mutate_org(organization_id, 'sitelog.manage'::text)
);

-- UPDATE: MIEMBROS EDITAN SITE_LOGS
DROP POLICY IF EXISTS "MIEMBROS EDITAN BITACORA" ON public.site_logs;
DROP POLICY IF EXISTS "MIEMBROS EDITAN SITE_LOGS" ON public.site_logs;

CREATE POLICY "MIEMBROS EDITAN SITE_LOGS" ON public.site_logs FOR UPDATE TO public USING (
  can_mutate_org(organization_id, 'sitelog.manage'::text)
);
