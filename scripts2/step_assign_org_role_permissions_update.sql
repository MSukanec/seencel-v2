-- =============================================
-- UPDATE step_assign_org_role_permissions - Add materials permissions
-- Date: 2026-01-22
-- =============================================

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
  -- Obtener roles de la organización
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
  -- ADMIN → todos los permisos system
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_admin_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id, organization_id)
  SELECT v_admin_role_id, p.id, p_org_id
  FROM public.permissions p
  WHERE p.is_system = true;

  ----------------------------------------------------------------
  -- EDITOR → Projects, Costs, Members, Roles (view), Contacts, Kanban, Clients, Sitelog, Media, Tasks, Quotes, Materials
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_editor_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id, organization_id)
  SELECT v_editor_role_id, p.id, p_org_id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'projects.manage',
    'general_costs.view',
    'general_costs.manage',
    'members.view',
    'roles.view',
    'contacts.view',
    'contacts.manage',
    'kanban.view',
    'kanban.manage',
    'clients.view',
    'clients.manage',
    'sitelog.view',
    'sitelog.manage',
    'media.view',
    'media.manage',
    'tasks.view',
    'tasks.manage',
    'quotes.view',
    'quotes.manage',
    'materials.view',   -- ✅ NUEVO
    'materials.manage'  -- ✅ NUEVO
  );

  ----------------------------------------------------------------
  -- LECTOR → View only versions
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_viewer_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id, organization_id)
  SELECT v_viewer_role_id, p.id, p_org_id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'general_costs.view',
    'members.view',
    'roles.view',
    'contacts.view',
    'kanban.view',
    'clients.view',
    'sitelog.view',
    'media.view',
    'tasks.view',
    'quotes.view',
    'materials.view'  -- ✅ NUEVO
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
