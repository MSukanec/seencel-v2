-- ============================================================
-- 115: Add RLS to projects tables missing policies
-- Tables: client_portal_branding, project_settings
-- Convention: WHO ACTION TABLE (uppercase English)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. client_portal_branding (branding config for client portal)
--    Same domain as client_portal_settings → commercial.manage/view
--    Has: organization_id, project_id
-- ============================================================

ALTER TABLE projects.client_portal_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MEMBERS INSERT CLIENT_PORTAL_BRANDING"
    ON projects.client_portal_branding FOR INSERT
    WITH CHECK (iam.can_mutate_org(organization_id, 'commercial.manage'::text));

CREATE POLICY "MEMBERS UPDATE CLIENT_PORTAL_BRANDING"
    ON projects.client_portal_branding FOR UPDATE
    USING (iam.can_mutate_org(organization_id, 'commercial.manage'::text));

CREATE POLICY "MEMBERS SELECT CLIENT_PORTAL_BRANDING"
    ON projects.client_portal_branding FOR SELECT
    USING (iam.can_view_org(organization_id, 'commercial.view'::text));

-- External actors need to see branding when viewing the portal
CREATE POLICY "ACTORS SELECT CLIENT_PORTAL_BRANDING"
    ON projects.client_portal_branding FOR SELECT
    USING (iam.can_view_project(project_id));

-- ============================================================
-- 2. project_settings (per-project config: work_days, colors)
--    Same domain as project_data → projects.manage/view
--    Has: organization_id, project_id
-- ============================================================

ALTER TABLE projects.project_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MEMBERS INSERT PROJECT_SETTINGS"
    ON projects.project_settings FOR INSERT
    WITH CHECK (iam.can_mutate_org(organization_id, 'projects.manage'::text));

CREATE POLICY "MEMBERS UPDATE PROJECT_SETTINGS"
    ON projects.project_settings FOR UPDATE
    USING (iam.can_mutate_org(organization_id, 'projects.manage'::text));

CREATE POLICY "MEMBERS SELECT PROJECT_SETTINGS"
    ON projects.project_settings FOR SELECT
    USING (iam.can_view_org(organization_id, 'projects.view'::text));

COMMIT;
