# Database Schema (Auto-generated)
> Generated: 2026-02-23T12:14:47.276Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AI] Indexes (12, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| ai_context_snapshots | idx_ia_context_snapshots_type | `CREATE INDEX idx_ia_context_snapshots_type ON ai.ai_context_snapshots USING b...` |
| ai_context_snapshots | idx_ia_context_snapshots_user_org | `CREATE INDEX idx_ia_context_snapshots_user_org ON ai.ai_context_snapshots USI...` |
| ai_import_mapping_patterns | ia_import_mapping_patterns_unique_mapping | `CREATE UNIQUE INDEX ia_import_mapping_patterns_unique_mapping ON ai.ai_import...` |
| ai_import_value_patterns | ia_import_value_patterns_unique_source | `CREATE UNIQUE INDEX ia_import_value_patterns_unique_source ON ai.ai_import_va...` |
| ai_messages | idx_ia_messages_context_type | `CREATE INDEX idx_ia_messages_context_type ON ai.ai_messages USING btree (cont...` |
| ai_messages | idx_ia_messages_user_id | `CREATE INDEX idx_ia_messages_user_id ON ai.ai_messages USING btree (user_id)` |
| ai_usage_logs | idx_ia_usage_logs_context_type | `CREATE INDEX idx_ia_usage_logs_context_type ON ai.ai_usage_logs USING btree (...` |
| ai_usage_logs | idx_ia_usage_logs_user_id | `CREATE INDEX idx_ia_usage_logs_user_id ON ai.ai_usage_logs USING btree (user_id)` |
| ai_user_greetings | ia_user_greetings_unique | `CREATE UNIQUE INDEX ia_user_greetings_unique ON ai.ai_user_greetings USING bt...` |
| ai_user_preferences | idx_ia_user_preferences_language | `CREATE INDEX idx_ia_user_preferences_language ON ai.ai_user_preferences USING...` |
| ai_user_usage_limits | idx_ia_user_usage_limits_last_reset | `CREATE INDEX idx_ia_user_usage_limits_last_reset ON ai.ai_user_usage_limits U...` |
| ai_user_usage_limits | idx_ia_user_usage_limits_plan | `CREATE INDEX idx_ia_user_usage_limits_plan ON ai.ai_user_usage_limits USING b...` |
