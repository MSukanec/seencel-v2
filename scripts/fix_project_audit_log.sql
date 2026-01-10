-- FIX PROJECT AUDIT LOGGING
-- Problem: Soft deletes (is_deleted = true) were being logged as generic 'update_project'
-- Solution: Detect state change and log as 'delete_project'

CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_project';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        
        -- DETECT SOFT DELETE
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
             audit_action := 'delete_project';
             -- For soft delete, we might want to ensure we capture the person who did it (NEW.updated_by)
        ELSIF (OLD.is_deleted = true AND NEW.is_deleted = false) THEN
             audit_action := 'restore_project';
        ELSE
             audit_action := 'update_project';
        END IF;

        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_project';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'code', target_record.code
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, 
            resolved_member_id,
            audit_action, 
            target_record.id, 
            'projects', 
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN 
        -- Fail silently to not block the transaction if log fails
        NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger to be safe (though function replacement is enough if trigger exists)
DROP TRIGGER IF EXISTS on_project_audit ON public.projects;

CREATE TRIGGER on_project_audit
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.log_project_activity();
