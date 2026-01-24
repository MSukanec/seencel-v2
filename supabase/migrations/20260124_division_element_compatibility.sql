-- ============================================================================
-- Migración: Compatibilidad Division ↔ Element
-- Fecha: 2026-01-24
-- Descripción: Filtra qué elementos son válidos para cada rubro (división)
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear tabla task_division_elements
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_division_elements (
  division_id uuid NOT NULL REFERENCES task_divisions(id) ON DELETE CASCADE,
  element_id uuid NOT NULL REFERENCES task_elements(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (division_id, element_id)
);

-- RLS
ALTER TABLE task_division_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TODOS VEN TASK_DIVISION_ELEMENTS" ON task_division_elements FOR SELECT USING (true);
CREATE POLICY "ADMINS GESTIONAN TASK_DIVISION_ELEMENTS" ON task_division_elements FOR ALL USING (is_admin());

COMMENT ON TABLE task_division_elements IS 'Matriz de compatibilidad Division↔Element';

-- ============================================================================
-- PASO 2: Poblar matriz de compatibilidad
-- ============================================================================

DO $$
DECLARE
  v_div_id uuid;
BEGIN

  -- ========================================
  -- MAMPOSTERÍA Y TABIQUES
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%mamposter%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('muro', 'tabique', 'revoque-grueso', 'revoque-fino')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CONTRAPISOS Y CARPETAS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%contrapiso%' OR lower(name) LIKE '%carpeta%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('contrapiso', 'carpeta-nivelacion')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CIELORRASOS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%cielorraso%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('cielorraso', 'cielorraso-suspendido')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- HORMIGÓN ARMADO
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%hormig%armado%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('losa', 'columna', 'viga', 'muro-hormigon')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- ESTRUCTURAS RESISTENTES
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%estructur%resistente%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('losa', 'columna', 'viga', 'muro-hormigon', 'escalera')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CUBIERTAS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%cubierta%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('cubierta', 'membrana', 'cielorraso')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- AISLACIONES
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%aislaci%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('membrana', 'revestimiento')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CARPINTERÍAS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%carpinter%' AND lower(name) NOT LIKE '%met%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('puerta', 'ventana', 'mueble', 'mesada', 'baranda', 'zocalo')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CARPINTERÍA METÁLICA
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%met%lica%' OR lower(name) LIKE '%metalic%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('puerta', 'ventana', 'reja', 'porton', 'baranda')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- ABERTURAS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%abertura%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('puerta', 'ventana', 'reja', 'porton')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- REVESTIMIENTOS (si existe como rubro)
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%revestim%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('ceramico', 'porcelanato', 'pintura', 'revestimiento', 'zocalo')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- PISOS (si existe como rubro)
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%piso%' AND lower(name) NOT LIKE '%contrapiso%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('ceramico', 'porcelanato', 'piso-flotante', 'zocalo')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- INSTALACIONES SANITARIAS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%sanitar%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('caneria-agua', 'caneria-desague', 'inodoro', 'lavatorio', 
                   'ducha', 'banera', 'grifo', 'tanque-agua', 'calefon', 'termotanque')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- INSTALACIONES ELÉCTRICAS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%el%ctric%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('tablero-electrico', 'cableado', 'tomacorriente', 'interruptor', 'luminaria')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- INSTALACIONES DE GAS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%gas%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('calefon', 'calefaccion', 'radiador')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CLIMATIZACIÓN
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%climatiz%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('aire-acondicionado', 'calefaccion', 'radiador')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- EQUIPAMIENTO
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%equipam%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('mueble', 'mesada', 'aire-acondicionado', 'calefon', 'termotanque')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- PAISAJISMO Y EXTERIORES
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%paisaj%' OR lower(name) LIKE '%exterior%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_elements (division_id, element_id)
    SELECT v_div_id, id FROM task_elements 
    WHERE slug IN ('vereda', 'cordon', 'cerco', 'jardin')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- MOVIMIENTO DE SUELOS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%suelo%' OR lower(name) LIKE '%tierra%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    -- Los elementos para mov de suelos son más abstractos, podemos dejarlo vacío
    -- o crear elementos específicos como "terreno", "zanja", etc.
    NULL;
  END IF;

END $$;
