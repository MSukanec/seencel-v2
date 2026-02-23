-- ============================================================================
-- 065b: Fix permisos para catalog.task_system_parameter_options
-- ============================================================================
-- La tabla fue creada con RLS pero sin GRANT a los roles de Supabase.
-- Esto causa error 42501 (permission denied).
-- ============================================================================

-- Otorgar permisos de tabla al rol authenticated
GRANT SELECT, INSERT, DELETE ON TABLE catalog.task_system_parameter_options TO authenticated;

-- Otorgar permisos al service_role (para server-side operations)
GRANT ALL ON TABLE catalog.task_system_parameter_options TO service_role;

-- Verificación
SELECT 
    schemaname, tablename, 
    (SELECT count(*) FROM pg_policies WHERE tablename = 'task_system_parameter_options' AND schemaname = 'catalog') AS policies_count
FROM pg_tables 
WHERE tablename = 'task_system_parameter_options' AND schemaname = 'catalog';
