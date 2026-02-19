# Database Schema (Auto-generated)
> Generated: 2026-02-19T19:04:24.438Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONSTRUCTION] Triggers (13)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| construction_dependencies | set_updated_by_construction_dependencies | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| construction_tasks | on_construction_task_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION log_construction_task_activity() |
| construction_tasks | set_updated_by_construction_tasks | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| construction_tasks | trg_construction_task_material_snapshot | AFTER | INSERT | EXECUTE FUNCTION create_construction_task_material_snapsh... |
| construction_tasks | trg_sync_task_status_progress | BEFORE | UPDATE | EXECUTE FUNCTION sync_task_status_progress() |
| quote_items | on_quote_item_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION log_quote_item_activity() |
| quote_items | quote_items_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| quote_items | set_updated_by_quote_items | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| quote_items | trg_quote_item_default_sort | BEFORE | INSERT | EXECUTE FUNCTION quote_item_set_default_sort_key() |
| quotes | notify_quote_status_change | AFTER | UPDATE | EXECUTE FUNCTION notify_quote_status_change() |
| quotes | on_quote_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_quote_activity() |
| quotes | quotes_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| quotes | set_updated_by_quotes | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
