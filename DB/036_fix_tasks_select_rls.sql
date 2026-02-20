-- =============================================================================
-- FIX RLS SELECT: catalog.tasks
-- Objetivo: Las tareas de sistema con status = 'draft' NUNCA deben ser visibles
--           para usuarios comunes. Solo los admins pueden verlas en cualquier estado.
--
-- Política actual (INCORRECTA):
--   (is_system = true) OR can_view_org(organization_id, 'tasks.view')
--   → Muestra TODAS las tareas de sistema, sin importar el status.
--
-- Política nueva (CORRECTA):
--   Para tareas de sistema: solo visibles si is_admin() OR status != 'draft'
--   Para tareas de org:     solo visibles si can_view_org(...)
-- =============================================================================

-- 1. Eliminar la política SELECT actual
DROP POLICY IF EXISTS "MIEMBROS VEN TASKS" ON catalog.tasks;

-- 2. Crear la nueva política con la regla de status para tareas de sistema
CREATE POLICY "MIEMBROS VEN TASKS"
ON catalog.tasks
FOR SELECT
TO public
USING (
    (
        -- Tareas de sistema: visibles para admins en cualquier status,
        -- y para usuarios comunes SOLO si no están en borrador y no están eliminadas
        (is_system = true AND (is_admin() OR (status != 'draft' AND is_deleted = false)))
    )
    OR
    (
        -- Tareas propias de la organización: visibles según permiso tasks.view
        (is_system = false AND can_view_org(organization_id, 'tasks.view'::text))
    )
);
