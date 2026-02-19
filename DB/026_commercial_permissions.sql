-- ============================================================
-- 026_commercial_permissions.sql
-- Consolida quotes.view/manage + clients.view/manage
-- en commercial.view / commercial.manage
--
-- Scope: quotes.* y clients.* → commercial.*
-- contacts.* se mantiene separado (por decidir)
-- ============================================================

BEGIN;

-- ============================================================
-- PASO 1: Insertar los nuevos permisos globales
-- ============================================================
INSERT INTO public.permissions (id, key, description, category, is_system)
VALUES
  (gen_random_uuid(), 'commercial.view',   'Ver presupuestos y clientes',           'commercial', true),
  (gen_random_uuid(), 'commercial.manage', 'Crear y editar presupuestos y clientes', 'commercial', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PASO 2: Asignar commercial.* a todos los roles que ya
--         tenían quotes.* o clients.* (herencia automática)
-- ============================================================

-- 2a. commercial.view → a todos los roles con quotes.view o clients.view
INSERT INTO public.role_permissions (id, role_id, permission_id, organization_id)
SELECT
  gen_random_uuid(),
  rp.role_id,
  (SELECT id FROM public.permissions WHERE key = 'commercial.view'),
  rp.organization_id
FROM public.role_permissions rp
JOIN public.permissions p ON p.id = rp.permission_id
WHERE p.key IN ('quotes.view', 'clients.view')
ON CONFLICT DO NOTHING;

-- 2b. commercial.manage → a todos los roles con quotes.manage o clients.manage
INSERT INTO public.role_permissions (id, role_id, permission_id, organization_id)
SELECT
  gen_random_uuid(),
  rp.role_id,
  (SELECT id FROM public.permissions WHERE key = 'commercial.manage'),
  rp.organization_id
FROM public.role_permissions rp
JOIN public.permissions p ON p.id = rp.permission_id
WHERE p.key IN ('quotes.manage', 'clients.manage')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PASO 3: Actualizar RLS — schema construction
-- ============================================================

-- quotes: SELECT (miembros)
DROP POLICY IF EXISTS "MIEMBROS VEN QUOTES" ON construction.quotes;
CREATE POLICY "MIEMBROS VEN QUOTES"
  ON construction.quotes FOR SELECT
  USING (can_view_org(organization_id, 'commercial.view'));

-- quotes: INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN QUOTES" ON construction.quotes;
CREATE POLICY "MIEMBROS CREAN QUOTES"
  ON construction.quotes FOR INSERT
  WITH CHECK (can_mutate_org(organization_id, 'commercial.manage'));

-- quotes: UPDATE
DROP POLICY IF EXISTS "MIEMBROS ACTUALIZAN QUOTES" ON construction.quotes;
CREATE POLICY "MIEMBROS ACTUALIZAN QUOTES"
  ON construction.quotes FOR UPDATE
  USING (can_mutate_org(organization_id, 'commercial.manage'));

-- quote_items: SELECT (miembros)
DROP POLICY IF EXISTS "MIEMBROS VEN QUOTE_ITEMS" ON construction.quote_items;
CREATE POLICY "MIEMBROS VEN QUOTE_ITEMS"
  ON construction.quote_items FOR SELECT
  USING (can_view_org(organization_id, 'commercial.view'));

-- quote_items: INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN QUOTE_ITEMS" ON construction.quote_items;
CREATE POLICY "MIEMBROS CREAN QUOTE_ITEMS"
  ON construction.quote_items FOR INSERT
  WITH CHECK (can_mutate_org(organization_id, 'commercial.manage'));

-- quote_items: UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN QUOTE_ITEMS" ON construction.quote_items;
CREATE POLICY "MIEMBROS EDITAN QUOTE_ITEMS"
  ON construction.quote_items FOR UPDATE
  USING (can_mutate_org(organization_id, 'commercial.manage'))
  WITH CHECK (can_mutate_org(organization_id, 'commercial.manage'));

-- ============================================================
-- PASO 4: Actualizar RLS — schema public (clients.*)
-- ============================================================

-- client_commitments
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_COMMITMENTS" ON public.client_commitments;
CREATE POLICY "MIEMBROS CREAN CLIENT_COMMITMENTS"
  ON public.client_commitments FOR INSERT
  WITH CHECK (can_mutate_org(organization_id, 'commercial.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_COMMITMENTS" ON public.client_commitments;
CREATE POLICY "MIEMBROS EDITAN CLIENT_COMMITMENTS"
  ON public.client_commitments FOR UPDATE
  USING (can_mutate_org(organization_id, 'commercial.manage'));

DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_COMMITMENTS" ON public.client_commitments;
CREATE POLICY "MIEMBROS VEN CLIENT_COMMITMENTS"
  ON public.client_commitments FOR SELECT
  USING (can_view_org(organization_id, 'commercial.view'));

-- client_payment_schedule
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_PAYMENT_SCHEDULE" ON public.client_payment_schedule;
CREATE POLICY "MIEMBROS CREAN CLIENT_PAYMENT_SCHEDULE"
  ON public.client_payment_schedule FOR INSERT
  WITH CHECK (can_mutate_org(organization_id, 'commercial.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_PAYMENT_SCHEDULE" ON public.client_payment_schedule;
CREATE POLICY "MIEMBROS EDITAN CLIENT_PAYMENT_SCHEDULE"
  ON public.client_payment_schedule FOR UPDATE
  USING (can_mutate_org(organization_id, 'commercial.manage'));

DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_PAYMENT_SCHEDULE" ON public.client_payment_schedule;
CREATE POLICY "MIEMBROS VEN CLIENT_PAYMENT_SCHEDULE"
  ON public.client_payment_schedule FOR SELECT
  USING (can_view_org(organization_id, 'commercial.view'));

-- client_payments
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_PAYMENTS" ON public.client_payments;
CREATE POLICY "MIEMBROS CREAN CLIENT_PAYMENTS"
  ON public.client_payments FOR INSERT
  WITH CHECK (can_mutate_org(organization_id, 'commercial.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_PAYMENTS" ON public.client_payments;
CREATE POLICY "MIEMBROS EDITAN CLIENT_PAYMENTS"
  ON public.client_payments FOR UPDATE
  USING (can_mutate_org(organization_id, 'commercial.manage'));

DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_PAYMENTS" ON public.client_payments;
CREATE POLICY "MIEMBROS VEN CLIENT_PAYMENTS"
  ON public.client_payments FOR SELECT
  USING (can_view_org(organization_id, 'commercial.view'));

-- client_portal_settings
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_PORTAL_SETTINGS" ON public.client_portal_settings;
CREATE POLICY "MIEMBROS CREAN CLIENT_PORTAL_SETTINGS"
  ON public.client_portal_settings FOR INSERT
  WITH CHECK (can_mutate_org(organization_id, 'commercial.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_PORTAL_SETTINGS" ON public.client_portal_settings;
CREATE POLICY "MIEMBROS EDITAN CLIENT_PORTAL_SETTINGS"
  ON public.client_portal_settings FOR UPDATE
  USING (can_mutate_org(organization_id, 'commercial.manage'));

DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_PORTAL_SETTINGS" ON public.client_portal_settings;
CREATE POLICY "MIEMBROS VEN CLIENT_PORTAL_SETTINGS"
  ON public.client_portal_settings FOR SELECT
  USING (can_view_org(organization_id, 'commercial.view'));

-- client_roles
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_ROLES" ON public.client_roles;
CREATE POLICY "MIEMBROS CREAN CLIENT_ROLES"
  ON public.client_roles FOR INSERT
  WITH CHECK ((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'commercial.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_ROLES" ON public.client_roles;
CREATE POLICY "MIEMBROS EDITAN CLIENT_ROLES"
  ON public.client_roles FOR UPDATE
  USING ((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'commercial.manage'));

DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_ROLES" ON public.client_roles;
CREATE POLICY "MIEMBROS VEN CLIENT_ROLES"
  ON public.client_roles FOR SELECT
  USING ((organization_id IS NULL) OR can_view_org(organization_id, 'commercial.view'));

-- ============================================================
-- PASO 5: Eliminar role_permissions de permisos obsoletos
-- ============================================================
DELETE FROM public.role_permissions
WHERE permission_id IN (
  SELECT id FROM public.permissions
  WHERE key IN ('quotes.view', 'quotes.manage', 'clients.view', 'clients.manage')
);

-- ============================================================
-- PASO 6: Eliminar los permisos obsoletos
-- ============================================================
DELETE FROM public.permissions
WHERE key IN ('quotes.view', 'quotes.manage', 'clients.view', 'clients.manage');

-- ============================================================
-- PASO 7: Actualizar step_assign_org_role_permissions
-- (recrear la función con los nuevos keys)
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
    'kanban.view',
    'kanban.manage',
    'commercial.view',    -- reemplaza clients.view + quotes.view
    'commercial.manage',  -- reemplaza clients.manage + quotes.manage
    'sitelog.view',
    'sitelog.manage',
    'media.view',
    'media.manage',
    'tasks.view',
    'tasks.manage',
    'materials.view',
    'materials.manage',
    'calendar.view',
    'calendar.manage',
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
    'kanban.view',
    'commercial.view',    -- reemplaza clients.view + quotes.view
    'sitelog.view',
    'media.view',
    'tasks.view',
    'materials.view',
    'calendar.view',
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

-- 1. Confirmar que commercial.view y commercial.manage existen
SELECT key, description, category, is_system
FROM public.permissions
WHERE key LIKE 'commercial%';

-- 2. Confirmar que los permisos viejos ya NO existen
SELECT key FROM public.permissions
WHERE key IN ('quotes.view', 'quotes.manage', 'clients.view', 'clients.manage');
-- Debe devolver 0 filas

-- 3. Ver cuántos roles tienen asignado commercial.*
SELECT r.name AS role, p.key AS permission, count(*) AS orgs
FROM public.roles r
JOIN public.role_permissions rp ON rp.role_id = r.id
JOIN public.permissions p ON p.id = rp.permission_id
WHERE p.key LIKE 'commercial%'
GROUP BY r.name, p.key
ORDER BY r.name, p.key;

COMMIT;
