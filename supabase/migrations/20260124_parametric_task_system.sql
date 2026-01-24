-- ============================================================================
-- Migración: Sistema APU de Tareas Paramétricas
-- Fecha: 2026-01-24
-- Descripción: Crea task_elements, task_kind_elements, modifica tasks
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear tabla task_elements (Objetos/Elementos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  name text NOT NULL,           -- "Contrapiso", "Muro"
  slug text NOT NULL,           -- "contrapiso", "muro"
  description text,
  icon text,                    -- Lucide icon name opcional
  "order" integer,
  
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS task_elements_slug_uniq 
ON task_elements (lower(slug)) WHERE (is_deleted = false);

CREATE INDEX IF NOT EXISTS idx_task_elements_not_deleted 
ON task_elements (is_deleted) WHERE (is_deleted = false);

-- Trigger updated_at
CREATE TRIGGER task_elements_set_updated_at
BEFORE UPDATE ON task_elements
FOR EACH ROW EXECUTE FUNCTION set_timestamp();

-- RLS
ALTER TABLE task_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TODOS VEN TASK_ELEMENTS" ON task_elements FOR SELECT USING (true);
CREATE POLICY "ADMINS GESTIONAN TASK_ELEMENTS" ON task_elements FOR ALL USING (is_admin());

COMMENT ON TABLE task_elements IS 'Objetos/Elementos de construcción (contrapiso, muro, etc.)';

-- ============================================================================
-- PASO 2: Crear tabla task_kind_elements (Compatibilidad Kind↔Element)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_kind_elements (
  kind_id uuid NOT NULL REFERENCES task_kind(id) ON DELETE CASCADE,
  element_id uuid NOT NULL REFERENCES task_elements(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (kind_id, element_id)
);

-- RLS
ALTER TABLE task_kind_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TODOS VEN TASK_KIND_ELEMENTS" ON task_kind_elements FOR SELECT USING (true);
CREATE POLICY "ADMINS GESTIONAN TASK_KIND_ELEMENTS" ON task_kind_elements FOR ALL USING (is_admin());

COMMENT ON TABLE task_kind_elements IS 'Matriz de compatibilidad Kind↔Element';

-- ============================================================================
-- PASO 3: Agregar short_code a task_kind
-- ============================================================================

ALTER TABLE task_kind ADD COLUMN IF NOT EXISTS short_code varchar(3);

UPDATE task_kind SET short_code = 'ENS' WHERE code = 'ASSEMBLY';
UPDATE task_kind SET short_code = 'EJE' WHERE code = 'CONSTRUCTION';
UPDATE task_kind SET short_code = 'COM' WHERE code = 'COMPACTION';
UPDATE task_kind SET short_code = 'PRO' WHERE code = 'SUPPLY';
UPDATE task_kind SET short_code = 'EXC' WHERE code = 'EXCAVATION';
UPDATE task_kind SET short_code = 'REM' WHERE code = 'REPLACEMENT';
UPDATE task_kind SET short_code = 'DEM' WHERE code = 'DEMOLITION';
UPDATE task_kind SET short_code = 'INS' WHERE code = 'INSTALLATION';
UPDATE task_kind SET short_code = 'LIM' WHERE code = 'CLEANING';
UPDATE task_kind SET short_code = 'RET' WHERE code = 'REMOVAL';
UPDATE task_kind SET short_code = 'PTG' WHERE code = 'PROTECTION';
UPDATE task_kind SET short_code = 'COL' WHERE code = 'PLACEMENT';
UPDATE task_kind SET short_code = 'INP' WHERE code = 'INSPECTION';
UPDATE task_kind SET short_code = 'ALQ' WHERE code = 'RENTAL';
UPDATE task_kind SET short_code = 'REP' WHERE code = 'MAINTENANCE';

-- ============================================================================
-- PASO 4: Modificar tabla tasks para soporte paramétrico
-- ============================================================================

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_kind_id uuid REFERENCES task_kind(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_element_id uuid REFERENCES task_elements(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_parametric boolean NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parameter_values jsonb DEFAULT '{}';

-- Índice para evitar duplicados paramétricos
CREATE UNIQUE INDEX IF NOT EXISTS tasks_parametric_signature_uniq
ON tasks (task_kind_id, task_element_id, task_division_id, parameter_values)
WHERE (is_parametric = true AND is_deleted = false);

-- ============================================================================
-- PASO 5: Poblar elementos iniciales
-- ============================================================================

INSERT INTO task_elements (name, slug, description, "order") VALUES
-- Estructuras horizontales
('Contrapiso', 'contrapiso', 'Base de hormigón sobre terreno o losa', 1),
('Carpeta de nivelación', 'carpeta-nivelacion', 'Capa final de mortero para nivelar', 2),
('Losa', 'losa', 'Elemento estructural horizontal', 3),
('Piso flotante', 'piso-flotante', 'Piso de madera/laminado sobre foam', 4),
('Cerámico', 'ceramico', 'Revestimiento cerámico', 5),
('Porcelanato', 'porcelanato', 'Revestimiento de porcelanato', 6),

-- Estructuras verticales
('Muro', 'muro', 'Pared portante de ladrillos/bloques', 10),
('Tabique', 'tabique', 'Pared no portante', 11),
('Muro de hormigón', 'muro-hormigon', 'Muro estructural de hormigón armado', 12),
('Columna', 'columna', 'Elemento estructural vertical', 13),
('Viga', 'viga', 'Elemento estructural horizontal', 14),

-- Revestimientos
('Revoque grueso', 'revoque-grueso', 'Primera capa de mortero', 20),
('Revoque fino', 'revoque-fino', 'Capa final de terminación', 21),
('Pintura', 'pintura', 'Aplicación de pintura', 22),
('Revestimiento', 'revestimiento', 'Revestimiento genérico', 23),

-- Techos
('Cielorraso', 'cielorraso', 'Superficie inferior del techo', 30),
('Cielorraso suspendido', 'cielorraso-suspendido', 'Cielorraso desmontable', 31),
('Cubierta', 'cubierta', 'Techo exterior', 32),
('Membrana', 'membrana', 'Impermeabilización de techos', 33),

-- Carpinterías
('Puerta', 'puerta', 'Abertura de paso', 40),
('Ventana', 'ventana', 'Abertura de iluminación/ventilación', 41),
('Reja', 'reja', 'Protección metálica', 42),
('Portón', 'porton', 'Puerta grande/vehicular', 43),
('Baranda', 'baranda', 'Protección de escaleras/balcones', 44),

-- Instalaciones sanitarias
('Cañería de agua', 'caneria-agua', 'Tubería de agua potable', 50),
('Cañería de desagüe', 'caneria-desague', 'Tubería de desagües', 51),
('Inodoro', 'inodoro', 'Artefacto sanitario', 52),
('Lavatorio', 'lavatorio', 'Pileta de baño', 53),
('Ducha', 'ducha', 'Box o receptáculo de ducha', 54),
('Bañera', 'banera', 'Bañera de baño', 55),
('Grifo', 'grifo', 'Canilla/grifo', 56),
('Tanque de agua', 'tanque-agua', 'Depósito de agua', 57),
('Calefón', 'calefon', 'Calentador de agua a gas', 58),
('Termotanque', 'termotanque', 'Calentador de agua eléctrico', 59),

-- Instalaciones eléctricas
('Tablero eléctrico', 'tablero-electrico', 'Panel de distribución', 60),
('Cableado', 'cableado', 'Instalación de cables', 61),
('Tomacorriente', 'tomacorriente', 'Enchufe de pared', 62),
('Interruptor', 'interruptor', 'Llave de luz', 63),
('Luminaria', 'luminaria', 'Artefacto de iluminación', 64),

-- Climatización
('Aire acondicionado', 'aire-acondicionado', 'Equipo de climatización', 70),
('Calefacción', 'calefaccion', 'Sistema de calefacción', 71),
('Radiador', 'radiador', 'Elemento calefactor', 72),

-- Exteriores
('Vereda', 'vereda', 'Camino peatonal exterior', 80),
('Cordón', 'cordon', 'Bordillo/cordón cuneta', 81),
('Cerco', 'cerco', 'Perímetro/medianera', 82),
('Jardín', 'jardin', 'Espacio verde', 83),

-- Otros
('Escalera', 'escalera', 'Elemento de circulación vertical', 90),
('Mesada', 'mesada', 'Superficie de trabajo cocina/baño', 91),
('Mueble', 'mueble', 'Mobiliario fijo o móvil', 92),
('Zócalo', 'zocalo', 'Rodapié/guardapolvo', 93)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- PASO 6: Poblar matriz de compatibilidad Kind↔Element
-- ============================================================================

-- Obtener IDs de los kinds
DO $$
DECLARE
  v_ejecucion uuid := (SELECT id FROM task_kind WHERE code = 'CONSTRUCTION');
  v_demolicion uuid := (SELECT id FROM task_kind WHERE code = 'DEMOLITION');
  v_instalacion uuid := (SELECT id FROM task_kind WHERE code = 'INSTALLATION');
  v_reparacion uuid := (SELECT id FROM task_kind WHERE code = 'MAINTENANCE');
  v_colocacion uuid := (SELECT id FROM task_kind WHERE code = 'PLACEMENT');
  v_remocion uuid := (SELECT id FROM task_kind WHERE code = 'REMOVAL');
  v_reemplazo uuid := (SELECT id FROM task_kind WHERE code = 'REPLACEMENT');
  v_limpieza uuid := (SELECT id FROM task_kind WHERE code = 'CLEANING');
  v_proteccion uuid := (SELECT id FROM task_kind WHERE code = 'PROTECTION');
BEGIN
  -- EJECUCIÓN: Elementos que se construyen
  INSERT INTO task_kind_elements (kind_id, element_id)
  SELECT v_ejecucion, id FROM task_elements 
  WHERE slug IN ('contrapiso', 'carpeta-nivelacion', 'losa', 'muro', 'tabique', 
                 'muro-hormigon', 'columna', 'viga', 'revoque-grueso', 'revoque-fino',
                 'cielorraso', 'cubierta', 'vereda', 'cordon', 'cerco', 'escalera')
  ON CONFLICT DO NOTHING;

  -- DEMOLICIÓN: Elementos que se pueden demoler
  INSERT INTO task_kind_elements (kind_id, element_id)
  SELECT v_demolicion, id FROM task_elements 
  WHERE slug IN ('contrapiso', 'carpeta-nivelacion', 'losa', 'muro', 'tabique',
                 'muro-hormigon', 'columna', 'viga', 'revoque-grueso', 'revoque-fino',
                 'cielorraso', 'cielorraso-suspendido', 'cubierta', 'vereda', 'cerco', 'escalera')
  ON CONFLICT DO NOTHING;

  -- INSTALACIÓN: Elementos que se instalan
  INSERT INTO task_kind_elements (kind_id, element_id)
  SELECT v_instalacion, id FROM task_elements 
  WHERE slug IN ('piso-flotante', 'cielorraso-suspendido', 'puerta', 'ventana', 'reja', 'porton', 'baranda',
                 'caneria-agua', 'caneria-desague', 'inodoro', 'lavatorio', 'ducha', 'banera', 'grifo',
                 'tanque-agua', 'calefon', 'termotanque', 'tablero-electrico', 'cableado', 'tomacorriente',
                 'interruptor', 'luminaria', 'aire-acondicionado', 'calefaccion', 'radiador', 'mesada', 'mueble')
  ON CONFLICT DO NOTHING;

  -- COLOCACIÓN: Elementos que se colocan/aplican
  INSERT INTO task_kind_elements (kind_id, element_id)
  SELECT v_colocacion, id FROM task_elements 
  WHERE slug IN ('ceramico', 'porcelanato', 'pintura', 'revestimiento', 'membrana', 'zocalo')
  ON CONFLICT DO NOTHING;

  -- REPARACIÓN: La mayoría de elementos pueden repararse
  INSERT INTO task_kind_elements (kind_id, element_id)
  SELECT v_reparacion, id FROM task_elements 
  WHERE slug NOT IN ('jardin')  -- Casi todo se puede reparar
  ON CONFLICT DO NOTHING;

  -- REMOCIÓN: Elementos que se pueden retirar
  INSERT INTO task_kind_elements (kind_id, element_id)
  SELECT v_remocion, id FROM task_elements 
  WHERE slug IN ('piso-flotante', 'cielorraso-suspendido', 'puerta', 'ventana', 'reja', 'porton', 'baranda',
                 'inodoro', 'lavatorio', 'ducha', 'banera', 'grifo', 'calefon', 'termotanque',
                 'luminaria', 'aire-acondicionado', 'calefaccion', 'radiador', 'mesada', 'mueble', 'zocalo')
  ON CONFLICT DO NOTHING;

  -- REEMPLAZO: Elementos que se reemplazan (retiro + colocación nuevo)
  INSERT INTO task_kind_elements (kind_id, element_id)
  SELECT v_reemplazo, id FROM task_elements 
  WHERE slug IN ('puerta', 'ventana', 'grifo', 'inodoro', 'lavatorio', 'luminaria', 
                 'tomacorriente', 'interruptor', 'calefon', 'termotanque')
  ON CONFLICT DO NOTHING;

  -- LIMPIEZA/PREPARACIÓN: Superficies
  INSERT INTO task_kind_elements (kind_id, element_id)
  SELECT v_limpieza, id FROM task_elements 
  WHERE slug IN ('losa', 'muro', 'cielorraso', 'cubierta', 'vereda')
  ON CONFLICT DO NOTHING;

  -- PROTECCIÓN: Elementos que se protegen
  INSERT INTO task_kind_elements (kind_id, element_id)
  SELECT v_proteccion, id FROM task_elements 
  WHERE slug IN ('puerta', 'ventana', 'piso-flotante', 'mesada', 'mueble', 'ceramico', 'porcelanato')
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================================================
-- PASO 7: Comentarios de documentación
-- ============================================================================

COMMENT ON COLUMN tasks.task_kind_id IS 'Tipo de acción (Ejecución, Instalación, etc.)';
COMMENT ON COLUMN tasks.task_element_id IS 'Objeto/Elemento (Contrapiso, Muro, etc.)';
COMMENT ON COLUMN tasks.is_parametric IS 'true = tarea paramétrica de sistema, false = tarea propia';
COMMENT ON COLUMN tasks.parameter_values IS 'Valores de parámetros seleccionados (JSONB)';
