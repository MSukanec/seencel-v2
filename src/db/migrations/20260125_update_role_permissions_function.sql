-- ============================================
-- Migration: Update step_assign_org_role_permissions
-- Description: Include subcontracts permissions in default role assignments
-- ============================================

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
  
  -- Note: Fixed column list to match schema if organization_id is required in role_permissions based on previous user input context, 
  -- or standard loop if table structure varies. Assuming standard role_permissions(role_id, permission_id) based on previous interactions, 
  -- BUT user provided SQL shows INSERT INTO ... (role_id, permission_id, organization_id).
  -- I will follow the User's provided structure for the INSERTs.
  
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_admin_role_id, p.id
  FROM public.permissions p
  WHERE p.is_system = true;

  ----------------------------------------------------------------
  -- EDITOR
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
    'materials.view',
    'materials.manage',
    'calendar.view',
    'calendar.manage',
    'subcontracts.view',   -- ADDED
    'subcontracts.manage'  -- ADDED
  );

  ----------------------------------------------------------------
  -- LECTOR
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
    'sitelog.view',
    'media.view',
    'tasks.view',
    'quotes.view',
    'materials.view',
    'calendar.view',
    'subcontracts.view'    -- ADDED
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
