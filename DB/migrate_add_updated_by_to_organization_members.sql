-- ============================================================
-- Agregar columna updated_by a organization_members
-- El trigger handle_updated_by() ya existe pero la columna faltaba,
-- causando que cualquier UPDATE falle silenciosamente.
-- ============================================================

ALTER TABLE public.organization_members
ADD COLUMN updated_by uuid NULL;

-- FK a organization_members(id) para rastrear qué miembro hizo el cambio
ALTER TABLE public.organization_members
ADD CONSTRAINT organization_members_updated_by_fkey
FOREIGN KEY (updated_by) REFERENCES organization_members(id) ON DELETE SET NULL;

-- Índice para queries de auditoría
CREATE INDEX IF NOT EXISTS idx_org_members_updated_by
ON public.organization_members USING btree (updated_by);
