-- ============================================================================
-- ADD SOFT DELETE COLUMNS TO media_links
-- ============================================================================
-- Causa: las queries del frontend filtran por is_deleted = false, pero la 
-- tabla media_links no tiene esas columnas. Error PostgreSQL 42703.
-- ============================================================================

-- 1. Agregar columnas de soft delete
ALTER TABLE public.media_links
    ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Crear índice parcial para performance (solo registros activos)
CREATE INDEX IF NOT EXISTS idx_media_links_active 
    ON public.media_links (organization_id, created_at DESC) 
    WHERE (is_deleted = false);

-- 3. Actualizar RLS policies si es necesario para incluir is_deleted
-- (verificar que las políticas existentes no se rompan)

-- NOTA: Después de ejecutar este script, verificar que la página de archivos
-- funcione correctamente en http://localhost:3000/es/organizacion/documentacion
