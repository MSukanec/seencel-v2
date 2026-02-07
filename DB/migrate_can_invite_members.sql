-- ============================================================================
-- Migration: Reemplazar max_members por can_invite_members en features JSON
-- ============================================================================
-- Contexto:
-- FREE y PRO: NO pueden invitar miembros (can_invite_members = false)
-- TEAMS: Pueden invitar ilimitado, pagan por asiento (can_invite_members = true)
-- 
-- También se elimina seats_included del features JSON ya que es un campo
-- de la tabla plans directamente.
-- ============================================================================

-- 1. Actualizar FREE plan
UPDATE plans
SET features = jsonb_set(
    features::jsonb - 'max_members',
    '{can_invite_members}',
    'false'::jsonb
)
WHERE slug = 'free';

-- 2. Actualizar PRO plan
UPDATE plans
SET features = jsonb_set(
    features::jsonb - 'max_members',
    '{can_invite_members}',
    'false'::jsonb
)
WHERE slug = 'pro';

-- 3. Actualizar TEAMS plan
UPDATE plans
SET features = jsonb_set(
    features::jsonb - 'max_members',
    '{can_invite_members}',
    'true'::jsonb
)
WHERE slug = 'teams';

-- Verificar
SELECT slug, features->>'can_invite_members' as can_invite, features->>'max_members' as old_max
FROM plans
WHERE slug IN ('free', 'pro', 'teams');
