-- 1. Rename Column
ALTER TABLE public.site_log_types 
RENAME COLUMN is_default TO is_system;

-- 2. Drop Old Constraint (if exists) and Add New Consistency Check
ALTER TABLE public.site_log_types 
DROP CONSTRAINT IF EXISTS site_log_types_default_consistency;

ALTER TABLE public.site_log_types 
ADD CONSTRAINT site_log_types_system_consistency 
CHECK (
  (is_system = true AND organization_id IS NULL) OR 
  (is_system = false AND organization_id IS NOT NULL)
);

-- 3. Update Indexes
-- Drop old indexes based on 'is_default'
DROP INDEX IF EXISTS site_log_types_global_default_uniq;
DROP INDEX IF EXISTS site_log_types_org_default_idx;

-- Add new indexes for 'is_system'
CREATE UNIQUE INDEX IF NOT EXISTS site_log_types_system_name_uniq 
ON public.site_log_types (lower(name)) 
WHERE organization_id IS NULL AND is_deleted = false;

CREATE INDEX IF NOT EXISTS site_log_types_system_idx 
ON public.site_log_types (is_system);

-- Ensure org name unique constraint exists and is correct
DROP INDEX IF EXISTS site_log_types_org_name_uniq;
CREATE UNIQUE INDEX site_log_types_org_name_uniq 
ON public.site_log_types (organization_id, lower(name)) 
WHERE is_deleted = false;

-- 4. Enable RLS
ALTER TABLE public.site_log_types ENABLE ROW LEVEL SECURITY;

-- 5. Foreign Keys Update (Ensure ON DELETE SET NULL)
-- Ensure columns exist first
ALTER TABLE public.site_log_types 
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS updated_by uuid;

-- We attempt to drop and recreate to ensure they have ON DELETE SET NULL
ALTER TABLE public.site_log_types 
DROP CONSTRAINT IF EXISTS site_log_types_created_by_fkey;

ALTER TABLE public.site_log_types 
ADD CONSTRAINT site_log_types_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES organization_members(id) ON DELETE SET NULL;

ALTER TABLE public.site_log_types 
DROP CONSTRAINT IF EXISTS site_log_types_updated_by_fkey;

ALTER TABLE public.site_log_types 
ADD CONSTRAINT site_log_types_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES organization_members(id) ON DELETE SET NULL;


-- 6. Triggers & Audit
-- A. Timestamp (Already exists usually, but ensuring)
-- create trigger update_site_log_types_timestamp ... (assumed existing or skipped if not requested explicitly to fix)

-- B. Auto-populate created_by / updated_by
DROP TRIGGER IF EXISTS set_updated_by_site_log_types ON public.site_log_types;
CREATE TRIGGER set_updated_by_site_log_types
BEFORE INSERT OR UPDATE ON public.site_log_types
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- C. Audit Logging Function
CREATE OR REPLACE FUNCTION public.log_site_log_types_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_site_log_type';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_site_log_type';
        ELSE
            audit_action := 'update_site_log_type';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_site_log_type';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    -- SAFE INSERT CATCHING ERRORS
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'site_log_types', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Audit Trigger
DROP TRIGGER IF EXISTS on_site_log_types_audit ON public.site_log_types;
CREATE TRIGGER on_site_log_types_audit
AFTER INSERT OR UPDATE OR DELETE ON public.site_log_types
FOR EACH ROW EXECUTE FUNCTION public.log_site_log_types_activity();
