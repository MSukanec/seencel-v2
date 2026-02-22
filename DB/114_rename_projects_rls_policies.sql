-- ============================================================
-- 114: Rename projects schema RLS policies to English convention
-- Convention: WHO ACTION TABLE (uppercase English)
-- Also qualifies helper functions with iam. prefix
-- ============================================================

BEGIN;

-- ============================================================
-- 1. client_portal_settings (3 policies)
-- ============================================================

-- 1a. INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_PORTAL_SETTINGS" ON projects.client_portal_settings;
CREATE POLICY "MEMBERS INSERT CLIENT_PORTAL_SETTINGS"
    ON projects.client_portal_settings FOR INSERT
    WITH CHECK (iam.can_mutate_org(organization_id, 'commercial.manage'::text));

-- 1b. UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_PORTAL_SETTINGS" ON projects.client_portal_settings;
CREATE POLICY "MEMBERS UPDATE CLIENT_PORTAL_SETTINGS"
    ON projects.client_portal_settings FOR UPDATE
    USING (iam.can_mutate_org(organization_id, 'commercial.manage'::text));

-- 1c. SELECT
DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_PORTAL_SETTINGS" ON projects.client_portal_settings;
CREATE POLICY "MEMBERS SELECT CLIENT_PORTAL_SETTINGS"
    ON projects.client_portal_settings FOR SELECT
    USING (iam.can_view_org(organization_id, 'commercial.view'::text));

-- ============================================================
-- 2. client_roles (3 policies)
-- ============================================================

-- 2a. INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN CLIENT_ROLES" ON projects.client_roles;
CREATE POLICY "MEMBERS INSERT CLIENT_ROLES"
    ON projects.client_roles FOR INSERT
    WITH CHECK ((organization_id IS NOT NULL) AND iam.can_mutate_org(organization_id, 'commercial.manage'::text));

-- 2b. UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN CLIENT_ROLES" ON projects.client_roles;
CREATE POLICY "MEMBERS UPDATE CLIENT_ROLES"
    ON projects.client_roles FOR UPDATE
    USING ((organization_id IS NOT NULL) AND iam.can_mutate_org(organization_id, 'commercial.manage'::text));

-- 2c. SELECT
DROP POLICY IF EXISTS "MIEMBROS VEN CLIENT_ROLES" ON projects.client_roles;
CREATE POLICY "MEMBERS SELECT CLIENT_ROLES"
    ON projects.client_roles FOR SELECT
    USING ((organization_id IS NULL) OR iam.can_view_org(organization_id, 'commercial.view'::text));

-- ============================================================
-- 3. project_clients (4 policies)
-- ============================================================

-- 3a. SELECT (external actors)
DROP POLICY IF EXISTS "ACTORES VEN CLIENTES DEL PROYECTO" ON projects.project_clients;
CREATE POLICY "ACTORS SELECT PROJECT_CLIENTS"
    ON projects.project_clients FOR SELECT
    USING (iam.can_view_project(project_id));

-- 3b. INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN PROJECT_CLIENTS" ON projects.project_clients;
CREATE POLICY "MEMBERS INSERT PROJECT_CLIENTS"
    ON projects.project_clients FOR INSERT
    WITH CHECK (iam.can_mutate_org(organization_id, 'commercial.manage'::text));

-- 3c. UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN PROJECT_CLIENTS" ON projects.project_clients;
CREATE POLICY "MEMBERS UPDATE PROJECT_CLIENTS"
    ON projects.project_clients FOR UPDATE
    USING (iam.can_mutate_org(organization_id, 'commercial.manage'::text));

-- 3d. SELECT (members)
DROP POLICY IF EXISTS "MIEMBROS VEN PROJECT_CLIENTS" ON projects.project_clients;
CREATE POLICY "MEMBERS SELECT PROJECT_CLIENTS"
    ON projects.project_clients FOR SELECT
    USING (iam.can_view_org(organization_id, 'commercial.view'::text));

-- ============================================================
-- 4. project_data (4 policies)
-- ============================================================

-- 4a. SELECT (external actors)
DROP POLICY IF EXISTS "ACTORES VEN DATOS DEL PROYECTO" ON projects.project_data;
CREATE POLICY "ACTORS SELECT PROJECT_DATA"
    ON projects.project_data FOR SELECT
    USING (iam.can_view_project(project_id));

-- 4b. UPDATE
DROP POLICY IF EXISTS "MIEMBROS ACTUALIZAN PROJECT_DATA" ON projects.project_data;
CREATE POLICY "MEMBERS UPDATE PROJECT_DATA"
    ON projects.project_data FOR UPDATE
    USING (iam.can_mutate_org(organization_id, 'projects.manage'::text))
    WITH CHECK (iam.can_mutate_org(organization_id, 'projects.manage'::text));

-- 4c. INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN PROJECT_DATA" ON projects.project_data;
CREATE POLICY "MEMBERS INSERT PROJECT_DATA"
    ON projects.project_data FOR INSERT
    WITH CHECK (iam.can_mutate_org(organization_id, 'projects.manage'::text));

-- 4d. SELECT (members)
DROP POLICY IF EXISTS "MIEMBROS VEN PROJECT_DATA" ON projects.project_data;
CREATE POLICY "MEMBERS SELECT PROJECT_DATA"
    ON projects.project_data FOR SELECT
    USING (iam.can_view_org(organization_id, 'projects.view'::text) OR (is_public = true));

-- ============================================================
-- 5. project_labor (3 policies)
-- ============================================================

-- 5a. INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN PROJECT_LABOR" ON projects.project_labor;
CREATE POLICY "MEMBERS INSERT PROJECT_LABOR"
    ON projects.project_labor FOR INSERT
    WITH CHECK (iam.can_mutate_org(organization_id, 'construction.manage'::text));

-- 5b. UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN PROJECT_LABOR" ON projects.project_labor;
CREATE POLICY "MEMBERS UPDATE PROJECT_LABOR"
    ON projects.project_labor FOR UPDATE
    USING (iam.can_mutate_org(organization_id, 'construction.manage'::text));

-- 5c. SELECT
DROP POLICY IF EXISTS "MIEMBROS VEN PROJECT_LABOR" ON projects.project_labor;
CREATE POLICY "MEMBERS SELECT PROJECT_LABOR"
    ON projects.project_labor FOR SELECT
    USING (iam.can_view_org(organization_id, 'construction.view'::text));

-- ============================================================
-- 6. project_modalities (3 policies)
-- ============================================================

-- 6a. UPDATE
DROP POLICY IF EXISTS "MIEMBROS ACTUALIZAN PROJECT_MODALITIES" ON projects.project_modalities;
CREATE POLICY "MEMBERS UPDATE PROJECT_MODALITIES"
    ON projects.project_modalities FOR UPDATE
    USING (iam.can_mutate_org(organization_id, 'projects.manage'::text))
    WITH CHECK (iam.can_mutate_org(organization_id, 'projects.manage'::text));

-- 6b. INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN PROJECT_MODALITIES" ON projects.project_modalities;
CREATE POLICY "MEMBERS INSERT PROJECT_MODALITIES"
    ON projects.project_modalities FOR INSERT
    WITH CHECK (iam.can_mutate_org(organization_id, 'projects.manage'::text));

-- 6c. SELECT
DROP POLICY IF EXISTS "MIEMBROS VEN PROJECT_MODALITIES" ON projects.project_modalities;
CREATE POLICY "MEMBERS SELECT PROJECT_MODALITIES"
    ON projects.project_modalities FOR SELECT
    USING (iam.is_admin() OR ((is_deleted = false) AND ((organization_id IS NULL) OR iam.can_view_org(organization_id, 'projects.view'::text))));

-- ============================================================
-- 7. project_types (3 policies)
-- ============================================================

-- 7a. UPDATE
DROP POLICY IF EXISTS "MIEMBROS ACTUALIZAN PROJECT_TYPES" ON projects.project_types;
CREATE POLICY "MEMBERS UPDATE PROJECT_TYPES"
    ON projects.project_types FOR UPDATE
    USING (iam.can_mutate_org(organization_id, 'projects.manage'::text))
    WITH CHECK (iam.can_mutate_org(organization_id, 'projects.manage'::text));

-- 7b. INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN PROJECT_TYPES" ON projects.project_types;
CREATE POLICY "MEMBERS INSERT PROJECT_TYPES"
    ON projects.project_types FOR INSERT
    WITH CHECK (iam.can_mutate_org(organization_id, 'projects.manage'::text));

-- 7c. SELECT
DROP POLICY IF EXISTS "MIEMBROS VEN PROJECT_TYPES" ON projects.project_types;
CREATE POLICY "MEMBERS SELECT PROJECT_TYPES"
    ON projects.project_types FOR SELECT
    USING (iam.is_admin() OR ((is_deleted = false) AND ((organization_id IS NULL) OR iam.can_view_org(organization_id, 'projects.view'::text))));

-- ============================================================
-- 8. projects (4 policies)
-- ============================================================

-- 8a. SELECT (external actors)
DROP POLICY IF EXISTS "ACTORES VEN PROYECTOS CON ACCESO" ON projects.projects;
CREATE POLICY "ACTORS SELECT PROJECTS"
    ON projects.projects FOR SELECT
    USING (iam.can_view_project(id));

-- 8b. INSERT
DROP POLICY IF EXISTS "MIEMBROS CREAN PROJECTS" ON projects.projects;
CREATE POLICY "MEMBERS INSERT PROJECTS"
    ON projects.projects FOR INSERT
    WITH CHECK (iam.can_mutate_org(organization_id, 'projects.manage'::text));

-- 8c. UPDATE
DROP POLICY IF EXISTS "MIEMBROS EDITAN PROJECTS" ON projects.projects;
CREATE POLICY "MEMBERS UPDATE PROJECTS"
    ON projects.projects FOR UPDATE
    USING (iam.can_mutate_org(organization_id, 'projects.manage'::text));

-- 8d. SELECT (members)
DROP POLICY IF EXISTS "MIEMBROS VEN PROJECTS" ON projects.projects;
CREATE POLICY "MEMBERS SELECT PROJECTS"
    ON projects.projects FOR SELECT
    USING (iam.can_view_org(organization_id, 'projects.view'::text) OR (EXISTS ( SELECT 1
       FROM projects.project_data pd
      WHERE ((pd.project_id = projects.id) AND (pd.is_public = true)))));

COMMIT;
