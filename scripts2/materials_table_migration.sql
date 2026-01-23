-- ============================================================================
-- MATERIALS TABLE MIGRATION
-- Purpose: Add audit logging, soft delete, and fix constraints
-- Following: AUDIT-LOGGING-GUIDELINES.md
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING COLUMNS (Soft Delete + Audit)
-- ============================================================================

-- 1.1 Soft Delete columns
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone NULL;

-- 1.2 Audit columns (with correct FK + ON DELETE SET NULL)
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;

ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. FIX CONSTRAINTS
-- ============================================================================

-- 2.1 NOTE: materials_id_key is redundant with PK, but we keep it because
-- other tables (organization_material_prices, products, task_materials) 
-- have FKs depending on this index. It's harmless to keep.

-- 2.2 Drop problematic global unique constraint on name
ALTER TABLE public.materials 
DROP CONSTRAINT IF EXISTS materials_name_key;

-- 2.3 Add proper unique constraint: name unique per organization
-- NOTE: For system materials (is_system = true, organization_id = NULL), 
-- name should be globally unique, but we handle this via partial index
CREATE UNIQUE INDEX IF NOT EXISTS materials_name_org_unique 
ON public.materials (name, organization_id) 
WHERE organization_id IS NOT NULL AND is_deleted = false;

-- Create separate unique index for system materials (org_id is null)
CREATE UNIQUE INDEX IF NOT EXISTS materials_name_system_unique 
ON public.materials (name) 
WHERE organization_id IS NULL AND is_system = true AND is_deleted = false;

-- ============================================================================
-- 3. TRIGGER: handle_updated_by (Auto-populate created_by/updated_by)
-- ============================================================================
-- Note: This function should already exist in your DB from previous migrations.
-- If not, the AUDIT-LOGGING-GUIDELINES.md has the full definition.

DROP TRIGGER IF EXISTS set_updated_by_materials ON public.materials;

CREATE TRIGGER set_updated_by_materials
BEFORE INSERT OR UPDATE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- ============================================================================
-- 4. TRIGGER: Audit Logging to organization_activity_logs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_material_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    -- Skip logging for system materials (no organization_id)
    IF (TG_OP = 'DELETE' AND OLD.organization_id IS NULL) OR
       (TG_OP IN ('INSERT', 'UPDATE') AND NEW.organization_id IS NULL) THEN
        RETURN NULL;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_material';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        -- Detect soft delete
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_material';
        ELSE
            audit_action := 'update_material';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_material';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Build metadata with relevant info
    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'material_type', target_record.material_type,
        'is_system', target_record.is_system
    );

    -- CRITICAL: Wrap in exception handler for cascade deletes
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'materials',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        -- Silently skip if org/member no longer exists (cascade delete in progress)
        NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the audit trigger
DROP TRIGGER IF EXISTS on_material_audit ON public.materials;

CREATE TRIGGER on_material_audit
AFTER INSERT OR UPDATE OR DELETE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.log_material_activity();

-- ============================================================================
-- 5. ADD INDEX FOR SOFT DELETE QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_materials_is_deleted 
ON public.materials (is_deleted) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_materials_org_deleted 
ON public.materials (organization_id, is_deleted);

-- ============================================================================
-- 6. UPDATE TRIGGER FOR updated_at (if not already exists)
-- ============================================================================

-- Ensure updated_at is auto-updated on changes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_materials ON public.materials;

CREATE TRIGGER set_updated_at_materials
BEFORE UPDATE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- DONE!
-- ============================================================================
-- Summary of changes:
-- ✅ Added is_deleted & deleted_at for soft delete
-- ✅ Added created_by & updated_by with ON DELETE SET NULL
-- ✅ Fixed unique constraint: now per-organization instead of global
-- ✅ Added handle_updated_by trigger
-- ✅ Added audit logging trigger with exception handling
-- ✅ Added performance indexes
-- ============================================================================
