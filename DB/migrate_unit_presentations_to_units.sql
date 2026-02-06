-- ============================================================================
-- Migración: Eliminar unit_presentations y migrar FK a units
-- Fecha: 2026-02-06
-- ============================================================================

-- PASO 1: Eliminar tablas que referencian a materials (orden correcto por dependencias)
DELETE FROM construction_task_material_snapshots;
DELETE FROM materials;

-- PASO 2: Eliminar el constraint FK existente que apunta a unit_presentations
ALTER TABLE materials 
DROP CONSTRAINT IF EXISTS materials_default_unit_presentation_id_fkey;

-- PASO 3: Renombrar la columna para que sea más clara (ahora apunta a units)
ALTER TABLE materials 
RENAME COLUMN default_unit_presentation_id TO default_sale_unit_id;

-- PASO 4: Crear el nuevo FK que apunta a units
ALTER TABLE materials 
ADD CONSTRAINT materials_default_sale_unit_id_fkey 
FOREIGN KEY (default_sale_unit_id) 
REFERENCES units (id) 
ON DELETE SET NULL;

-- PASO 5: Dropear la tabla unit_presentations (ya no se usa)
DROP TABLE IF EXISTS unit_presentations CASCADE;

-- ============================================================================
-- NOTAS:
-- - La columna ahora se llama "default_sale_unit_id" y referencia a "units"
-- - Los units con applicable_to = 'material' son los que se usan para materiales
-- - Esto elimina la tabla intermedia unit_presentations
-- ============================================================================
