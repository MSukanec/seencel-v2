-- ============================================================================
-- MIGRACIÓN: Normalizar tabla task_divisions
-- Agrega: organization_id, is_system, created_by, updated_by, RLS, audit log
-- Patrón: Dual sistema/org (igual que tabla tasks)
-- ============================================================================

-- ============================================================================
-- 1. AGREGAR COLUMNAS NUEVAS
-- ============================================================================

-- organization_id: NULL para divisiones de sistema, FK para divisiones de org
ALTER TABLE public.task_divisions 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- is_system: true para divisiones globales del sistema
ALTER TABLE public.task_divisions 
ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT true;

-- Auditoría: quién creó y quién editó
ALTER TABLE public.task_divisions 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;

ALTER TABLE public.task_divisions 
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;

-- import_batch_id: para trazabilidad de importaciones masivas
ALTER TABLE public.task_divisions 
ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_task_divisions_import_batch_id 
ON public.task_divisions(import_batch_id) 
WHERE import_batch_id IS NOT NULL;

-- ============================================================================
-- 2. MIGRAR DATOS EXISTENTES (marcar como sistema)
-- ============================================================================

UPDATE public.task_divisions 
SET is_system = true, organization_id = NULL 
WHERE organization_id IS NULL;

-- ============================================================================
-- 3. CONSTRAINT DE CONSISTENCIA (igual que tasks)
-- ============================================================================
-- is_system=true → organization_id IS NULL
-- is_system=false → organization_id IS NOT NULL

ALTER TABLE public.task_divisions
ADD CONSTRAINT task_divisions_system_org_consistency_chk CHECK (
    (is_system = true AND organization_id IS NULL)
    OR
    (is_system = false AND organization_id IS NOT NULL)
);

-- Índice para consultas por organización
CREATE INDEX IF NOT EXISTS idx_task_divisions_org 
ON public.task_divisions(organization_id) 
WHERE organization_id IS NOT NULL;

-- ============================================================================
-- 4. HABILITAR RLS
-- ============================================================================

ALTER TABLE public.task_divisions ENABLE ROW LEVEL SECURITY;

-- SELECT: Divisiones de sistema visibles para todos los autenticados
-- Divisiones de org solo para miembros con permiso
CREATE POLICY "MIEMBROS VEN TASK_DIVISIONS"
ON public.task_divisions
FOR SELECT TO public
USING (
    is_system = true 
    OR can_view_org(organization_id, 'projects.view'::text)
);

-- INSERT: Solo admins crean divisiones de sistema
-- Miembros con permiso crean divisiones de su org
CREATE POLICY "MIEMBROS CREAN TASK_DIVISIONS"
ON public.task_divisions
FOR INSERT TO public
WITH CHECK (
    (is_system = true AND is_admin())
    OR 
    (is_system = false AND can_mutate_org(organization_id, 'projects.manage'::text))
);

-- UPDATE: Solo admins editan divisiones de sistema
-- Miembros con permiso editan divisiones de su org
CREATE POLICY "MIEMBROS EDITAN TASK_DIVISIONS"
ON public.task_divisions
FOR UPDATE TO public
USING (
    (is_system = true AND is_admin())
    OR 
    (is_system = false AND can_mutate_org(organization_id, 'projects.manage'::text))
);

-- ============================================================================
-- 5. TRIGGER AUTO-POPULATE created_by / updated_by
-- ============================================================================

CREATE TRIGGER set_updated_by_task_divisions
BEFORE INSERT OR UPDATE ON public.task_divisions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- ============================================================================
-- 6. ACTIVITY LOG
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_task_division_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; audit_action := 'delete_task_division';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_task_division';
        ELSE
            audit_action := 'update_task_division';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; audit_action := 'create_task_division';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    -- Solo loguear si hay organization_id (divisiones de sistema no tienen org)
    IF target_record.organization_id IS NOT NULL THEN
        BEGIN
            INSERT INTO public.organization_activity_logs (
                organization_id, member_id, action, target_id, target_table, metadata
            ) VALUES (
                target_record.organization_id, resolved_member_id,
                audit_action, target_record.id, 'task_divisions', audit_metadata
            );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_division_audit
AFTER INSERT OR UPDATE OR DELETE ON public.task_divisions
FOR EACH ROW EXECUTE FUNCTION public.log_task_division_activity();
