-- ============================================================================
-- Migración: Crear tabla unit_categories y migrar FK
-- Fecha: 2026-02-06
-- ============================================================================

-- PASO 1: Crear tabla unit_categories
CREATE TABLE IF NOT EXISTS public.unit_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    name text NOT NULL,
    description text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT unit_categories_pkey PRIMARY KEY (id),
    CONSTRAINT unit_categories_code_unique UNIQUE (code),
    CONSTRAINT unit_categories_code_not_blank CHECK (btrim(code) <> ''::text)
) TABLESPACE pg_default;

-- PASO 2: Poblar con las categorías
INSERT INTO unit_categories (code, name, description) VALUES
    ('length', 'Medida', 'Unidades de longitud, superficie y volumen (m, m², m³, etc.)'),
    ('time', 'Tiempo', 'Unidades de tiempo (hora, jornal, mes)'),
    ('weight', 'Peso', 'Unidades de peso (kg)'),
    ('volume', 'Volumen', 'Unidades de volumen líquido (litro)'),
    ('packaging', 'Presentación', 'Presentaciones comerciales (bolsa, caja, bidón, etc.)'),
    ('unit', 'Genérica', 'Unidades genéricas (unidad, global, punto)')
ON CONFLICT (code) DO NOTHING;

-- PASO 3: Agregar nueva columna unit_category_id (temporalmente nullable)
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS unit_category_id uuid NULL;

-- PASO 4: Migrar datos de text a uuid
UPDATE units u
SET unit_category_id = uc.id
FROM unit_categories uc
WHERE u.unit_category = uc.code;

-- Para los que no tenían categoría, asignar 'unit' por defecto
UPDATE units u
SET unit_category_id = (SELECT id FROM unit_categories WHERE code = 'unit')
WHERE u.unit_category_id IS NULL;

-- PASO 5: Agregar el FK constraint
ALTER TABLE units
ADD CONSTRAINT units_unit_category_id_fkey 
FOREIGN KEY (unit_category_id) 
REFERENCES unit_categories (id) 
ON DELETE SET NULL;

-- PASO 6: Eliminar la columna text vieja (opcional - descomentar cuando esté listo)
-- ALTER TABLE units DROP COLUMN IF EXISTS unit_category;

-- PASO 7: Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_units_category ON units (unit_category_id);

-- ============================================================================
-- Verificar resultados
-- ============================================================================
-- SELECT u.name, u.symbol, uc.name as category_name
-- FROM units u
-- LEFT JOIN unit_categories uc ON u.unit_category_id = uc.id
-- ORDER BY uc.name, u.name;
