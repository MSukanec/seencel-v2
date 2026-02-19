-- ============================================================
-- 027_planner_permissions.sql
-- Consolida calendar.view/manage + kanban.view/manage
-- en planner.view / planner.manage
--
-- Scope: calendar.* + kanban.* → planner.*
-- Tablas afectadas (17 RLS en public schema):
--   calendar_event_attendees (3), calendar_event_reminders (2),
--   calendar_events (3), kanban_boards (3), kanban_cards (3),
--   kanban_lists (3)
-- ============================================================

BEGIN;

-- ============================================================
-- PASO 1: Insertar los nuevos permisos globales
-- ============================================================
INSERT INTO public.permissions (id, key, description, category, is_system)
VALUES
  (gen_random_uuid(), 'planner.view',   'Ver Calendario y Tablero Kanban',              'planner', true),
  (gen_random_uuid(), 'planner.manage', 'Crear y editar eventos de Calendario y Kanban', 'planner', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PASO 2: Heredar role_permissions existentes
-- Todos los roles que tenían calendar.* o kanban.* reciben planner.*
-- ============================================================

-- 2a. planner.view → roles con calendar.view o kanban.view
INSERT INTO public.role_permissions (id, role_id, permission_id, organization_id)
SELECT
  gen_random_uuid(),
  rp.role_id,
  (SELECT id FROM public.permissions WHERE key = 'planner.view'),
  rp.organization_id
FROM public.role_permissions rp
JOIN public.permissions p ON p.id = rp.permission_id
WHERE p.key IN ('calendar.view', 'kanban.view')
ON CONFLICT DO NOTHING;

-- 2b. planner.manage → roles con calendar.manage o kanban.manage
INSERT INTO public.role_permissions (id, role_id, permission_id, organization_id)
SELECT
  gen_random_uuid(),
  rp.role_id,
  (SELECT id FROM public.permissions WHERE key = 'planner.manage'),
  rp.organization_id
FROM public.role_permissions rp
JOIN public.permissions p ON p.id = rp.permission_id
WHERE p.key IN ('calendar.manage', 'kanban.manage')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PASO 3: Actualizar RLS — calendar_event_attendees
-- ============================================================

DROP POLICY IF EXISTS "MIEMBROS CREAN CALENDAR_EVENT_ATTENDEES" ON public.calendar_event_attendees;
CREATE POLICY "MIEMBROS CREAN CALENDAR_EVENT_ATTENDEES"
  ON public.calendar_event_attendees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = calendar_event_attendees.event_id
        AND can_mutate_org(e.organization_id, 'planner.manage')
    )
  );

DROP POLICY IF EXISTS "MIEMBROS EDITAN CALENDAR_EVENT_ATTENDEES" ON public.calendar_event_attendees;
CREATE POLICY "MIEMBROS EDITAN CALENDAR_EVENT_ATTENDEES"
  ON public.calendar_event_attendees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = calendar_event_attendees.event_id
        AND can_mutate_org(e.organization_id, 'planner.manage')
    )
  );

DROP POLICY IF EXISTS "MIEMBROS VEN CALENDAR_EVENT_ATTENDEES" ON public.calendar_event_attendees;
CREATE POLICY "MIEMBROS VEN CALENDAR_EVENT_ATTENDEES"
  ON public.calendar_event_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = calendar_event_attendees.event_id
        AND can_view_org(e.organization_id, 'planner.view')
    )
  );

-- ============================================================
-- PASO 4: Actualizar RLS — calendar_event_reminders
-- ============================================================

DROP POLICY IF EXISTS "MIEMBROS CREAN CALENDAR_EVENT_REMINDERS" ON public.calendar_event_reminders;
CREATE POLICY "MIEMBROS CREAN CALENDAR_EVENT_REMINDERS"
  ON public.calendar_event_reminders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = calendar_event_reminders.event_id
        AND can_mutate_org(e.organization_id, 'planner.manage')
    )
  );

DROP POLICY IF EXISTS "MIEMBROS VEN CALENDAR_EVENT_REMINDERS" ON public.calendar_event_reminders;
CREATE POLICY "MIEMBROS VEN CALENDAR_EVENT_REMINDERS"
  ON public.calendar_event_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events e
      WHERE e.id = calendar_event_reminders.event_id
        AND can_view_org(e.organization_id, 'planner.view')
    )
  );

-- ============================================================
-- PASO 5: Actualizar RLS — calendar_events
-- (ACTORES VEN EVENTOS DEL PROYECTO no usa permiso → no se toca)
-- ============================================================

DROP POLICY IF EXISTS "MIEMBROS CREAN CALENDAR_EVENTS" ON public.calendar_events;
CREATE POLICY "MIEMBROS CREAN CALENDAR_EVENTS"
  ON public.calendar_events FOR INSERT
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN CALENDAR_EVENTS" ON public.calendar_events;
CREATE POLICY "MIEMBROS EDITAN CALENDAR_EVENTS"
  ON public.calendar_events FOR UPDATE
  USING (can_mutate_org(organization_id, 'planner.manage'));

DROP POLICY IF EXISTS "MIEMBROS VEN CALENDAR_EVENTS" ON public.calendar_events;
CREATE POLICY "MIEMBROS VEN CALENDAR_EVENTS"
  ON public.calendar_events FOR SELECT
  USING (can_view_org(organization_id, 'planner.view'));

-- ============================================================
-- PASO 6: Actualizar RLS — kanban_boards
-- ============================================================

DROP POLICY IF EXISTS "MIEMBROS CREAN KANBAN_BOARDS" ON public.kanban_boards;
CREATE POLICY "MIEMBROS CREAN KANBAN_BOARDS"
  ON public.kanban_boards FOR INSERT
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN KANBAN_BOARDS" ON public.kanban_boards;
CREATE POLICY "MIEMBROS EDITAN KANBAN_BOARDS"
  ON public.kanban_boards FOR UPDATE
  USING (can_mutate_org(organization_id, 'planner.manage'));

DROP POLICY IF EXISTS "MIEMBROS VEN KANBAN_BOARDS" ON public.kanban_boards;
CREATE POLICY "MIEMBROS VEN KANBAN_BOARDS"
  ON public.kanban_boards FOR SELECT
  USING (can_view_org(organization_id, 'planner.view'));

-- ============================================================
-- PASO 7: Actualizar RLS — kanban_cards
-- ============================================================

DROP POLICY IF EXISTS "MIEMBROS CREAN KANBAN_CARDS" ON public.kanban_cards;
CREATE POLICY "MIEMBROS CREAN KANBAN_CARDS"
  ON public.kanban_cards FOR INSERT
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN KANBAN_CARDS" ON public.kanban_cards;
CREATE POLICY "MIEMBROS EDITAN KANBAN_CARDS"
  ON public.kanban_cards FOR UPDATE
  USING (can_mutate_org(organization_id, 'planner.manage'));

DROP POLICY IF EXISTS "MIEMBROS VEN KANBAN_CARDS" ON public.kanban_cards;
CREATE POLICY "MIEMBROS VEN KANBAN_CARDS"
  ON public.kanban_cards FOR SELECT
  USING (can_view_org(organization_id, 'planner.view') AND is_deleted = false);

-- ============================================================
-- PASO 8: Actualizar RLS — kanban_lists (FK a kanban_boards)
-- ============================================================

DROP POLICY IF EXISTS "MIEMBROS CREAN KANBAN_LISTS" ON public.kanban_lists;
CREATE POLICY "MIEMBROS CREAN KANBAN_LISTS"
  ON public.kanban_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kanban_boards b
      WHERE b.id = kanban_lists.board_id
        AND can_mutate_org(b.organization_id, 'planner.manage')
    )
  );

DROP POLICY IF EXISTS "MIEMBROS EDITAN KANBAN_LISTS" ON public.kanban_lists;
CREATE POLICY "MIEMBROS EDITAN KANBAN_LISTS"
  ON public.kanban_lists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM kanban_boards b
      WHERE b.id = kanban_lists.board_id
        AND can_mutate_org(b.organization_id, 'planner.manage')
    )
  );

DROP POLICY IF EXISTS "MIEMBROS VEN KANBAN_LISTS" ON public.kanban_lists;
CREATE POLICY "MIEMBROS VEN KANBAN_LISTS"
  ON public.kanban_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kanban_boards b
      WHERE b.id = kanban_lists.board_id
        AND can_view_org(b.organization_id, 'planner.view')
    )
  );

-- ============================================================
-- PASO 9: Eliminar role_permissions de permisos obsoletos
-- ============================================================
DELETE FROM public.role_permissions
WHERE permission_id IN (
  SELECT id FROM public.permissions
  WHERE key IN ('calendar.view', 'calendar.manage', 'kanban.view', 'kanban.manage')
);

-- ============================================================
-- PASO 10: Eliminar los permisos obsoletos
-- ============================================================
DELETE FROM public.permissions
WHERE key IN ('calendar.view', 'calendar.manage', 'kanban.view', 'kanban.manage');

-- ============================================================
-- PASO 11: Recrear step_assign_org_role_permissions
-- ============================================================
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
  DELETE FROM public.role_permissions WHERE role_id = v_admin_role_id;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_admin_role_id, p.id
  FROM public.permissions p
  WHERE p.is_system = true;

  ----------------------------------------------------------------
  -- EDITOR
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions WHERE role_id = v_editor_role_id;

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
    'planner.view',    -- reemplaza calendar.view + kanban.view
    'planner.manage',  -- reemplaza calendar.manage + kanban.manage
    'commercial.view',
    'commercial.manage',
    'sitelog.view',
    'sitelog.manage',
    'media.view',
    'media.manage',
    'tasks.view',
    'tasks.manage',
    'materials.view',
    'materials.manage',
    'subcontracts.view',
    'subcontracts.manage',
    'labor.view',
    'labor.manage'
  );

  ----------------------------------------------------------------
  -- LECTOR
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions WHERE role_id = v_viewer_role_id;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_viewer_role_id, p.id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'general_costs.view',
    'members.view',
    'roles.view',
    'contacts.view',
    'planner.view',    -- reemplaza calendar.view + kanban.view
    'commercial.view',
    'sitelog.view',
    'media.view',
    'tasks.view',
    'materials.view',
    'subcontracts.view',
    'labor.view'
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

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- 1. Confirmar que planner.view y planner.manage existen
SELECT key, description, category, is_system
FROM public.permissions
WHERE key LIKE 'planner%';

-- 2. Confirmar que los permisos viejos ya NO existen (debe devolver 0 filas)
SELECT key FROM public.permissions
WHERE key IN ('calendar.view', 'calendar.manage', 'kanban.view', 'kanban.manage');

-- 3. Ver cuántos roles tienen asignado planner.*
SELECT r.name AS role, p.key AS permission, count(*) AS orgs
FROM public.roles r
JOIN public.role_permissions rp ON rp.role_id = r.id
JOIN public.permissions p ON p.id = rp.permission_id
WHERE p.key LIKE 'planner%'
GROUP BY r.name, p.key
ORDER BY r.name, p.key;

COMMIT;
