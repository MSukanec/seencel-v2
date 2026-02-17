-- ============================================================
-- 001: DROP client_representatives y TODAS sus dependencias
-- ============================================================
-- Elimina toda la infraestructura del sistema legacy de 
-- representantes de cliente. No hay datos en producción.
--
-- DEPENDENCIAS que se eliminan (en orden):
-- 1. 7 RLS policies que usan is_project_representative()
-- 2. Función is_project_representative()
-- 3. Vista client_representatives_view
-- 4. Tabla client_representatives (con sus índices y FKs)
-- ============================================================

-- ============================================================
-- 1. Eliminar TODAS las RLS policies que usan is_project_representative()
-- ============================================================

-- En tabla users
DROP POLICY IF EXISTS "REPRESENTANTES VEN USERS" ON public.users;

-- En tabla quotes (2 policies)
DROP POLICY IF EXISTS "REPRESENTANTES VEN QUOTES" ON public.quotes;
DROP POLICY IF EXISTS "REPRESENTANTES EDITAN QUOTES" ON public.quotes;

-- En tabla site_logs
DROP POLICY IF EXISTS "REPRESENTANTES VEN SITE_LOGS" ON public.site_logs;

-- En tabla site_log_types
DROP POLICY IF EXISTS "REPRESENTANTES VEN SITE_LOG_TYPES" ON public.site_log_types;

-- En tabla media_files
DROP POLICY IF EXISTS "REPRESENTANTES VEN MEDIA_FILES" ON public.media_files;

-- En tabla media_links
DROP POLICY IF EXISTS "REPRESENTANTES VEN MEDIA_LINKS" ON public.media_links;

-- ============================================================
-- 2. Eliminar la función is_project_representative()
-- ============================================================
DROP FUNCTION IF EXISTS public.is_project_representative(uuid);

-- ============================================================
-- 3. Eliminar la vista client_representatives_view
-- ============================================================
DROP VIEW IF EXISTS public.client_representatives_view;

-- ============================================================
-- 4. Eliminar la tabla client_representatives
-- ============================================================
-- Los índices se eliminan automáticamente con la tabla:
--   - client_representatives_unique_contact
--   - idx_client_reps_client
--   - idx_client_reps_contact
--   - idx_client_reps_org
DROP TABLE IF EXISTS public.client_representatives;
