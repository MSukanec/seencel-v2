-- ============================================================================
-- FIX: media_files — Crear trigger de audit log  
-- Tablas afectadas: public.media_files
-- Fecha: 2026-03-14
-- Contexto: media_files no tiene trigger de audit log. Se crea la función
--           audit.log_media_file_activity() siguiendo el patrón estándar
--           (misma estructura que log_media_file_folder_activity).
-- ============================================================================

-- 1. Crear la función de audit
CREATE OR REPLACE FUNCTION audit.log_media_file_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    -- Skip si no tiene organization_id (archivos públicos del sistema)
    IF (TG_OP = 'DELETE' AND OLD.organization_id IS NULL) OR
       (TG_OP IN ('INSERT', 'UPDATE') AND NEW.organization_id IS NULL) THEN
        RETURN NULL;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_media_file';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_media_file';
        ELSE
            audit_action := 'update_media_file';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_media_file';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'file_name', target_record.file_name,
        'file_type', target_record.file_type,
        'bucket', target_record.bucket
    );

    BEGIN
        INSERT INTO audit.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'media_files', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$;

-- 2. Crear el trigger
CREATE TRIGGER on_media_file_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.media_files
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_media_file_activity();
