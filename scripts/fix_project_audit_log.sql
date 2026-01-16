CREATE OR REPLACE FUNCTION public.log_project_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
             -- CHECK IF IT IS ONLY A LAST_ACTIVE_AT UPDATE (NOISE FILTER)
             -- We ignore the update if all main "business" fields are identical.
             -- We exclude: last_active_at, updated_at, updated_by
             IF (
                NEW.name = OLD.name AND
                NEW.organization_id = OLD.organization_id AND
                NEW.is_active = OLD.is_active AND
                NEW.status = OLD.status AND
                NEW.color IS NOT DISTINCT FROM OLD.color AND
                NEW.use_custom_color = OLD.use_custom_color AND
                NEW.custom_color_h IS NOT DISTINCT FROM OLD.custom_color_h AND
                NEW.custom_color_hex IS NOT DISTINCT FROM OLD.custom_color_hex AND
                NEW.code IS NOT DISTINCT FROM OLD.code AND
                NEW.is_over_limit IS NOT DISTINCT FROM OLD.is_over_limit AND
                NEW.image_url IS NOT DISTINCT FROM OLD.image_url AND
                NEW.project_type_id IS NOT DISTINCT FROM OLD.project_type_id AND
                NEW.project_modality_id IS NOT DISTINCT FROM OLD.project_modality_id
             ) THEN
                RETURN NULL; -- Squelch the log
             END IF;

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
$function$;
