-- ============================================================================
-- ELIMINAR MEDIA_FILE_FOLDERS — Ya no se usan carpetas
-- ============================================================================
-- Las carpetas se reemplazan por "Saved Views" (vistas guardadas).
-- Este script elimina la FK, la columna, los triggers, la tabla y su audit fn.
-- ============================================================================

-- 1. Eliminar FK y columna folder_id de media_links
ALTER TABLE public.media_links DROP CONSTRAINT IF EXISTS media_links_folder_id_fkey;
ALTER TABLE public.media_links DROP COLUMN IF EXISTS folder_id;

-- 2. Eliminar triggers de media_file_folders
DROP TRIGGER IF EXISTS media_file_folders_set_updated_at ON public.media_file_folders;
DROP TRIGGER IF EXISTS on_media_file_folder_audit ON public.media_file_folders;
DROP TRIGGER IF EXISTS set_updated_by_media_file_folders ON public.media_file_folders;

-- 3. Eliminar políticas RLS
DROP POLICY IF EXISTS "MEMBERS SELECT MEDIA_FILE_FOLDERS" ON public.media_file_folders;
DROP POLICY IF EXISTS "MEMBERS INSERT MEDIA_FILE_FOLDERS" ON public.media_file_folders;
DROP POLICY IF EXISTS "MEMBERS UPDATE MEDIA_FILE_FOLDERS" ON public.media_file_folders;
DROP POLICY IF EXISTS "MEMBERS DELETE MEDIA_FILE_FOLDERS" ON public.media_file_folders;

-- 4. Eliminar índices
DROP INDEX IF EXISTS public.idx_media_file_folders_organization_id;
DROP INDEX IF EXISTS public.idx_media_file_folders_parent_id;
DROP INDEX IF EXISTS public.idx_media_file_folders_project_id;

-- 5. Eliminar tabla
DROP TABLE IF EXISTS public.media_file_folders CASCADE;

-- 6. Eliminar función de audit log
DROP FUNCTION IF EXISTS audit.log_media_file_folder_activity() CASCADE;
