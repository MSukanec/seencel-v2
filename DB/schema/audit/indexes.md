# Database Schema (Auto-generated)
> Generated: 2026-02-22T22:05:48.801Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AUDIT] Indexes (7, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| changelog_entries | changelog_entries_date_idx | `CREATE INDEX changelog_entries_date_idx ON audit.changelog_entries USING btre...` |
| organization_activity_logs | idx_org_activity_logs_created_at | `CREATE INDEX idx_org_activity_logs_created_at ON audit.organization_activity_...` |
| organization_activity_logs | idx_org_activity_logs_member_id | `CREATE INDEX idx_org_activity_logs_member_id ON audit.organization_activity_l...` |
| organization_activity_logs | idx_org_activity_logs_org_id | `CREATE INDEX idx_org_activity_logs_org_id ON audit.organization_activity_logs...` |
| organization_activity_logs | idx_org_activity_logs_target | `CREATE INDEX idx_org_activity_logs_target ON audit.organization_activity_logs...` |
| signatures | idx_signatures_document | `CREATE INDEX idx_signatures_document ON audit.signatures USING btree (documen...` |
| signatures | idx_signatures_org | `CREATE INDEX idx_signatures_org ON audit.signatures USING btree (organization...` |
