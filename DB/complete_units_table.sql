-- ============================================================================
-- MIGRACIÓN: Completar tabla UNITS siguiendo estándares Seencel
-- ============================================================================
-- Comparada con: material_types, general_cost_categories
-- Fecha: 2026-02-06
-- ============================================================================

-- 1. AGREGAR COLUMNAS FALTANTES
-- ============================================================================

-- Columna is_system para distinguir unidades del sistema vs de organización
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

-- Columnas de soft delete
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone NULL;

-- Columnas de auditoría
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS created_by uuid NULL;

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS updated_by uuid NULL;

-- 2. AGREGAR FOREIGN KEYS DE AUDITORÍA
-- ============================================================================

ALTER TABLE public.units 
ADD CONSTRAINT units_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES organization_members (id) ON DELETE SET NULL;

ALTER TABLE public.units 
ADD CONSTRAINT units_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES organization_members (id) ON DELETE SET NULL;

-- 3. AGREGAR CONSTRAINT DE CONSISTENCIA SISTEMA/ORG
-- ============================================================================
-- Si is_system = true, organization_id DEBE ser NULL
-- Si is_system = false, organization_id DEBE tener valor

ALTER TABLE public.units 
ADD CONSTRAINT units_system_org_check CHECK (
  (
    (is_system = true AND organization_id IS NULL)
    OR
    (is_system = false AND organization_id IS NOT NULL)
  )
);

-- 4. ACTUALIZAR DATOS EXISTENTES
-- ============================================================================
-- Marcar las unidades sin organization_id como del sistema

UPDATE public.units 
SET is_system = true 
WHERE organization_id IS NULL AND is_system = false;

-- 5. RECREAR ÍNDICES CORRECTOS
-- ============================================================================

-- Eliminar índice antiguo que no distingue sistema/org
DROP INDEX IF EXISTS units_name_lower_uniq;

-- Índice único para unidades de SISTEMA (sin duplicados por nombre)
CREATE UNIQUE INDEX IF NOT EXISTS uq_units_system_name 
ON public.units USING btree (lower(name)) 
TABLESPACE pg_default
WHERE (is_system = true AND is_deleted = false);

-- Índice único para unidades de ORGANIZACIÓN (sin duplicados por nombre dentro de la org)
CREATE UNIQUE INDEX IF NOT EXISTS uq_units_org_name 
ON public.units USING btree (organization_id, lower(name)) 
TABLESPACE pg_default
WHERE (is_system = false AND is_deleted = false);

-- Índice para listados (filtrado común)
CREATE INDEX IF NOT EXISTS idx_units_list 
ON public.units USING btree (is_system, organization_id, is_deleted, name) 
TABLESPACE pg_default;

-- 6. TRIGGERS DE AUDITORÍA
-- ============================================================================

-- Trigger para auto-popular updated_by
CREATE TRIGGER set_updated_by_units 
BEFORE INSERT OR UPDATE ON public.units 
FOR EACH ROW 
EXECUTE FUNCTION public.handle_updated_by();

-- Trigger para auto-actualizar updated_at
CREATE TRIGGER trg_set_updated_at_units 
BEFORE UPDATE ON public.units 
FOR EACH ROW 
EXECUTE FUNCTION public.set_updated_at();

-- 7. FUNCIÓN DE AUDIT LOG
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_unit_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
    target_org_id uuid;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_unit';
        resolved_member_id := OLD.updated_by;
        target_org_id := OLD.organization_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        target_org_id := NEW.organization_id;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_unit';
        ELSE
            audit_action := 'update_unit';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_unit';
        resolved_member_id := NEW.created_by;
        target_org_id := NEW.organization_id;
    END IF;

    -- Solo loguear si hay organization_id (no para unidades de sistema)
    IF target_org_id IS NULL THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'symbol', target_record.symbol
    );

    -- CRITICAL: Exception handler for cascade deletes
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_org_id, resolved_member_id,
            audit_action, target_record.id, 'units', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de audit log
CREATE TRIGGER on_unit_audit
AFTER INSERT OR UPDATE OR DELETE ON public.units
FOR EACH ROW EXECUTE FUNCTION public.log_unit_activity();

-- 8. HABILITAR RLS
-- ============================================================================

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS RLS
-- ============================================================================
-- Las unidades son un caso especial: pueden ser de sistema (visibles por todos)
-- o de organización (visibles solo por miembros de esa org)

-- SELECT: Ver unidades de sistema O de mi organización
CREATE POLICY "TODOS VEN UNITS SISTEMA O DE SU ORG"
ON public.units FOR SELECT TO public
USING (
    is_system = true 
    OR is_org_member(organization_id)
    OR is_admin()
);

-- INSERT: Solo miembros de la org pueden crear unidades
CREATE POLICY "MIEMBROS CREAN UNITS"
ON public.units FOR INSERT TO public
WITH CHECK (
    -- Admins pueden crear unidades de sistema
    (is_system = true AND is_admin())
    OR
    -- Miembros pueden crear unidades de su org
    (is_system = false AND is_org_member(organization_id))
);

-- UPDATE: Admins editan sistema, miembros editan su org
CREATE POLICY "MIEMBROS EDITAN UNITS"
ON public.units FOR UPDATE TO public
USING (
    (is_system = true AND is_admin())
    OR
    (is_system = false AND is_org_member(organization_id))
);

-- 10. PERMISOS (OPCIONAL - Si quieres control granular)
-- ============================================================================
-- Por ahora las unidades usan is_org_member básico
-- Si en el futuro necesitas permisos específicos (units.view, units.manage):

-- INSERT INTO public.permissions (key, description, category, is_system)
-- VALUES 
--   ('units.view', 'Ver unidades', 'catalog', true),
--   ('units.manage', 'Gestionar unidades', 'catalog', true);

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
