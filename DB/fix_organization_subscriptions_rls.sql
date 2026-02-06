-- ============================================================
-- FIX: Agregar RLS policy de SELECT en organization_subscriptions
-- ============================================================
-- El billing view no puede leer la suscripción activa porque
-- falta una policy de SELECT, y cae al fallback hardcodeado.
-- ============================================================

-- 1. Verificar policies existentes
SELECT polname, polcmd, qual 
FROM pg_policies 
WHERE tablename = 'organization_subscriptions';

-- 2. Si NO hay policy de SELECT, crear una:
-- Permite a miembros de la organización ver las suscripciones
CREATE POLICY "Members can view organization subscriptions"
ON organization_subscriptions
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM organization_members om
        JOIN users u ON u.id = om.user_id
        WHERE u.auth_id = auth.uid()
    )
);

-- 3. Asegurarse de que RLS está habilitado
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
