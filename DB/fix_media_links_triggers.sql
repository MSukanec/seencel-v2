-- ============================================================================
-- FIX: media_links — Columnas faltantes + trigger set_timestamp + audit log
-- Tablas afectadas: public.media_links
-- Fecha: 2026-03-14
-- Contexto: 
--   La introspección NO muestra is_deleted, deleted_at ni updated_at
--   en media_links, pero el código frontend las usa.
--
--   ANTES DE EJECUTAR: Verificar en Supabase si estas columnas ya existen.
--   Si ya existen, saltar la sección 1 y ejecutar solo las secciones 2-4.
-- ============================================================================

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ SECCIÓN 1: VERIFICAR/CREAR COLUMNAS FALTANTES                      ║
-- ║ ⚠️ EJECUTAR SOLO SI LAS COLUMNAS NO EXISTEN EN LA DB REAL         ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- Verificar primero con:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'media_links'
-- AND column_name IN ('is_deleted', 'deleted_at', 'updated_at');

-- Si NO existen, ejecutar:
/*
ALTER TABLE public.media_links
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
*/

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ SECCIÓN 2: TRIGGER set_timestamp                                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- Solo ejecutar si media_links tiene columna updated_at
CREATE TRIGGER media_links_set_updated_at
    BEFORE UPDATE ON public.media_links
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamp();

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ SECCIÓN 3: FUNCIÓN DE AUDIT LOG                                     ║
-- ╚══════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION audit.log_media_link_activity()
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
    -- Skip si no tiene organization_id
    IF (TG_OP = 'DELETE' AND OLD.organization_id IS NULL) OR
       (TG_OP IN ('INSERT', 'UPDATE') AND NEW.organization_id IS NULL) THEN
        RETURN NULL;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_media_link';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        -- Detectar soft delete (solo si la columna is_deleted existe)
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_media_link';
        ELSE
            audit_action := 'update_media_link';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_media_link';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'media_file_id', target_record.media_file_id,
        'category', target_record.category,
        'visibility', target_record.visibility
    );

    BEGIN
        INSERT INTO audit.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'media_links', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ SECCIÓN 4: TRIGGER DE AUDIT LOG                                     ║
-- ╚══════════════════════════════════════════════════════════════════════╝

CREATE TRIGGER on_media_link_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.media_links
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_media_link_activity();
