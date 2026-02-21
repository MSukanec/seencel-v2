# Database Schema (Auto-generated)
> Generated: 2026-02-21T12:04:42.647Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AUDIT] Indexes (8, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| changelog_entries | changelog_entries_date_idx | `CREATE INDEX changelog_entries_date_idx ON audit.changelog_entries USING btre...` |
| organization_activity_logs | idx_org_activity_logs_created_at | `CREATE INDEX idx_org_activity_logs_created_at ON audit.organization_activity_...` |
| organization_activity_logs | idx_org_activity_logs_member_id | `CREATE INDEX idx_org_activity_logs_member_id ON audit.organization_activity_l...` |
| organization_activity_logs | idx_org_activity_logs_org_id | `CREATE INDEX idx_org_activity_logs_org_id ON audit.organization_activity_logs...` |
| organization_activity_logs | idx_org_activity_logs_target | `CREATE INDEX idx_org_activity_logs_target ON audit.organization_activity_logs...` |
| system_error_logs | idx_system_error_logs_created | `CREATE INDEX idx_system_error_logs_created ON audit.system_error_logs USING b...` |
| system_error_logs | idx_system_error_logs_domain | `CREATE INDEX idx_system_error_logs_domain ON audit.system_error_logs USING bt...` |
| system_error_logs | idx_system_error_logs_severity | `CREATE INDEX idx_system_error_logs_severity ON audit.system_error_logs USING ...` |
