-- ==========================================
-- 029_create_ai_schema.sql
-- Crea el schema `ai` y migra todas las tablas ia_* desde public.
--
-- IMPORTANTE: Ejecutar en una sola transacción.
-- Las políticas RLS se mueven automáticamente con las tablas.
-- Los FKs a public.users y public.organizations se mantienen.
-- ==========================================

BEGIN;

-- ==========================================
-- 1. CREAR SCHEMA Y PERMISOS
-- ==========================================
CREATE SCHEMA IF NOT EXISTS ai;

GRANT USAGE ON SCHEMA ai TO authenticated, service_role, anon;

-- ==========================================
-- 2. MOVER TABLAS (todas FK a public.users/organizations — sin dependencias entre sí)
-- ==========================================

-- Preferencias del usuario IA (tono, idioma, personalidad)
ALTER TABLE public.ia_user_preferences SET SCHEMA ai;

-- Límites de uso por usuario (plan free = 3 prompts/día)
ALTER TABLE public.ia_user_usage_limits SET SCHEMA ai;

-- Saludos personalizados por período
ALTER TABLE public.ia_user_greetings SET SCHEMA ai;

-- Log de costo y tokens por llamada a OpenAI
ALTER TABLE public.ia_usage_logs SET SCHEMA ai;

-- Snapshots de contexto por usuario/org
ALTER TABLE public.ia_context_snapshots SET SCHEMA ai;

-- Historial de mensajes del chat IA
ALTER TABLE public.ia_messages SET SCHEMA ai;

-- Patrones aprendidos de mapeo de columnas en imports
ALTER TABLE public.ia_import_mapping_patterns SET SCHEMA ai;

-- Patrones aprendidos de equivalencias de valores en imports
ALTER TABLE public.ia_import_value_patterns SET SCHEMA ai;

-- ==========================================
-- 3. PERMISOS SOBRE LAS TABLAS MOVIDAS
-- ==========================================
GRANT ALL ON ALL TABLES IN SCHEMA ai TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ai TO authenticated, service_role;

-- ==========================================
-- 4. VERIFICACIÓN (ejecutar al final para confirmar)
-- ==========================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'ai' ORDER BY table_name;
-- Debe mostrar las 8 tablas:
--   ia_context_snapshots
--   ia_import_mapping_patterns
--   ia_import_value_patterns
--   ia_messages
--   ia_usage_logs
--   ia_user_greetings
--   ia_user_preferences
--   ia_user_usage_limits

COMMIT;
