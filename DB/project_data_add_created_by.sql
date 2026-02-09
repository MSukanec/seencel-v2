-- ============================================================
-- PROJECT_DATA — Agregar columna created_by
-- Fecha: 2026-02-09
-- ============================================================

-- 1. Agregar columna created_by (nullable, misma convención que updated_by)
ALTER TABLE public.project_data
  ADD COLUMN IF NOT EXISTS created_by uuid NULL;

-- 2. FK a organization_members (ON DELETE SET NULL, misma convención)
ALTER TABLE public.project_data
  ADD CONSTRAINT project_data_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES organization_members (id) ON DELETE SET NULL;
