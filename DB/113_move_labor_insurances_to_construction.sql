-- ============================================================================
-- 113_move_labor_insurances_to_construction.sql
-- Move labor_insurances table and labor_insurance_view from projects → construction
-- ============================================================================
BEGIN;

-- ============================================================================
-- PART 1: Drop dependent views
-- ============================================================================
DROP VIEW IF EXISTS projects.labor_insurance_view CASCADE;

-- ============================================================================
-- PART 2: Drop RLS policies on projects.labor_insurances
-- ============================================================================
DROP POLICY IF EXISTS "MIEMBROS VEN LABOR_INSURANCES" ON projects.labor_insurances;
DROP POLICY IF EXISTS "MIEMBROS CREAN LABOR_INSURANCES" ON projects.labor_insurances;
DROP POLICY IF EXISTS "MIEMBROS EDITAN LABOR_INSURANCES" ON projects.labor_insurances;

-- ============================================================================
-- PART 3: Move table to construction schema
-- ============================================================================
ALTER TABLE projects.labor_insurances SET SCHEMA construction;

-- ============================================================================
-- PART 4: Re-enable RLS and recreate policies in construction
-- ============================================================================
ALTER TABLE construction.labor_insurances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MIEMBROS VEN LABOR_INSURANCES" ON construction.labor_insurances
    FOR SELECT
    USING (can_view_org(organization_id, 'construction.view'::text));

CREATE POLICY "MIEMBROS CREAN LABOR_INSURANCES" ON construction.labor_insurances
    FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS EDITAN LABOR_INSURANCES" ON construction.labor_insurances
    FOR UPDATE
    USING (can_mutate_org(organization_id, 'construction.manage'::text));

-- ============================================================================
-- PART 5: Recreate view in construction schema
-- ============================================================================
CREATE OR REPLACE VIEW construction.labor_insurance_view AS
SELECT li.id,
    li.organization_id,
    li.project_id,
    li.labor_id,
    pl.contact_id,
    li.insurance_type,
    li.policy_number,
    li.provider,
    li.coverage_start,
    li.coverage_end,
    li.reminder_days,
    li.certificate_attachment_id,
    li.notes,
    li.created_by,
    li.created_at,
    li.updated_at,
    (li.coverage_end - CURRENT_DATE) AS days_to_expiry,
        CASE
            WHEN (CURRENT_DATE > li.coverage_end) THEN 'vencido'::text
            WHEN ((li.coverage_end - CURRENT_DATE) <= 30) THEN 'por_vencer'::text
            ELSE 'vigente'::text
        END AS status,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    lt.name AS labor_type_name,
    proj.name AS project_name
   FROM ((((construction.labor_insurances li
     LEFT JOIN projects.project_labor pl ON ((pl.id = li.labor_id)))
     LEFT JOIN contacts.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lt ON ((lt.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = li.project_id)));

COMMIT;
