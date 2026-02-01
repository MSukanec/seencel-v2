-- ============================================================================
-- CREAR BOARD KANBAN POR DEFECTO EN SIGNUP
-- ============================================================================
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- 1. Crear la función step
CREATE OR REPLACE FUNCTION public.step_create_default_kanban_board(
  p_org_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_board_id uuid := gen_random_uuid();
BEGIN
  -- Crear board por defecto
  INSERT INTO public.kanban_boards (
    id,
    organization_id,
    project_id,
    name,
    description,
    color,
    position,
    is_archived,
    created_at,
    updated_at
  )
  VALUES (
    v_board_id,
    p_org_id,
    NULL,                           -- A nivel organización, no proyecto
    'Mi Panel',                     -- Nombre por defecto
    'Panel de tareas principal',    -- Descripción
    '#6366f1',                      -- Color indigo
    0,                              -- Primera posición
    false,
    now(),
    now()
  );

  RETURN v_board_id;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_default_kanban_board',
      'signup',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;
$$;

-- 2. Otorgar permisos
GRANT EXECUTE ON FUNCTION public.step_create_default_kanban_board(uuid) TO service_role;

-- ============================================================================
-- MODIFICAR handle_new_user PARA LLAMAR AL NUEVO STEP
-- ============================================================================
-- Agregar esta línea DESPUÉS del step 10 (organization_preferences) y ANTES del step 11 (user_preferences):
--
--   ----------------------------------------------------------------
--   -- 10.1) 📋 Kanban board por defecto
--   ----------------------------------------------------------------
--   PERFORM public.step_create_default_kanban_board(v_org_id);
--
-- ============================================================================

-- NOTA: Debes editar manualmente handle_new_user en Supabase y agregar la línea:
-- PERFORM public.step_create_default_kanban_board(v_org_id);
-- 
-- Ubicación: después de step_create_organization_preferences, antes de step_create_user_preferences
