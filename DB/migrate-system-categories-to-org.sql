-- ============================================================================
-- Migración: Convertir categorías de sistema a categorías de organización
-- Org destino: fc219672-3241-4a69-99f4-e58f146843eb
-- ============================================================================
-- 
-- CONTEXTO:
-- Las categorías con is_system = true tienen organization_id = NULL.
-- Este script las convierte a categorías normales de la org especificada.
--
-- PRECAUCIÓN:
-- El constraint CHECK exige que is_system=false tenga organization_id NOT NULL.
-- El índice UNIQUE uq_gc_categories_org_name evita nombres duplicados por org.
-- Si la org ya tiene una categoría con el mismo nombre, esa fila fallará.
--
-- EJECUCIÓN: Correr en Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- 1. Verificar posibles conflictos de nombre antes de migrar
-- (categorías system cuyo nombre ya existe como custom en la org destino)
SELECT 
    sys.id AS system_id,
    sys.name AS conflicting_name,
    custom.id AS existing_custom_id
FROM finance.general_cost_categories sys
JOIN finance.general_cost_categories custom
    ON lower(sys.name) = lower(custom.name)
    AND custom.organization_id = 'fc219672-3241-4a69-99f4-e58f146843eb'
    AND custom.is_deleted = false
WHERE sys.is_system = true
  AND sys.is_deleted = false;

-- ⚠️ Si el SELECT anterior devuelve filas, hay conflictos.
--    En ese caso, decidir si renombrar o eliminar las duplicadas antes de continuar.

-- 2. Migrar: convertir system → org
UPDATE finance.general_cost_categories
SET 
    is_system = false,
    organization_id = 'fc219672-3241-4a69-99f4-e58f146843eb',
    updated_at = now()
WHERE is_system = true
  AND is_deleted = false;

COMMIT;

-- 3. Verificar resultado
SELECT id, name, is_system, organization_id
FROM finance.general_cost_categories
WHERE organization_id = 'fc219672-3241-4a69-99f4-e58f146843eb'
  AND is_deleted = false
ORDER BY name;
