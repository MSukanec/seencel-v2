-- ============================================================================
-- Migración: Unidad default por elemento + simplificación
-- Fecha: 2026-01-24
-- Descripción: Cada elemento tiene unidad default, se elimina descripción del wizard
-- ============================================================================

-- ============================================================================
-- PASO 1: Agregar default_unit_id a task_elements
-- ============================================================================

ALTER TABLE task_elements ADD COLUMN IF NOT EXISTS default_unit_id uuid REFERENCES units(id);

-- ============================================================================
-- PASO 2: Obtener IDs de unidades comunes
-- ============================================================================

DO $$
DECLARE
  v_m2 uuid;
  v_m uuid;
  v_m3 uuid;
  v_un uuid;
  v_gl uuid;
  v_kg uuid;
BEGIN
  -- Buscar unidades por nombre o abbreviation
  SELECT id INTO v_m2 FROM units WHERE lower(name) LIKE '%metro cuadrado%' OR lower(name) = 'm2' OR lower(name) = 'm²' LIMIT 1;
  SELECT id INTO v_m FROM units WHERE lower(name) LIKE '%metro lineal%' OR lower(name) = 'm' OR lower(name) = 'ml' LIMIT 1;
  SELECT id INTO v_m3 FROM units WHERE lower(name) LIKE '%metro c%bico%' OR lower(name) = 'm3' OR lower(name) = 'm³' LIMIT 1;
  SELECT id INTO v_un FROM units WHERE lower(name) LIKE '%unidad%' OR lower(name) = 'un' LIMIT 1;
  SELECT id INTO v_gl FROM units WHERE lower(name) LIKE '%global%' OR lower(name) = 'gl' LIMIT 1;
  SELECT id INTO v_kg FROM units WHERE lower(name) LIKE '%kilogramo%' OR lower(name) = 'kg' LIMIT 1;

  -- Si no se encuentran, usar el primero disponible como fallback
  IF v_m2 IS NULL THEN SELECT id INTO v_m2 FROM units LIMIT 1; END IF;
  IF v_m IS NULL THEN v_m := v_m2; END IF;
  IF v_m3 IS NULL THEN v_m3 := v_m2; END IF;
  IF v_un IS NULL THEN v_un := v_m2; END IF;
  IF v_gl IS NULL THEN v_gl := v_m2; END IF;
  IF v_kg IS NULL THEN v_kg := v_m2; END IF;

  -- ========================================
  -- SUPERFICIES → M2
  -- ========================================
  UPDATE task_elements SET default_unit_id = v_m2 
  WHERE slug IN (
    'contrapiso', 'carpeta-nivelacion', 'losa', 'piso-flotante', 
    'ceramico', 'porcelanato', 'muro', 'tabique', 'muro-hormigon',
    'revoque-grueso', 'revoque-fino', 'pintura', 'revestimiento',
    'cielorraso', 'cielorraso-suspendido', 'cubierta', 'membrana',
    'vereda'
  );

  -- ========================================
  -- LINEALES → M
  -- ========================================
  UPDATE task_elements SET default_unit_id = v_m 
  WHERE slug IN (
    'caneria-agua', 'caneria-desague', 'cableado', 'cordon',
    'baranda', 'zocalo', 'cerco'
  );

  -- ========================================
  -- VOLUMÉTRICOS → M3
  -- ========================================
  UPDATE task_elements SET default_unit_id = v_m3 
  WHERE slug IN (
    'columna', 'viga', 'escalera'
  );

  -- ========================================
  -- UNIDADES → UN
  -- ========================================
  UPDATE task_elements SET default_unit_id = v_un 
  WHERE slug IN (
    'puerta', 'ventana', 'reja', 'porton',
    'inodoro', 'lavatorio', 'ducha', 'banera', 'grifo',
    'tanque-agua', 'calefon', 'termotanque',
    'tablero-electrico', 'tomacorriente', 'interruptor', 'luminaria',
    'aire-acondicionado', 'calefaccion', 'radiador',
    'mueble', 'mesada'
  );

  -- ========================================
  -- GLOBAL → GL
  -- ========================================
  UPDATE task_elements SET default_unit_id = v_gl 
  WHERE slug IN (
    'jardin'
  );

  -- ========================================
  -- Fallback: cualquier elemento sin unidad → M2
  -- ========================================
  UPDATE task_elements SET default_unit_id = v_m2 
  WHERE default_unit_id IS NULL;

END $$;

-- ============================================================================
-- PASO 3: Hacer default_unit_id NOT NULL para nuevos elementos
-- ============================================================================
-- (No lo hacemos NOT NULL ahora para no romper inserts existentes)
-- Si querés hacerlo obligatorio después: 
-- ALTER TABLE task_elements ALTER COLUMN default_unit_id SET NOT NULL;

COMMENT ON COLUMN task_elements.default_unit_id IS 'Unidad de medida default para este elemento (M2, M, UN, etc.)';
