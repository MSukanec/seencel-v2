-- ==========================================
-- 032 — CREATE task_system_parameters
-- ==========================================
-- Contexto:
--   El diseño original tenía `task_element_parameters` (parámetros vinculados
--   a elementos físicos). Esto es conceptualmente incorrecto según el modelo
--   del Catalog Atlas:
--
--   Los parámetros que generan variantes de tareas pertenecen al SISTEMA
--   CONSTRUCTIVO, no al elemento físico.
--
--   Ejemplo:
--     ❌ Muro → tiene parámetro "espesor"  (incorrecto: todos los muros?)
--     ✅ Mampostería cerámica → tiene parámetro "espesor" (correcto: ese sistema específico)
--
--   Ver: .agent/flows/catalog-atlas/design-decisions.md — Decisión D1
--
-- CAMBIOS EN ESTE SCRIPT:
--   1. Crear catalog.task_system_parameters (system_id, parameter_id)
--   2. Agregar task_construction_system_id a catalog.tasks
--   4. NO se elimina task_element_parameters (preservar datos existentes)
--
-- Post-ejecución: ejecutar `npm run db:schema` para regenerar DB/schema/
-- ==========================================

-- ==========================================
-- 1. CREAR catalog.task_system_parameters
-- ==========================================

CREATE TABLE IF NOT EXISTS catalog.task_system_parameters (
    system_id    uuid        NOT NULL,
    parameter_id uuid        NOT NULL,
    "order"      integer     NULL DEFAULT 0,
    is_required  boolean     NULL DEFAULT true,
    created_at   timestamptz NULL DEFAULT now(),

    CONSTRAINT task_system_parameters_pkey
        PRIMARY KEY (system_id, parameter_id),

    CONSTRAINT task_system_parameters_system_id_fkey
        FOREIGN KEY (system_id)
        REFERENCES catalog.task_construction_systems (id)
        ON DELETE CASCADE,

    CONSTRAINT task_system_parameters_parameter_id_fkey
        FOREIGN KEY (parameter_id)
        REFERENCES catalog.task_parameters (id)
        ON DELETE CASCADE
);

GRANT ALL ON catalog.task_system_parameters TO authenticated, service_role;

COMMENT ON TABLE catalog.task_system_parameters IS
    'Vincula parámetros de variantes al sistema constructivo (no al elemento). '
    'Reemplaza conceptualmente a task_element_parameters. '
    'Ver: .agent/flows/catalog-atlas/design-decisions.md — Decisión D1';

-- ==========================================
-- 2. AGREGAR task_construction_system_id A catalog.tasks
-- ==========================================
-- GAP identificado en el Catalog Atlas: las tareas no tienen FK explícita
-- al sistema constructivo al que pertenecen.

ALTER TABLE catalog.tasks
    ADD COLUMN IF NOT EXISTS task_construction_system_id uuid NULL
        REFERENCES catalog.task_construction_systems (id)
        ON DELETE SET NULL;

COMMENT ON COLUMN catalog.tasks.task_construction_system_id IS
    'Sistema constructivo de la tarea. '
    'Determina qué parámetros aplican según catalog.task_system_parameters.';

-- ==========================================
-- 3. ÍNDICES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_task_system_parameters_system_id
    ON catalog.task_system_parameters (system_id);

CREATE INDEX IF NOT EXISTS idx_task_system_parameters_parameter_id
    ON catalog.task_system_parameters (parameter_id);

CREATE INDEX IF NOT EXISTS idx_tasks_construction_system_id
    ON catalog.tasks (task_construction_system_id)
    WHERE task_construction_system_id IS NOT NULL;

-- ==========================================
-- 4. VERIFICACIÓN
-- ==========================================

SELECT
    'task_system_parameters'            AS tabla,
    COUNT(*)                            AS filas
FROM catalog.task_system_parameters

UNION ALL

SELECT
    'task_element_parameters (legacy)'  AS tabla,
    COUNT(*)                            AS filas
FROM catalog.task_element_parameters

UNION ALL

SELECT
    'tasks con system_id asignado'      AS tabla,
    COUNT(*)                            AS filas
FROM catalog.tasks
WHERE task_construction_system_id IS NOT NULL;
