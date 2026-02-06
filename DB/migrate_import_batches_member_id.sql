-- ===========================================
-- MIGRACIÓN: import_batches.user_id -> member_id
-- ===========================================
-- El user_id actual referencia auth.users pero debería
-- referenciar organization_members (el patrón estándar)

-- 1. Agregar nueva columna member_id
ALTER TABLE import_batches
ADD COLUMN IF NOT EXISTS member_id UUID NULL;

-- 2. Agregar FK a organization_members
ALTER TABLE import_batches
ADD CONSTRAINT import_batches_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES organization_members(id) ON DELETE SET NULL;

-- 3. Poblar member_id basándose en user_id existente
-- (busca el member de la misma org que tenga ese user_id)
UPDATE import_batches ib
SET member_id = om.id
FROM organization_members om
WHERE om.user_id = ib.user_id
  AND om.organization_id = ib.organization_id
  AND ib.member_id IS NULL;

-- 4. Eliminar la constraint vieja (FK a auth.users)
ALTER TABLE import_batches
DROP CONSTRAINT IF EXISTS import_batches_user_id_fkey;

-- 5. Eliminar columna user_id
ALTER TABLE import_batches
DROP COLUMN IF EXISTS user_id;

-- 6. Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_import_batches_member_id 
ON import_batches(member_id) 
WHERE member_id IS NOT NULL;

-- Verificar migración
SELECT 
    ib.id,
    ib.entity_type,
    ib.record_count,
    ib.member_id,
    om.user_id as original_user_id,
    u.full_name
FROM import_batches ib
LEFT JOIN organization_members om ON om.id = ib.member_id
LEFT JOIN users u ON u.id = om.user_id
LIMIT 5;
