-- ============================================================================
-- FIX: media_files — Columna updated_at NOT NULL + trigger set_timestamp
-- Tablas afectadas: public.media_files
-- Fecha: 2026-03-14
-- Contexto: La columna updated_at existe pero es nullable y no tiene
--           trigger set_timestamp para auto-actualizarse en UPDATEs.
-- ============================================================================

-- 1. Hacer updated_at NOT NULL con default now()
-- Primero llenar los valores null existentes
UPDATE public.media_files
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Luego cambiar la restricción
ALTER TABLE public.media_files
ALTER COLUMN updated_at SET NOT NULL,
ALTER COLUMN updated_at SET DEFAULT now();

-- 2. Crear trigger set_timestamp
-- (usa la función pública set_timestamp() que ya existe)
CREATE TRIGGER media_files_set_updated_at
    BEFORE UPDATE ON public.media_files
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamp();
