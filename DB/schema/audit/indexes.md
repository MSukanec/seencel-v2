# Database Schema (Auto-generated)
> Generated: 2026-02-21T16:30:21.519Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AUDIT] Indexes (5, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| changelog_entries | changelog_entries_date_idx | `CREATE INDEX changelog_entries_date_idx ON audit.changelog_entries USING btre...` |
| organization_activity_logs | idx_org_activity_logs_created_at | `CREATE INDEX idx_org_activity_logs_created_at ON audit.organization_activity_...` |
| organization_activity_logs | idx_org_activity_logs_member_id | `CREATE INDEX idx_org_activity_logs_member_id ON audit.organization_activity_l...` |
| organization_activity_logs | idx_org_activity_logs_org_id | `CREATE INDEX idx_org_activity_logs_org_id ON audit.organization_activity_logs...` |
| organization_activity_logs | idx_org_activity_logs_target | `CREATE INDEX idx_org_activity_logs_target ON audit.organization_activity_logs...` |
