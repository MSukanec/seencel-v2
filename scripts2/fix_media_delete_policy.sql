-- =================================================================
-- SCRIPT: Agregar Política DELETE para media_links
-- FECHA: 2026-01-16
-- DESCRIPCIÓN: Faltaba la política de eliminación, lo que causaba
-- duplicados al editar bitácoras (no se borraban los links anteriores).
-- =================================================================

-- 1. Política para ELIMINAR media_links
-- Permite borrar si eres miembro con permiso 'media.manage' O si eres admin.

DROP POLICY IF EXISTS "MIEMBROS ELIMINAN MEDIA_LINKS" ON public.media_links;

CREATE POLICY "MIEMBROS ELIMINAN MEDIA_LINKS"
ON public.media_links
FOR DELETE
TO public
USING (
  (organization_id IS NOT NULL AND can_mutate_org(organization_id, 'media.manage'::text))
  OR is_admin()
);

-- Si también necesitas borrar media_files (opcional pero recomendado tener la política):
DROP POLICY IF EXISTS "MIEMBROS ELIMINAN MEDIA_FILES" ON public.media_files;

CREATE POLICY "MIEMBROS ELIMINAN MEDIA_FILES"
ON public.media_files
FOR DELETE
TO public
USING (
  (organization_id IS NOT NULL AND can_mutate_org(organization_id, 'media.manage'::text))
  OR is_admin()
);
