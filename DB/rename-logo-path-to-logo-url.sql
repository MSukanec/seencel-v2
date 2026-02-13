-- ============================================================================
-- MIGRACIÓN: logo_path → logo_url
-- ============================================================================
-- Cambia de almacenar el path relativo a la URL completa del logo.
-- Esto elimina la necesidad de funciones buildLogoUrl en el frontend.
-- ============================================================================

-- IMPORTANTE: Reemplazar YOUR_SUPABASE_URL con tu URL real de Supabase
-- Ejemplo: https://wtatvsgeivymcppowrfy.supabase.co

-- 1. Renombrar la columna
ALTER TABLE organizations RENAME COLUMN logo_path TO logo_url;

-- 2. Actualizar valores existentes: convertir paths relativos a URLs completas
-- Solo actualiza rows que tienen un logo_path que NO es ya una URL completa
UPDATE organizations
SET logo_url = 'YOUR_SUPABASE_URL/storage/v1/object/public/public-assets/' || 
    CASE 
        WHEN logo_url LIKE 'organizations/%' THEN logo_url
        ELSE 'organizations/' || logo_url
    END
WHERE logo_url IS NOT NULL
  AND logo_url NOT LIKE 'http%';

-- 3. Agregar comment a la columna para documentar el cambio
COMMENT ON COLUMN organizations.logo_url IS 'URL completa del logo de la organización (almacenado como URL pública de Supabase Storage)';
