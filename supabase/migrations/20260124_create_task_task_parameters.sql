-- ============================================================================
-- Migración: Crear tabla task_task_parameters (tabla de unión)
-- Fecha: 2026-01-24
-- Descripción: Vincula parámetros reutilizables a tareas específicas
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear la tabla de unión
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_task_parameters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  -- Relaciones
  task_id uuid NOT NULL,                 -- Tarea que usa este parámetro
  parameter_id uuid NOT NULL,            -- Parámetro reutilizable
  
  -- Configuración específica para esta tarea
  default_value text NULL,               -- Valor por defecto para ESTA tarea (override)
  is_required boolean NOT NULL DEFAULT true,  -- Si es requerido en ESTA tarea
  "order" integer NULL,                  -- Orden de visualización en ESTA tarea
  
  -- Soft delete
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamp with time zone NULL,
  
  -- Constraints
  CONSTRAINT task_task_parameters_pkey PRIMARY KEY (id),
  CONSTRAINT task_task_parameters_task_id_fkey 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT task_task_parameters_parameter_id_fkey 
    FOREIGN KEY (parameter_id) REFERENCES task_parameters(id) ON DELETE CASCADE,
  CONSTRAINT task_task_parameters_unique UNIQUE (task_id, parameter_id)
) TABLESPACE pg_default;

-- ============================================================================
-- PASO 2: Crear índices
-- ============================================================================

-- Índice para buscar parámetros de una tarea
CREATE INDEX IF NOT EXISTS idx_task_task_parameters_task_id 
ON task_task_parameters (task_id)
WHERE (is_deleted = false);

-- Índice para buscar tareas que usan un parámetro
CREATE INDEX IF NOT EXISTS idx_task_task_parameters_parameter_id 
ON task_task_parameters (parameter_id)
WHERE (is_deleted = false);

-- Índice para soft delete
CREATE INDEX IF NOT EXISTS idx_task_task_parameters_not_deleted 
ON task_task_parameters (is_deleted) 
WHERE (is_deleted = false);

-- ============================================================================
-- PASO 3: Agregar trigger para updated_at
-- ============================================================================

CREATE TRIGGER task_task_parameters_set_updated_at
BEFORE UPDATE ON task_task_parameters
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

-- ============================================================================
-- PASO 4: Habilitar RLS y crear políticas
-- ============================================================================

ALTER TABLE task_task_parameters ENABLE ROW LEVEL SECURITY;

-- Política de lectura: todos los usuarios autenticados pueden ver
CREATE POLICY "TODOS VEN TASK_TASK_PARAMETERS" ON task_task_parameters
    FOR SELECT
    USING (true);

-- Política de mutación: solo admins (tabla de sistema)
CREATE POLICY "ADMINS GESTIONAN TASK_TASK_PARAMETERS" ON task_task_parameters
    FOR ALL
    USING (is_admin());

-- ============================================================================
-- PASO 5: Comentarios de documentación
-- ============================================================================

COMMENT ON TABLE task_task_parameters IS 'Tabla de unión que vincula parámetros reutilizables a tareas específicas. Permite override de valores por tarea.';
COMMENT ON COLUMN task_task_parameters.task_id IS 'Tarea que utiliza este parámetro';
COMMENT ON COLUMN task_task_parameters.parameter_id IS 'Parámetro reutilizable vinculado';
COMMENT ON COLUMN task_task_parameters.default_value IS 'Valor por defecto específico para esta tarea (override del parámetro)';
COMMENT ON COLUMN task_task_parameters.is_required IS 'Si el parámetro es obligatorio en esta tarea';
COMMENT ON COLUMN task_task_parameters."order" IS 'Orden de visualización en el formulario de esta tarea';
