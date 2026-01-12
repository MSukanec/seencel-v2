-- =========================================================
-- CORRECCIÓN DE SCHEMA Y AUDITORÍA: client_roles
-- =========================================================

-- 1. CORREGIR FOREIGN KEYS (CRÍTICO: De auth.users a organization_members)
-- Necesario para que handle_updated_by no falle por restricción de clave foránea
ALTER TABLE public.client_roles
  DROP CONSTRAINT IF EXISTS client_roles_created_by_fkey,
  DROP CONSTRAINT IF EXISTS client_roles_updated_by_fkey;

ALTER TABLE public.client_roles
  ADD CONSTRAINT client_roles_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.organization_members(id) ON DELETE SET NULL;

ALTER TABLE public.client_roles
  ADD CONSTRAINT client_roles_updated_by_fkey 
  FOREIGN KEY (updated_by) REFERENCES public.organization_members(id) ON DELETE SET NULL;


-- 2. TRIGGER DE AUTO-POBLADO
-- Nota: Usa la función public.handle_updated_by() GLOBAL (EXISTENTE)
DROP TRIGGER IF EXISTS set_audit_client_roles ON public.client_roles;
CREATE TRIGGER set_audit_client_roles BEFORE INSERT OR UPDATE ON public.client_roles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();


-- 3. FUNCIÓN Y TRIGGER DE LOGS (Historial de Actividad)
CREATE OR REPLACE FUNCTION public.log_client_role_activity() RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid; audit_action text; audit_metadata jsonb; target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN target_record := OLD; audit_action := 'delete_role'; resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN target_record := NEW; 
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN audit_action := 'delete_role'; ELSE audit_action := 'update_role'; END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN target_record := NEW; audit_action := 'create_role'; resolved_member_id := NEW.created_by; END IF;

    -- Ignorar roles de sistema (sin organización)
    IF target_record.organization_id IS NULL THEN RETURN NULL; END IF;

    audit_metadata := jsonb_build_object('name', target_record.name, 'is_system', target_record.is_system);

    BEGIN INSERT INTO public.organization_activity_logs (organization_id, member_id, action, target_id, target_table, metadata)
    VALUES (target_record.organization_id, resolved_member_id, audit_action, target_record.id, 'client_roles', audit_metadata);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    RETURN NULL;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_client_role_audit ON public.client_roles;
CREATE TRIGGER on_client_role_audit AFTER INSERT OR UPDATE OR DELETE ON public.client_roles FOR EACH ROW EXECUTE FUNCTION public.log_client_role_activity();
