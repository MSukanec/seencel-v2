-- =========================================================
-- RLS POLICIES PARA MÓDULO: CLIENTS
-- =========================================================

-- 1. Permisos utilizados: 'clients.view' y 'clients.manage'
-- 2. Tablas cubiertas:
--    - project_clients
--    - client_commitments
--    - client_payments
--    - client_payment_schedule
--    - client_roles
--    - client_portal_settings

-- =========================================================
-- TABLA: project_clients
-- =========================================================
ALTER TABLE public.project_clients ENABLE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS "MIEMBROS VEN PROJECT_CLIENTS" ON public.project_clients;
CREATE POLICY "MIEMBROS VEN PROJECT_CLIENTS" ON public.project_clients
FOR SELECT TO public USING (can_view_org(organization_id, 'clients.view'::text));

-- INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN PROJECT_CLIENTS" ON public.project_clients;
CREATE POLICY "MIEMBROS CREAN PROJECT_CLIENTS" ON public.project_clients
FOR INSERT TO public WITH CHECK (can_mutate_org(organization_id, 'clients.manage'::text));

-- UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN PROJECT_CLIENTS" ON public.project_clients;
CREATE POLICY "MIEMBROS EDITAN PROJECT_CLIENTS" ON public.project_clients
FOR UPDATE TO public USING (can_mutate_org(organization_id, 'clients.manage'::text));


-- =========================================================
-- TABLA: client_commitments
-- =========================================================
ALTER TABLE public.client_commitments ENABLE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_COMMITMENTS" ON public.client_commitments;
CREATE POLICY "MIEMBROS VEN CLIENT_COMMITMENTS" ON public.client_commitments
FOR SELECT TO public USING (can_view_org(organization_id, 'clients.view'::text));

-- INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_COMMITMENTS" ON public.client_commitments;
CREATE POLICY "MIEMBROS CREAN CLIENT_COMMITMENTS" ON public.client_commitments
FOR INSERT TO public WITH CHECK (can_mutate_org(organization_id, 'clients.manage'::text));

-- UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_COMMITMENTS" ON public.client_commitments;
CREATE POLICY "MIEMBROS EDITAN CLIENT_COMMITMENTS" ON public.client_commitments
FOR UPDATE TO public USING (can_mutate_org(organization_id, 'clients.manage'::text));


-- =========================================================
-- TABLA: client_payments
-- =========================================================
ALTER TABLE public.client_payments ENABLE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_PAYMENTS" ON public.client_payments;
CREATE POLICY "MIEMBROS VEN CLIENT_PAYMENTS" ON public.client_payments
FOR SELECT TO public USING (can_view_org(organization_id, 'clients.view'::text));

-- INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_PAYMENTS" ON public.client_payments;
CREATE POLICY "MIEMBROS CREAN CLIENT_PAYMENTS" ON public.client_payments
FOR INSERT TO public WITH CHECK (can_mutate_org(organization_id, 'clients.manage'::text));

-- UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_PAYMENTS" ON public.client_payments;
CREATE POLICY "MIEMBROS EDITAN CLIENT_PAYMENTS" ON public.client_payments
FOR UPDATE TO public USING (can_mutate_org(organization_id, 'clients.manage'::text));


-- =========================================================
-- TABLA: client_payment_schedule
-- =========================================================
ALTER TABLE public.client_payment_schedule ENABLE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_PAYMENT_SCHEDULE" ON public.client_payment_schedule;
CREATE POLICY "MIEMBROS VEN CLIENT_PAYMENT_SCHEDULE" ON public.client_payment_schedule
FOR SELECT TO public USING (can_view_org(organization_id, 'clients.view'::text));

-- INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_PAYMENT_SCHEDULE" ON public.client_payment_schedule;
CREATE POLICY "MIEMBROS CREAN CLIENT_PAYMENT_SCHEDULE" ON public.client_payment_schedule
FOR INSERT TO public WITH CHECK (can_mutate_org(organization_id, 'clients.manage'::text));

-- UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_PAYMENT_SCHEDULE" ON public.client_payment_schedule;
CREATE POLICY "MIEMBROS EDITAN CLIENT_PAYMENT_SCHEDULE" ON public.client_payment_schedule
FOR UPDATE TO public USING (can_mutate_org(organization_id, 'clients.manage'::text));


-- =========================================================
-- TABLA: client_roles
-- =========================================================
ALTER TABLE public.client_roles ENABLE ROW LEVEL SECURITY;

-- SELECT (Incluye roles de sistema donde organization_id es NULL?)
-- Si organization_id es NULL (roles sistema), todos los miembros autenticados deberían verlo.
-- Pero can_view_org requiere un org_id.
-- Ajuste especial para roles de sistema:
--  - Si org_id NOT NULL -> aplica permiso 'clients.view'
--  - Si org_id IS NULL -> aplica TRUE (todos ven roles sistema)

DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_ROLES" ON public.client_roles;
CREATE POLICY "MIEMBROS VEN CLIENT_ROLES" ON public.client_roles
FOR SELECT TO public USING (
  (organization_id IS NULL) -- Roles de sistema visibles para todos
  OR 
  (can_view_org(organization_id, 'clients.view'::text)) -- Roles de org
);

-- INSERT (Solo orgs con permiso, roles sistema NO se crean desde aquí)
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_ROLES" ON public.client_roles;
CREATE POLICY "MIEMBROS CREAN CLIENT_ROLES" ON public.client_roles
FOR INSERT TO public WITH CHECK (
  organization_id IS NOT NULL AND can_mutate_org(organization_id, 'clients.manage'::text)
);

-- UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_ROLES" ON public.client_roles;
CREATE POLICY "MIEMBROS EDITAN CLIENT_ROLES" ON public.client_roles
FOR UPDATE TO public USING (
  organization_id IS NOT NULL AND can_mutate_org(organization_id, 'clients.manage'::text)
);


-- =========================================================
-- TABLA: client_portal_settings
-- =========================================================
ALTER TABLE public.client_portal_settings ENABLE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_PORTAL_SETTINGS" ON public.client_portal_settings;
CREATE POLICY "MIEMBROS VEN CLIENT_PORTAL_SETTINGS" ON public.client_portal_settings
FOR SELECT TO public USING (can_view_org(organization_id, 'clients.view'::text));

-- INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_PORTAL_SETTINGS" ON public.client_portal_settings;
CREATE POLICY "MIEMBROS CREAN CLIENT_PORTAL_SETTINGS" ON public.client_portal_settings
FOR INSERT TO public WITH CHECK (can_mutate_org(organization_id, 'clients.manage'::text));

-- UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_PORTAL_SETTINGS" ON public.client_portal_settings;
CREATE POLICY "MIEMBROS EDITAN CLIENT_PORTAL_SETTINGS" ON public.client_portal_settings
FOR UPDATE TO public USING (can_mutate_org(organization_id, 'clients.manage'::text));
