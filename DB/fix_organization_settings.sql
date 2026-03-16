-- ============================================================================
-- Seencel V2 - AUDIT FIXES: IAM Organizations & Organization Data
-- ============================================================================
-- Fix timestamps en organization_data
-- Fix triggers de timestamps
-- Fix Políticas RLS (Seguridad / IDOR)
-- ============================================================================

-- 1. Añadir columnas de tiempo a organization_data
ALTER TABLE iam.organization_data 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Trigger de timestamps para ambas tablas
DROP TRIGGER IF EXISTS set_timestamp_organizations ON iam.organizations;
CREATE TRIGGER set_timestamp_organizations
BEFORE UPDATE ON iam.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_organization_data ON iam.organization_data;
CREATE TRIGGER set_timestamp_organization_data
BEFORE UPDATE ON iam.organization_data
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- 3. RLS de iam.organizations
-- Eliminar las políticas previas
DROP POLICY IF EXISTS "USUARIOS VEN ORGANIZACIONES" ON iam.organizations;
DROP POLICY IF EXISTS "DUEÑOS EDITAN SU ORGANIZACION" ON iam.organizations;

-- Vista segura: Solo administradores, el creador o miembros reales. Eliminamos el (is_deleted = false) global.
CREATE POLICY "USUARIOS VEN ORGANIZACIONES" ON iam.organizations
FOR SELECT USING (
  is_admin() OR 
  (
    is_deleted = false AND (
      owner_id = (SELECT id FROM iam.users WHERE auth_id = auth.uid()) 
      OR is_org_member(id)
    )
  )
);

-- Edición permitida para Owner, Admins y Miembros con Permiso Específico
CREATE POLICY "MIEMBROS EDITAN SU ORGANIZACION" ON iam.organizations
FOR UPDATE USING (
  is_deleted = false AND (
    is_admin() OR 
    owner_id = (SELECT id FROM iam.users WHERE auth_id = auth.uid()) OR 
    can_mutate_org(id, 'organization.manage')
  )
);

-- 4. RLS de iam.organization_data
ALTER TABLE iam.organization_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MIEMBROS VEN ORGANIZATION_DATA" ON iam.organization_data;
CREATE POLICY "MIEMBROS VEN ORGANIZATION_DATA" ON iam.organization_data
FOR SELECT USING (
  is_org_member(organization_id) OR is_admin()
);

DROP POLICY IF EXISTS "ORGANIZATION CREATES ORGANIZATION_DATA" ON iam.organization_data;
CREATE POLICY "ORGANIZATION CREATES ORGANIZATION_DATA" ON iam.organization_data
FOR INSERT WITH CHECK (
  is_org_member(organization_id) OR is_admin()
);

DROP POLICY IF EXISTS "MIEMBROS EDITAN ORGANIZATION_DATA" ON iam.organization_data;
CREATE POLICY "MIEMBROS EDITAN ORGANIZATION_DATA" ON iam.organization_data
FOR UPDATE USING (
  can_mutate_org(organization_id, 'organization.manage') OR is_admin()
);
