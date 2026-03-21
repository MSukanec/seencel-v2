# Database Schema (Auto-generated)
> Generated: 2026-03-20T17:04:16.493Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AI] Indexes (5, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| ai_import_mapping_patterns | ia_import_mapping_patterns_unique_mapping | `CREATE UNIQUE INDEX ia_import_mapping_patterns_unique_mapping ON ai.ai_import...` |
| ai_import_value_patterns | ia_import_value_patterns_unique_source | `CREATE UNIQUE INDEX ia_import_value_patterns_unique_source ON ai.ai_import_va...` |
| ai_usage_logs | idx_ai_usage_logs_organization_id | `CREATE INDEX idx_ai_usage_logs_organization_id ON ai.ai_usage_logs USING btre...` |
| ai_usage_logs | idx_ia_usage_logs_context_type | `CREATE INDEX idx_ia_usage_logs_context_type ON ai.ai_usage_logs USING btree (...` |
| ai_usage_logs | idx_ia_usage_logs_user_id | `CREATE INDEX idx_ia_usage_logs_user_id ON ai.ai_usage_logs USING btree (user_id)` |
