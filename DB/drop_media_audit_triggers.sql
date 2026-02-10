-- ============================================
-- Eliminar triggers de auditoría de media_files y media_links
-- ============================================
-- Estas tablas generan ruido en los logs de actividad.
-- Lo que importa es la acción sobre la entidad padre
-- (ej: pago de gasto, proyecto, contacto), no el adjunto.
--
-- Ejecutar en Supabase SQL Editor.
-- ============================================

-- 1. Drop audit triggers
DROP TRIGGER IF EXISTS on_media_file_audit ON media_files;
DROP TRIGGER IF EXISTS on_media_link_audit ON media_links;

-- 2. Drop las funciones de logging (ya no se usan)
DROP FUNCTION IF EXISTS log_media_file_activity();
DROP FUNCTION IF EXISTS log_media_link_activity();

-- 3. (Opcional) Limpiar logs existentes de media
-- DELETE FROM organization_activity_logs WHERE target_table IN ('media_files', 'media_links');
