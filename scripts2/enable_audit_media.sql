-- =================================================================
-- SCRIPT: Permitir Audit Logging en Reportes (media_files, media_links)
-- FECHA: 2026-01-16
-- DESCRIPCIÓN: Agrega columnas updated_by, triggers de control de autoría
-- y triggers de log de actividad.
-- =================================================================

-- 1. Agregar columna updated_by a media_files
ALTER TABLE public.media_files 
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;

-- 2. Agregar columna updated_by a media_links
ALTER TABLE public.media_links
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;

-- 3. Trigger handle_updated_by (Auto-completa created_by y updated_by con MEMBER ID)
-- Esto corregirá el hecho de que se envíen AuthIDs desde el front/server actions.

DROP TRIGGER IF EXISTS set_updated_by_media_files ON public.media_files;
CREATE TRIGGER set_updated_by_media_files
BEFORE INSERT OR UPDATE ON public.media_files
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

DROP TRIGGER IF EXISTS set_updated_by_media_links ON public.media_links;
CREATE TRIGGER set_updated_by_media_links
BEFORE INSERT OR UPDATE ON public.media_links
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- 4. Definir Funciones de Log de Actividad

-- 4.1 media_files
CREATE OR REPLACE FUNCTION public.log_media_file_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
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

    -- Metadata básica (nombre archivo, tipo)
    audit_metadata := jsonb_build_object(
        'name', target_record.file_name,
        'type', target_record.file_type
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'media_files',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignorar si falla por integridad referencial en cascade
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 media_links
CREATE OR REPLACE FUNCTION public.log_media_link_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_media_link';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        -- media_links no tiene soft delete por defecto en script anterior, pero si lo tuviera:
        -- Asumimos hard delete o update normal
        audit_action := 'update_media_link';
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_media_link';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'category', target_record.category
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'media_links',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Aplicar Triggers de Log

DROP TRIGGER IF EXISTS on_media_file_audit ON public.media_files;
CREATE TRIGGER on_media_file_audit
AFTER INSERT OR UPDATE OR DELETE ON public.media_files
FOR EACH ROW EXECUTE FUNCTION public.log_media_file_activity();

DROP TRIGGER IF EXISTS on_media_link_audit ON public.media_links;
CREATE TRIGGER on_media_link_audit
AFTER INSERT OR UPDATE OR DELETE ON public.media_links
FOR EACH ROW EXECUTE FUNCTION public.log_media_link_activity();
