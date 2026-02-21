# Database Schema (Auto-generated)
> Generated: 2026-02-21T13:42:37.043Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [OPS] Indexes (10, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| ops_alerts | idx_ops_alerts_org | `CREATE INDEX idx_ops_alerts_org ON ops.ops_alerts USING btree (organization_i...` |
| ops_alerts | idx_ops_alerts_status | `CREATE INDEX idx_ops_alerts_status ON ops.ops_alerts USING btree (status, sev...` |
| ops_alerts | ux_ops_alerts_fingerprint_open | `CREATE UNIQUE INDEX ux_ops_alerts_fingerprint_open ON ops.ops_alerts USING bt...` |
| ops_check_runs | idx_ops_check_runs_created_at | `CREATE INDEX idx_ops_check_runs_created_at ON ops.ops_check_runs USING btree ...` |
| ops_repair_actions | idx_ops_repair_actions_alert_type | `CREATE INDEX idx_ops_repair_actions_alert_type ON ops.ops_repair_actions USIN...` |
| ops_repair_logs | idx_ops_repair_logs_alert_id | `CREATE INDEX idx_ops_repair_logs_alert_id ON ops.ops_repair_logs USING btree ...` |
| ops_repair_logs | idx_ops_repair_logs_created_at | `CREATE INDEX idx_ops_repair_logs_created_at ON ops.ops_repair_logs USING btre...` |
| system_error_logs | idx_system_error_logs_created | `CREATE INDEX idx_system_error_logs_created ON ops.system_error_logs USING btr...` |
| system_error_logs | idx_system_error_logs_domain | `CREATE INDEX idx_system_error_logs_domain ON ops.system_error_logs USING btre...` |
| system_error_logs | idx_system_error_logs_severity | `CREATE INDEX idx_system_error_logs_severity ON ops.system_error_logs USING bt...` |
