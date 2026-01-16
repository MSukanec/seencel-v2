-- 1. Add Missing Standard Columns (Validation & Soft Delete)
ALTER TABLE public.site_logs 
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- 2. Rename/Fix Constraints (Clean up 'fkey1' if they exist, ensure standard naming)
-- We drop potential auto-generated names to ensure cleanliness
ALTER TABLE public.site_logs DROP CONSTRAINT IF EXISTS site_logs_created_by_fkey1;
ALTER TABLE public.site_logs DROP CONSTRAINT IF EXISTS site_logs_entry_type_id_fkey1;

-- Re-add with proper standard names
ALTER TABLE public.site_logs 
DROP CONSTRAINT IF EXISTS site_logs_created_by_fkey;
ALTER TABLE public.site_logs 
ADD CONSTRAINT site_logs_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES organization_members(id) ON DELETE SET NULL;

ALTER TABLE public.site_logs 
DROP CONSTRAINT IF EXISTS site_logs_entry_type_id_fkey;
ALTER TABLE public.site_logs 
ADD CONSTRAINT site_logs_entry_type_id_fkey 
FOREIGN KEY (entry_type_id) REFERENCES site_log_types(id) ON DELETE SET NULL;

-- 3. Security (RLS)
ALTER TABLE public.site_logs ENABLE ROW LEVEL SECURITY;

-- 4. Indexes (Adding those missing from your snippet + Soft Delete support)
CREATE INDEX IF NOT EXISTS site_logs_not_deleted_pub_idx 
ON public.site_logs (is_public) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS site_logs_not_deleted_date_idx 
ON public.site_logs (organization_id, project_id, log_date DESC) 
WHERE is_deleted = false;

-- 5. Audit Triggers
-- A. Auto-populate created_by / updated_by
DROP TRIGGER IF EXISTS set_updated_by_site_logs ON public.site_logs;
CREATE TRIGGER set_updated_by_site_logs
BEFORE INSERT OR UPDATE ON public.site_logs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- B. Audit Logging Function
CREATE OR REPLACE FUNCTION public.log_site_logs_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_site_log';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_site_log';
        ELSE
            audit_action := 'update_site_log';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_site_log';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Generic metadata, maybe add date or weather?
    audit_metadata := jsonb_build_object(
        'date', target_record.log_date,
        'summary', left(target_record.ai_summary, 50)
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'site_logs', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Audit Trigger
DROP TRIGGER IF EXISTS on_site_logs_audit ON public.site_logs;
CREATE TRIGGER on_site_logs_audit
AFTER INSERT OR UPDATE OR DELETE ON public.site_logs
FOR EACH ROW EXECUTE FUNCTION public.log_site_logs_activity();
