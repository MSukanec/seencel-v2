-- ============================================================================
-- Migración: Compatibilidad Division ↔ Kind
-- Fecha: 2026-01-24
-- Descripción: Filtra qué tipos de acción (kinds) son válidos para cada rubro
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear tabla task_division_kinds
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_division_kinds (
  division_id uuid NOT NULL REFERENCES task_divisions(id) ON DELETE CASCADE,
  kind_id uuid NOT NULL REFERENCES task_kind(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (division_id, kind_id)
);

-- RLS
ALTER TABLE task_division_kinds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TODOS VEN TASK_DIVISION_KINDS" ON task_division_kinds FOR SELECT USING (true);
CREATE POLICY "ADMINS GESTIONAN TASK_DIVISION_KINDS" ON task_division_kinds FOR ALL USING (is_admin());

COMMENT ON TABLE task_division_kinds IS 'Matriz de compatibilidad Division↔Kind';

-- ============================================================================
-- PASO 2: Poblar matriz de compatibilidad
-- ============================================================================

DO $$
DECLARE
  -- Kinds
  v_ejecucion uuid := (SELECT id FROM task_kind WHERE code = 'CONSTRUCTION');
  v_demolicion uuid := (SELECT id FROM task_kind WHERE code = 'DEMOLITION');
  v_instalacion uuid := (SELECT id FROM task_kind WHERE code = 'INSTALLATION');
  v_reparacion uuid := (SELECT id FROM task_kind WHERE code = 'MAINTENANCE');
  v_colocacion uuid := (SELECT id FROM task_kind WHERE code = 'PLACEMENT');
  v_remocion uuid := (SELECT id FROM task_kind WHERE code = 'REMOVAL');
  v_reemplazo uuid := (SELECT id FROM task_kind WHERE code = 'REPLACEMENT');
  v_limpieza uuid := (SELECT id FROM task_kind WHERE code = 'CLEANING');
  v_proteccion uuid := (SELECT id FROM task_kind WHERE code = 'PROTECTION');
  v_excavacion uuid := (SELECT id FROM task_kind WHERE code = 'EXCAVATION');
  v_compactacion uuid := (SELECT id FROM task_kind WHERE code = 'COMPACTION');
  v_inspeccion uuid := (SELECT id FROM task_kind WHERE code = 'INSPECTION');
  v_montaje uuid := (SELECT id FROM task_kind WHERE code = 'ASSEMBLY');
  v_suministro uuid := (SELECT id FROM task_kind WHERE code = 'SUPPLY');
  v_alquiler uuid := (SELECT id FROM task_kind WHERE code = 'RENTAL');
  
  -- Division IDs by name
  v_div_id uuid;
BEGIN

  -- ========================================
  -- TRABAJOS PRELIMINARES
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%preliminar%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_limpieza),
      (v_div_id, v_excavacion),
      (v_div_id, v_demolicion),
      (v_div_id, v_proteccion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- DEMOLICIONES
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%demolici%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_demolicion),
      (v_div_id, v_remocion),
      (v_div_id, v_limpieza)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- MAMPOSTERÍA Y TABIQUES
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%mamposter%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_ejecucion),
      (v_div_id, v_demolicion),
      (v_div_id, v_reparacion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- MOVIMIENTO DE SUELOS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%suelo%' OR lower(name) LIKE '%tierra%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_excavacion),
      (v_div_id, v_compactacion),
      (v_div_id, v_ejecucion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- EQUIPAMIENTO
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%equipam%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_instalacion),
      (v_div_id, v_suministro),
      (v_div_id, v_montaje),
      (v_div_id, v_remocion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- AISLACIONES
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%aislaci%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_colocacion),
      (v_div_id, v_ejecucion),
      (v_div_id, v_reparacion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CARPINTERÍAS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%carpinter%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_instalacion),
      (v_div_id, v_remocion),
      (v_div_id, v_reemplazo),
      (v_div_id, v_reparacion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CIELORRASOS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%cielorraso%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_ejecucion),
      (v_div_id, v_instalacion),
      (v_div_id, v_colocacion),
      (v_div_id, v_demolicion),
      (v_div_id, v_reparacion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- ESTRUCTURAS RESISTENTES
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%estructur%resistente%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_ejecucion),
      (v_div_id, v_demolicion),
      (v_div_id, v_montaje),
      (v_div_id, v_reparacion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- HORMIGÓN ARMADO
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%hormig%armado%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_ejecucion),
      (v_div_id, v_demolicion),
      (v_div_id, v_reparacion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CARPINTERÍA METÁLICA
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%met%lica%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_instalacion),
      (v_div_id, v_montaje),
      (v_div_id, v_remocion),
      (v_div_id, v_reparacion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CUBIERTAS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%cubierta%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_ejecucion),
      (v_div_id, v_colocacion),
      (v_div_id, v_remocion),
      (v_div_id, v_reparacion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CONTRAPISOS Y CARPETAS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%contrapiso%' OR lower(name) LIKE '%carpeta%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_ejecucion),
      (v_div_id, v_demolicion),
      (v_div_id, v_reparacion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- ABERTURAS
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%abertura%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_instalacion),
      (v_div_id, v_remocion),
      (v_div_id, v_reemplazo)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- PAISAJISMO Y EXTERIORES
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%paisaj%' OR lower(name) LIKE '%exterior%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_ejecucion),
      (v_div_id, v_colocacion),
      (v_div_id, v_instalacion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- INSTALACIONES (ELÉCTRICAS, GAS, CLIMA)
  -- ========================================
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%instalacion%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_instalacion),
      (v_div_id, v_remocion),
      (v_div_id, v_reemplazo),
      (v_div_id, v_reparacion),
      (v_div_id, v_inspeccion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Instalaciones de Climatización
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%climatizac%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_instalacion),
      (v_div_id, v_remocion),
      (v_div_id, v_reparacion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Instalación de Gas
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%gas%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_instalacion),
      (v_div_id, v_remocion),
      (v_div_id, v_reparacion),
      (v_div_id, v_inspeccion)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Instalaciones Eléctricas
  SELECT id INTO v_div_id FROM task_divisions WHERE lower(name) LIKE '%el%ctric%' LIMIT 1;
  IF v_div_id IS NOT NULL THEN
    INSERT INTO task_division_kinds (division_id, kind_id) VALUES
      (v_div_id, v_instalacion),
      (v_div_id, v_remocion),
      (v_div_id, v_reemplazo),
      (v_div_id, v_reparacion),
      (v_div_id, v_inspeccion)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
