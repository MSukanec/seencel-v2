-- ============================================================================
-- DASHBOARD LAYOUTS TABLE
-- ============================================================================
-- Stores widget grid configuration per user per organization.
-- Each user can have their own dashboard layout for each org they belong to.
-- If no layout exists, the app uses a hardcoded default.
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    layout_key TEXT NOT NULL DEFAULT 'org_dashboard',
    layout_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_dashboard_layout UNIQUE (user_id, organization_id, layout_key)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_org
    ON dashboard_layouts (user_id, organization_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only read their own layouts
CREATE POLICY "dashboard_layouts_select"
    ON dashboard_layouts FOR SELECT
    USING (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    );

-- INSERT: Users can only insert their own layouts
CREATE POLICY "dashboard_layouts_insert"
    ON dashboard_layouts FOR INSERT
    WITH CHECK (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    );

-- UPDATE: Users can only update their own layouts
CREATE POLICY "dashboard_layouts_update"
    ON dashboard_layouts FOR UPDATE
    USING (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    );

-- DELETE: Users can only delete their own layouts
CREATE POLICY "dashboard_layouts_delete"
    ON dashboard_layouts FOR DELETE
    USING (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    );
