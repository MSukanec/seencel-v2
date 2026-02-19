-- ============================================================================
-- Migration: Add `status` column to `tasks` and `task_recipes`
-- File: DB/028_task_and_recipe_status.sql
-- Description:
--   Adds a `task_catalog_status` enum type and a `status` column to both
--   `tasks` and `task_recipes` tables. Recreates the dependent views
--   `tasks_view` and `task_recipes_view` to expose the new column.
--   The `task_costs_view` does NOT need changes (it doesn't select from views).
-- ============================================================================

-- ─── Step 1: Create the enum type ───────────────────────────────────────────

CREATE TYPE task_catalog_status AS ENUM (
    'draft',       -- En borrador: incompleta, no visible al seleccionar
    'active',      -- Activa: lista para usar en presupuestos y obras
    'archived'     -- Archivada: fue válida, ya no se usa
);

-- ─── Step 2: Add `status` to `tasks` ────────────────────────────────────────

ALTER TABLE tasks
    ADD COLUMN status task_catalog_status NOT NULL DEFAULT 'draft';

-- Migrate existing data: tasks that are is_published = true → 'active'
UPDATE tasks
SET status = 'active'
WHERE is_published = true AND is_deleted = false;

-- ─── Step 3: Add `status` to `task_recipes` ─────────────────────────────────

ALTER TABLE task_recipes
    ADD COLUMN status task_catalog_status NOT NULL DEFAULT 'draft';

-- Migrate existing data: all existing non-deleted recipes default to 'active'
-- (they were functional before, so we assume they are complete)
UPDATE task_recipes
SET status = 'active'
WHERE is_deleted = false;

-- ─── Step 4: DROP + CREATE `tasks_view` ─────────────────────────────────────

DROP VIEW IF EXISTS tasks_view;

CREATE VIEW tasks_view AS
SELECT
    t.id,
    t.code,
    t.name,
    t.custom_name,
    t.description,
    t.is_system,
    t.is_published,
    t.status,
    t.is_deleted,
    t.organization_id,
    t.unit_id,
    t.task_division_id,
    t.task_action_id,
    t.task_element_id,
    t.is_parametric,
    t.parameter_values,
    t.import_batch_id,
    t.created_at,
    t.updated_at,
    t.created_by,
    t.updated_by,
    u.name AS unit_name,
    u.symbol AS unit_symbol,
    d.name AS division_name,
    ta.name AS action_name,
    ta.short_code AS action_short_code,
    te.name AS element_name
FROM tasks t
LEFT JOIN units u ON u.id = t.unit_id
LEFT JOIN task_divisions d ON d.id = t.task_division_id
LEFT JOIN task_actions ta ON ta.id = t.task_action_id
LEFT JOIN task_elements te ON te.id = t.task_element_id;

-- ─── Step 5: DROP + CREATE `task_recipes_view` ──────────────────────────────

DROP VIEW IF EXISTS task_recipes_view;

CREATE VIEW task_recipes_view AS
SELECT
    tr.id,
    tr.task_id,
    tr.organization_id,
    tr.name,
    tr.is_public,
    tr.region,
    tr.rating_avg,
    tr.rating_count,
    tr.usage_count,
    tr.created_at,
    tr.updated_at,
    tr.is_deleted,
    tr.import_batch_id,
    tr.status,
    t.name AS task_name,
    t.custom_name AS task_custom_name,
    COALESCE(t.custom_name, t.name) AS task_display_name,
    td.name AS division_name,
    u.name AS unit_name,
    o.name AS org_name,
    (
        (SELECT count(*) FROM task_recipe_materials trm WHERE trm.recipe_id = tr.id)
        + (SELECT count(*) FROM task_recipe_labor trl WHERE trl.recipe_id = tr.id)
    ) AS item_count
FROM task_recipes tr
LEFT JOIN tasks t ON t.id = tr.task_id
LEFT JOIN task_divisions td ON td.id = t.task_division_id
LEFT JOIN units u ON u.id = t.unit_id
LEFT JOIN organizations o ON o.id = tr.organization_id
WHERE tr.is_deleted = false;

-- ─── Notes ───────────────────────────────────────────────────────────────────
-- After running this migration:
-- 1. Run `npm run db:schema` to regenerate DB/SCHEMA.md
-- 2. Update TABLES.md files manually
-- 3. The frontend filter in tasks_view queries should filter by
--    status = 'active' when showing tasks for selection in forms
-- ============================================================================
