-- ============================================================================
-- project_settings — Configuraciones a nivel proyecto
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Días laborales: array de integers (0=dom, 1=lun, 2=mar ... 6=sáb)
    -- Default: lunes a viernes
    work_days integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
    
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT project_settings_project_id_unique UNIQUE (project_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_project_settings_project_id ON project_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_settings_organization_id ON project_settings(organization_id);

-- ============================================================================
-- Updated at trigger
-- ============================================================================

CREATE OR REPLACE TRIGGER set_project_settings_updated_at
    BEFORE UPDATE ON project_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: org members can view settings for their org's projects
CREATE POLICY "project_settings_select"
    ON project_settings FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = get_current_user_id()
        )
    );

-- INSERT: org members can create settings
CREATE POLICY "project_settings_insert"
    ON project_settings FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = get_current_user_id()
        )
    );

-- UPDATE: org members can update settings
CREATE POLICY "project_settings_update"
    ON project_settings FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = get_current_user_id()
        )
    );

-- DELETE: org members can delete settings
CREATE POLICY "project_settings_delete"
    ON project_settings FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = get_current_user_id()
        )
    );
