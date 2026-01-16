-- =================================================================
-- SCRIPT: REPARACIÓN FINAL DE DUPLICADOS EN BITÁCORA
-- FECHA: 2026-01-16
-- =================================================================

BEGIN;

-- 1. HABILITAR LA ELIMINACIÓN DE VÍNCULOS (Imprescindible para "Desvincular" fotos)
-- Nota: Esto no borra las fotos (files), solo la conexión con la bitácora.
-- Al ser una tabla de conexión (junction table) sin soft-delete, requiere borrado físico.

DROP POLICY IF EXISTS "MIEMBROS ELIMINAN MEDIA_LINKS" ON public.media_links;

CREATE POLICY "MIEMBROS ELIMINAN MEDIA_LINKS"
ON public.media_links
FOR DELETE
TO public
USING (
  (organization_id IS NOT NULL AND can_mutate_org(organization_id, 'media.manage'::text))
  OR is_admin()
);

-- 2. LIMPIEZA DE DUPLICADOS EXISTENTES
-- Elimina los "links" extra que se crearon por error, dejando solo uno por archivo/bitácora.

DELETE FROM public.media_links
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (partition BY media_file_id, site_log_id ORDER BY created_at DESC) as rnum
        FROM public.media_links
    ) t
    WHERE t.rnum > 1
);

COMMIT;
