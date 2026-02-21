-- ==========================================
-- 081: Agregar RLS a iam.organization_preferences 
-- ==========================================
-- PROBLEMA: La tabla iam.organization_preferences NO tiene RLS policies,
-- causando error 406 en queries desde el frontend.
-- Esto ocurrió porque la tabla fue migrada a schema iam sin sus policies.
-- ==========================================

-- 1. Habilitar RLS (si no está habilitada)
ALTER TABLE iam.organization_preferences ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: Miembros de la organización pueden ver preferences
CREATE POLICY "MIEMBROS VEN ORGANIZATION_PREFERENCES"
ON iam.organization_preferences
FOR SELECT
USING (
    can_view_org(organization_id, 'settings.view'::text)
);

-- 3. INSERT: Solo admins pueden crear preferences
CREATE POLICY "ADMINS CREAN ORGANIZATION_PREFERENCES"
ON iam.organization_preferences
FOR INSERT
WITH CHECK (
    can_mutate_org(organization_id, 'settings.manage'::text)
);

-- 4. UPDATE: Solo admins pueden actualizar preferences
CREATE POLICY "ADMINS ACTUALIZAN ORGANIZATION_PREFERENCES"
ON iam.organization_preferences
FOR UPDATE
USING (
    can_mutate_org(organization_id, 'settings.manage'::text)
);

-- ==========================================
-- VERIFICACIÓN
-- ==========================================
-- Ejecutar después para verificar:
-- SELECT policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'iam' AND tablename = 'organization_preferences';
