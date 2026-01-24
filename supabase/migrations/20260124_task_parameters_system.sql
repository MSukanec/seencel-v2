-- ============================================================================
-- Migración: Sistema de Parámetros para Tareas Paramétricas
-- Fecha: 2026-01-24
-- Descripción: Vincula parámetros a elementos y pobla datos iniciales
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear tabla task_element_parameters
-- Vincula parámetros a elementos (Muro tiene tipo_ladrillo, espesor, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_element_parameters (
  element_id uuid NOT NULL REFERENCES task_elements(id) ON DELETE CASCADE,
  parameter_id uuid NOT NULL REFERENCES task_parameters(id) ON DELETE CASCADE,
  "order" integer DEFAULT 0,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (element_id, parameter_id)
);

-- RLS
ALTER TABLE task_element_parameters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TODOS VEN TASK_ELEMENT_PARAMETERS" ON task_element_parameters FOR SELECT USING (true);
CREATE POLICY "ADMINS GESTIONAN TASK_ELEMENT_PARAMETERS" ON task_element_parameters FOR ALL USING (is_admin());

COMMENT ON TABLE task_element_parameters IS 'Vincula parámetros a elementos. Ej: Muro tiene tipo_ladrillo, espesor';

-- ============================================================================
-- PASO 2: Agregar short_code a task_parameter_options para generación de código
-- ============================================================================

ALTER TABLE task_parameter_options ADD COLUMN IF NOT EXISTS short_code varchar(4);

COMMENT ON COLUMN task_parameter_options.short_code IS 'Código corto para generar código de tarea (ej: LH = ladrillo hueco)';

-- ============================================================================
-- PASO 3: Crear parámetros globales
-- ============================================================================

-- Tipo de Ladrillo
INSERT INTO task_parameters (slug, label, description, type, is_required, "order")
VALUES ('tipo_ladrillo', 'Tipo de Ladrillo', 'Material del ladrillo para mamposterías', 'select', true, 1)
ON CONFLICT DO NOTHING;

-- Espesor de Muro
INSERT INTO task_parameters (slug, label, description, type, is_required, "order")
VALUES ('espesor_muro', 'Espesor', 'Espesor del muro en metros', 'select', true, 2)
ON CONFLICT DO NOTHING;

-- Espesor de Contrapiso/Carpeta
INSERT INTO task_parameters (slug, label, description, type, is_required, "order")
VALUES ('espesor_contrapiso', 'Espesor', 'Espesor del contrapiso en centímetros', 'select', true, 1)
ON CONFLICT DO NOTHING;

-- Tipo de Terminación
INSERT INTO task_parameters (slug, label, description, type, is_required, "order")
VALUES ('tipo_terminacion', 'Terminación', 'Tipo de terminación superficial', 'select', false, 2)
ON CONFLICT DO NOTHING;

-- Tipo de Revoque
INSERT INTO task_parameters (slug, label, description, type, is_required, "order")
VALUES ('tipo_revoque', 'Tipo de Revoque', 'Material y técnica de revoque', 'select', true, 1)
ON CONFLICT DO NOTHING;

-- Altura de Cielorraso
INSERT INTO task_parameters (slug, label, description, type, is_required, "order")
VALUES ('altura_cielorraso', 'Altura', 'Altura del cielorraso', 'select', false, 1)
ON CONFLICT DO NOTHING;

-- Tipo de Cielorraso
INSERT INTO task_parameters (slug, label, description, type, is_required, "order")
VALUES ('tipo_cielorraso', 'Tipo', 'Material del cielorraso', 'select', true, 2)
ON CONFLICT DO NOTHING;

-- Diámetro Cañería
INSERT INTO task_parameters (slug, label, description, type, is_required, "order")
VALUES ('diametro_caneria', 'Diámetro', 'Diámetro de la cañería', 'select', true, 1)
ON CONFLICT DO NOTHING;

-- Material Cañería
INSERT INTO task_parameters (slug, label, description, type, is_required, "order")
VALUES ('material_caneria', 'Material', 'Material de la cañería', 'select', true, 2)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PASO 4: Poblar opciones para cada parámetro
-- ============================================================================

DO $$
DECLARE
  v_param_id uuid;
BEGIN

  -- ========================================
  -- TIPO DE LADRILLO
  -- ========================================
  SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'tipo_ladrillo' LIMIT 1;
  IF v_param_id IS NOT NULL THEN
    INSERT INTO task_parameter_options (parameter_id, name, label, short_code, "order")
    VALUES 
      (v_param_id, 'ladrillo_comun', 'Ladrillo común', 'LC', 1),
      (v_param_id, 'ladrillo_hueco', 'Ladrillo hueco', 'LH', 2),
      (v_param_id, 'ladrillo_ceramico', 'Ladrillo cerámico', 'LCE', 3),
      (v_param_id, 'bloque_hormigon', 'Bloque de hormigón', 'BH', 4),
      (v_param_id, 'bloque_celular', 'Bloque celular (RETAK)', 'BC', 5)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- ESPESOR DE MURO
  -- ========================================
  SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'espesor_muro' LIMIT 1;
  IF v_param_id IS NOT NULL THEN
    INSERT INTO task_parameter_options (parameter_id, name, label, value, short_code, "order")
    VALUES 
      (v_param_id, '8cm', '8 cm', '0.08', '08', 1),
      (v_param_id, '10cm', '10 cm', '0.10', '10', 2),
      (v_param_id, '15cm', '15 cm', '0.15', '15', 3),
      (v_param_id, '20cm', '20 cm', '0.20', '20', 4),
      (v_param_id, '30cm', '30 cm', '0.30', '30', 5)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- ESPESOR DE CONTRAPISO
  -- ========================================
  SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'espesor_contrapiso' LIMIT 1;
  IF v_param_id IS NOT NULL THEN
    INSERT INTO task_parameter_options (parameter_id, name, label, value, short_code, "order")
    VALUES 
      (v_param_id, '5cm', '5 cm', '0.05', '05', 1),
      (v_param_id, '8cm', '8 cm', '0.08', '08', 2),
      (v_param_id, '10cm', '10 cm', '0.10', '10', 3),
      (v_param_id, '12cm', '12 cm', '0.12', '12', 4),
      (v_param_id, '15cm', '15 cm', '0.15', '15', 5)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- TIPO DE TERMINACIÓN
  -- ========================================
  SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'tipo_terminacion' LIMIT 1;
  IF v_param_id IS NOT NULL THEN
    INSERT INTO task_parameter_options (parameter_id, name, label, short_code, "order")
    VALUES 
      (v_param_id, 'alisado', 'Alisado', 'AL', 1),
      (v_param_id, 'fratachado', 'Fratachado', 'FR', 2),
      (v_param_id, 'rustico', 'Rústico', 'RU', 3)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- TIPO DE REVOQUE
  -- ========================================
  SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'tipo_revoque' LIMIT 1;
  IF v_param_id IS NOT NULL THEN
    INSERT INTO task_parameter_options (parameter_id, name, label, short_code, "order")
    VALUES 
      (v_param_id, 'cemento', 'A la cal y cemento', 'CC', 1),
      (v_param_id, 'yeso', 'Yeso', 'YE', 2),
      (v_param_id, 'proyectado', 'Proyectado', 'PR', 3)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- TIPO DE CIELORRASO
  -- ========================================
  SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'tipo_cielorraso' LIMIT 1;
  IF v_param_id IS NOT NULL THEN
    INSERT INTO task_parameter_options (parameter_id, name, label, short_code, "order")
    VALUES 
      (v_param_id, 'durlock', 'Durlock/Yeso', 'DU', 1),
      (v_param_id, 'madera', 'Madera/MDF', 'MA', 2),
      (v_param_id, 'pvc', 'PVC', 'PV', 3),
      (v_param_id, 'aplicado', 'Aplicado directo', 'AP', 4)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- DIÁMETRO CAÑERÍA
  -- ========================================
  SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'diametro_caneria' LIMIT 1;
  IF v_param_id IS NOT NULL THEN
    INSERT INTO task_parameter_options (parameter_id, name, label, value, short_code, "order")
    VALUES 
      (v_param_id, '13mm', '1/2" (13mm)', '13', '13', 1),
      (v_param_id, '19mm', '3/4" (19mm)', '19', '19', 2),
      (v_param_id, '25mm', '1" (25mm)', '25', '25', 3),
      (v_param_id, '32mm', '1 1/4" (32mm)', '32', '32', 4),
      (v_param_id, '40mm', '40mm', '40', '40', 5),
      (v_param_id, '50mm', '50mm', '50', '50', 6),
      (v_param_id, '63mm', '63mm', '63', '63', 7),
      (v_param_id, '110mm', '110mm', '110', '110', 8)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- MATERIAL CAÑERÍA
  -- ========================================
  SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'material_caneria' LIMIT 1;
  IF v_param_id IS NOT NULL THEN
    INSERT INTO task_parameter_options (parameter_id, name, label, short_code, "order")
    VALUES 
      (v_param_id, 'ppr', 'Termofusión (PPR)', 'TF', 1),
      (v_param_id, 'pvc', 'PVC', 'PV', 2),
      (v_param_id, 'cobre', 'Cobre', 'CU', 3),
      (v_param_id, 'hierro', 'Hierro galvanizado', 'HG', 4)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- ============================================================================
-- PASO 5: Vincular parámetros a elementos
-- ============================================================================

DO $$
DECLARE
  v_elem_id uuid;
  v_param_id uuid;
BEGIN

  -- ========================================
  -- MURO → tipo_ladrillo, espesor_muro
  -- ========================================
  SELECT id INTO v_elem_id FROM task_elements WHERE slug = 'muro' LIMIT 1;
  IF v_elem_id IS NOT NULL THEN
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'tipo_ladrillo' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 1, true)
      ON CONFLICT DO NOTHING;
    END IF;
    
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'espesor_muro' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 2, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ========================================
  -- TABIQUE → tipo_ladrillo, espesor_muro
  -- ========================================
  SELECT id INTO v_elem_id FROM task_elements WHERE slug = 'tabique' LIMIT 1;
  IF v_elem_id IS NOT NULL THEN
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'tipo_ladrillo' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 1, true)
      ON CONFLICT DO NOTHING;
    END IF;
    
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'espesor_muro' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 2, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ========================================
  -- CONTRAPISO → espesor_contrapiso
  -- ========================================
  SELECT id INTO v_elem_id FROM task_elements WHERE slug = 'contrapiso' LIMIT 1;
  IF v_elem_id IS NOT NULL THEN
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'espesor_contrapiso' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 1, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ========================================
  -- CARPETA → espesor_contrapiso, tipo_terminacion
  -- ========================================
  SELECT id INTO v_elem_id FROM task_elements WHERE slug = 'carpeta-nivelacion' LIMIT 1;
  IF v_elem_id IS NOT NULL THEN
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'espesor_contrapiso' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 1, true)
      ON CONFLICT DO NOTHING;
    END IF;
    
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'tipo_terminacion' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 2, false)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ========================================
  -- REVOQUE GRUESO/FINO → tipo_revoque
  -- ========================================
  SELECT id INTO v_elem_id FROM task_elements WHERE slug = 'revoque-grueso' LIMIT 1;
  IF v_elem_id IS NOT NULL THEN
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'tipo_revoque' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 1, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  SELECT id INTO v_elem_id FROM task_elements WHERE slug = 'revoque-fino' LIMIT 1;
  IF v_elem_id IS NOT NULL THEN
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'tipo_revoque' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 1, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ========================================
  -- CIELORRASO → tipo_cielorraso
  -- ========================================
  SELECT id INTO v_elem_id FROM task_elements WHERE slug = 'cielorraso' LIMIT 1;
  IF v_elem_id IS NOT NULL THEN
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'tipo_cielorraso' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 1, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ========================================
  -- CAÑERÍAS → diametro, material
  -- ========================================
  SELECT id INTO v_elem_id FROM task_elements WHERE slug = 'caneria-agua' LIMIT 1;
  IF v_elem_id IS NOT NULL THEN
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'diametro_caneria' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 1, true)
      ON CONFLICT DO NOTHING;
    END IF;
    
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'material_caneria' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 2, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  SELECT id INTO v_elem_id FROM task_elements WHERE slug = 'caneria-desague' LIMIT 1;
  IF v_elem_id IS NOT NULL THEN
    SELECT id INTO v_param_id FROM task_parameters WHERE slug = 'diametro_caneria' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
      INSERT INTO task_element_parameters (element_id, parameter_id, "order", is_required)
      VALUES (v_elem_id, v_param_id, 1, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

END $$;
