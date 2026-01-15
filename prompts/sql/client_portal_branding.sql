-- ============================================
-- CLIENT PORTAL BRANDING TABLE
-- ============================================
-- Stores visual customization for the public client portal
-- Similar to organization identity settings but for each project's portal

CREATE TABLE client_portal_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Branding / Identity
    portal_name TEXT,                        -- Override project name in portal
    welcome_message TEXT DEFAULT 'Bienvenido a tu portal',
    
    -- Colors
    primary_color TEXT DEFAULT '#83cc16',    -- Accent color
    background_color TEXT DEFAULT '#09090b', -- Dark background
    
    -- Hero Section
    hero_image_url TEXT,                     -- Override project image
    show_hero BOOLEAN DEFAULT true,
    
    -- Footer
    show_footer BOOLEAN DEFAULT true,
    footer_text TEXT,                        -- Custom footer text
    show_powered_by BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(project_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE client_portal_branding ENABLE ROW LEVEL SECURITY;

-- Organization members can manage their portal branding
CREATE POLICY "org_members_manage_branding" ON client_portal_branding
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        )
    );

-- Public read for portal visitors (clients need to see the branding)
CREATE POLICY "public_read_branding" ON client_portal_branding
    FOR SELECT USING (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_portal_branding_project ON client_portal_branding(project_id);
CREATE INDEX idx_portal_branding_org ON client_portal_branding(organization_id);

-- ============================================
-- TRIGGER: Update timestamp
-- ============================================
CREATE TRIGGER update_portal_branding_timestamp
    BEFORE UPDATE ON client_portal_branding
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
