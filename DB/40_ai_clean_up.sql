-- ============================================================================
-- Seencel V2 — Deep Clean of Deprecated AI Features
-- Fecha: Marzo 2026
-- ============================================================================
-- Se eliminan las tablas huérfanas correspondientes al sistema legacy 
-- de Inteligencia Artificial (chatbot y patterns de importación en desuso).
-- NINGUNA de estas tablas tiene referencias en el código fuente (TypeScript/React).
-- Solo sobreviven: ai_usage_logs y ai_organization_usage_limits.
-- ============================================================================

-- A. Limpieza de tablas del Chatbot Legacy
DROP TABLE IF EXISTS ai.ai_user_usage_limits CASCADE;
DROP TABLE IF EXISTS ai.ai_user_preferences CASCADE;
DROP TABLE IF EXISTS ai.ai_user_greetings CASCADE;
DROP TABLE IF EXISTS ai.ai_messages CASCADE;
DROP TABLE IF EXISTS ai.ai_context_snapshots CASCADE;

-- B. IMPORTANTE: Las tablas de Importación Fuzzy (ai_import_mapping_patterns y ai_import_value_patterns)
-- SE CONSERVAN ya que arreglamos el bug que les impedía funcionar. Son esenciales para
-- la memoria organizativa del Importador universal de Excel.

-- ============================================================================
-- NOTA: Con este script, el schema "ai" quedará purificado y sin las tablas
-- UNRESTRICTED puramente ligadas al viejo chatbot.
-- ============================================================================
