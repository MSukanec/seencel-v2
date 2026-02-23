-- ============================================================================
-- 065: Crear tabla catalog.task_system_parameter_options
-- ============================================================================
-- Propósito: Vincular opciones específicas de un parámetro a un sistema constructivo.
-- Semántica: Si (system_id, parameter_id) NO tiene registros → se muestran TODAS las opciones.
--            Si tiene al menos 1 registro → solo se muestran las opciones vinculadas.
-- Ejemplo:
--   Sistema "Mampostería cerámica hueca" + Parámetro "Tipo de Ladrillos"
--   → Solo muestra: LCH08, LCH12, LCH18 (no ladrillo común ni bloques)
-- ============================================================================

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS catalog.task_system_parameter_options (
    system_id       uuid NOT NULL REFERENCES catalog.task_construction_systems(id) ON DELETE CASCADE,
    parameter_id    uuid NOT NULL REFERENCES catalog.task_parameters(id) ON DELETE CASCADE,
    option_id       uuid NOT NULL REFERENCES catalog.task_parameter_options(id) ON DELETE CASCADE,
    created_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (system_id, parameter_id, option_id)
);

-- 2. Comentario descriptivo
COMMENT ON TABLE catalog.task_system_parameter_options IS 
    'Pivot: qué opciones de un parámetro aplican a un sistema constructivo específico. '
    'Opt-in: si no hay registros para (system_id, parameter_id), se muestran todas las opciones.';

-- 3. Índice para queries rápidas por sistema + parámetro
CREATE INDEX IF NOT EXISTS idx_tspo_system_parameter 
    ON catalog.task_system_parameter_options (system_id, parameter_id);

-- 4. Habilitar RLS (mismo patrón que task_system_parameters, task_element_systems, etc.)
ALTER TABLE catalog.task_system_parameter_options ENABLE ROW LEVEL SECURITY;

-- SELECT: cualquier usuario autenticado puede leer (catálogo global)
CREATE POLICY "AUTENTICADOS VEN SYSTEM_PARAMETER_OPTIONS"
    ON catalog.task_system_parameter_options
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: solo admins del sistema
CREATE POLICY "ADMIN CREA SYSTEM_PARAMETER_OPTIONS"
    ON catalog.task_system_parameter_options
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- DELETE: solo admins del sistema
CREATE POLICY "ADMIN ELIMINA SYSTEM_PARAMETER_OPTIONS"
    ON catalog.task_system_parameter_options
    FOR DELETE
    TO authenticated
    USING (is_admin());

-- 5. Verificación
SELECT 
    'task_system_parameter_options' AS tabla,
    (SELECT count(*) FROM pg_policies WHERE tablename = 'task_system_parameter_options' AND schemaname = 'catalog') AS policies_count;
