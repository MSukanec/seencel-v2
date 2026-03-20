-- Fix: site_log_types.created_at y updated_at deben ser NOT NULL
-- Fix: site_logs.project_id debe tener FK explícita a projects.projects

-- 1. Hacer NOT NULL los timestamps de site_log_types
-- Primero rellenar NULLs existentes (si hubiera)
UPDATE construction.site_log_types
SET created_at = now()
WHERE created_at IS NULL;

UPDATE construction.site_log_types
SET updated_at = now()
WHERE updated_at IS NULL;

-- Luego aplicar constraint NOT NULL
ALTER TABLE construction.site_log_types
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

-- 2. FK site_logs.project_id → projects.projects.id YA EXISTE (site_logs_project_id_fkey)
-- No action needed.
