# Database Schema (Auto-generated)
> Generated: 2026-03-01T21:32:52.143Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONSTRUCTION] Triggers (11)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| construction_dependencies | set_updated_by_construction_dependencies | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| construction_tasks | on_construction_task_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_construction_task_activity() |
| construction_tasks | set_updated_by_construction_tasks | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| construction_tasks | trg_construction_task_material_snapshot | AFTER | INSERT | EXECUTE FUNCTION construction.create_construction_task_ma... |
| construction_tasks | trg_sync_task_status_progress | BEFORE | UPDATE | EXECUTE FUNCTION construction.sync_task_status_progress() |
| site_log_types | on_site_log_types_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION audit.log_site_log_types_activity() |
| site_log_types | set_updated_by_site_log_types | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| site_log_types | update_site_log_types_timestamp | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| site_logs | on_site_logs_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_site_logs_activity() |
| site_logs | set_updated_by_site_logs | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| site_logs | update_site_logs_timestamp | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
