-- ============================================================================
-- SAVED VIEWS — Vistas guardadas por módulo
-- ============================================================================
-- Tabla genérica para guardar configuraciones de filtros + modo de vista.
-- entity_type permite reutilizar en cualquier módulo (files, movements, etc.)
-- ============================================================================

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS public.saved_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES iam.organizations(id) ON DELETE CASCADE,
    created_by uuid REFERENCES iam.organization_members(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES iam.organization_members(id) ON DELETE SET NULL,
    name text NOT NULL,
    entity_type text NOT NULL,           -- 'files', 'movements', 'materials', etc.
    view_mode text,                       -- 'explore', 'table', etc.
    filters jsonb NOT NULL DEFAULT '{}',  -- { search, facets, dateRange }
    sort_config jsonb,                    -- { column, direction } (futuro)
    is_default boolean NOT NULL DEFAULT false,
    position integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    import_batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_saved_views_org_entity
    ON public.saved_views (organization_id, entity_type)
    WHERE (is_deleted = false);

CREATE INDEX IF NOT EXISTS idx_saved_views_created_by
    ON public.saved_views (created_by)
    WHERE (is_deleted = false);

-- 3. RLS
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MEMBERS SELECT SAVED_VIEWS"
    ON public.saved_views
    FOR SELECT TO public
    USING (iam.can_view_org(organization_id, 'media.view'::text));

CREATE POLICY "MEMBERS INSERT SAVED_VIEWS"
    ON public.saved_views
    FOR INSERT TO public
    WITH CHECK (iam.can_mutate_org(organization_id, 'media.manage'::text));

CREATE POLICY "MEMBERS UPDATE SAVED_VIEWS"
    ON public.saved_views
    FOR UPDATE TO public
    USING (iam.can_mutate_org(organization_id, 'media.manage'::text));

-- 4. Triggers: timestamp + updated_by
CREATE TRIGGER set_timestamp_saved_views
    BEFORE UPDATE ON public.saved_views
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

CREATE TRIGGER set_updated_by_saved_views
    BEFORE INSERT OR UPDATE ON public.saved_views
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- 5. Audit log
CREATE OR REPLACE FUNCTION audit.log_saved_view_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; audit_action := 'delete_saved_view';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_saved_view';
        ELSE
            audit_action := 'update_saved_view';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; audit_action := 'create_saved_view';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'entity_type', target_record.entity_type
    );

    BEGIN
        INSERT INTO audit.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'saved_views', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_saved_view_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.saved_views
    FOR EACH ROW EXECUTE FUNCTION audit.log_saved_view_activity();
