-- ============================================================================
-- Migración: Fix RLS policies para permitir tareas paramétricas/sistema
-- Fecha: 2026-01-24
-- Descripción: Actualiza políticas RLS para que admins puedan crear tareas de sistema
-- ============================================================================

-- ============================================================================
-- PASO 1: DROP políticas existentes de INSERT y UPDATE
-- ============================================================================

DROP POLICY IF EXISTS "MIEMBROS CREAN TASKS" ON tasks;
DROP POLICY IF EXISTS "MIEMBROS ACTUALIZAN TASKS" ON tasks;

-- ============================================================================
-- PASO 2: Crear nuevas políticas con soporte para tareas de sistema
-- ============================================================================

-- INSERT: Miembros crean tareas de org, Admins crean tareas de sistema
CREATE POLICY "MIEMBROS Y ADMINS CREAN TASKS" ON tasks
FOR INSERT
TO public
WITH CHECK (
  -- Miembros crean tareas de organización
  ((is_system = false) AND can_mutate_org(organization_id, 'tasks.manage'::text))
  OR
  -- Admins crean tareas de sistema (incluye paramétricas)
  ((is_system = true) AND is_admin())
);

-- UPDATE: Miembros actualizan tareas de org, Admins actualizan tareas de sistema
CREATE POLICY "MIEMBROS Y ADMINS ACTUALIZAN TASKS" ON tasks
FOR UPDATE
TO public
USING (
  -- Miembros pueden actualizar tareas de su organización
  ((is_system = false) AND can_mutate_org(organization_id, 'tasks.manage'::text))
  OR
  -- Admins pueden actualizar tareas de sistema
  ((is_system = true) AND is_admin())
);

-- ============================================================================
-- PASO 3: Asegurar que DELETE también funcione para admins
-- ============================================================================

DROP POLICY IF EXISTS "MIEMBROS ELIMINAN TASKS" ON tasks;

CREATE POLICY "MIEMBROS Y ADMINS ELIMINAN TASKS" ON tasks
FOR DELETE
TO public
USING (
  -- Miembros pueden eliminar tareas de su organización
  ((is_system = false) AND can_mutate_org(organization_id, 'tasks.manage'::text))
  OR
  -- Admins pueden eliminar tareas de sistema
  ((is_system = true) AND is_admin())
);

-- ============================================================================
-- NOTA: La política SELECT existente "TODOS VEN TASKS" debería seguir funcionando
-- ============================================================================
