-- ==========================================
-- 030_rename_ia_tables_to_ai.sql
-- Renombra las tablas ia_* → ai_* dentro del schema ai.
-- Las políticas RLS y constraints se mantienen intactos.
-- ==========================================

BEGIN;

ALTER TABLE ai.ia_context_snapshots       RENAME TO ai_context_snapshots;
ALTER TABLE ai.ia_import_mapping_patterns RENAME TO ai_import_mapping_patterns;
ALTER TABLE ai.ia_import_value_patterns   RENAME TO ai_import_value_patterns;
ALTER TABLE ai.ia_messages                RENAME TO ai_messages;
ALTER TABLE ai.ia_usage_logs              RENAME TO ai_usage_logs;
ALTER TABLE ai.ia_user_greetings          RENAME TO ai_user_greetings;
ALTER TABLE ai.ia_user_preferences        RENAME TO ai_user_preferences;
ALTER TABLE ai.ia_user_usage_limits       RENAME TO ai_user_usage_limits;

-- ==========================================
-- VERIFICACIÓN
-- ==========================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'ai' ORDER BY table_name;
-- Debe mostrar:
--   ai_context_snapshots
--   ai_import_mapping_patterns
--   ai_import_value_patterns
--   ai_messages
--   ai_usage_logs
--   ai_user_greetings
--   ai_user_preferences
--   ai_user_usage_limits

COMMIT;
