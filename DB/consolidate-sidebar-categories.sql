-- ============================================================================
-- CONSOLIDAR CATEGORÍAS DE SIDEBAR EN UNA SOLA
-- ============================================================================
-- Antes: "Sidebar Organización" y "Sidebar Proyecto"
-- Después: "Sidebar" (única)
-- ============================================================================

-- 1. Renombrar la categoría de Organización a simplemente "Sidebar"
UPDATE feature_flag_categories
SET name = 'Sidebar'
WHERE id = 'a1b2c3d4-0001-4000-8000-000000000001';

-- 2. Mover todos los flags que apuntaban a "Sidebar Proyecto" hacia "Sidebar"
UPDATE feature_flags
SET category_id = 'a1b2c3d4-0001-4000-8000-000000000001'
WHERE category_id = 'a1b2c3d4-0002-4000-8000-000000000002';

-- 3. Eliminar la categoría "Sidebar Proyecto" (ya no tiene flags asociados)
DELETE FROM feature_flag_categories
WHERE id = 'a1b2c3d4-0002-4000-8000-000000000002';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT id, name, position FROM feature_flag_categories ORDER BY position;
SELECT key, description, category_id FROM feature_flags WHERE key LIKE 'sidebar_%' ORDER BY key;
