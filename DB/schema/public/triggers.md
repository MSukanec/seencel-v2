# Database Schema (Auto-generated)
> Generated: 2026-03-19T23:49:30.234Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Triggers (12)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| import_batches | set_import_batch_member_id | BEFORE | INSERT | EXECUTE FUNCTION handle_import_batch_member_id() |
| import_batches | tr_log_import_activity | AFTER | INSERT, UPDATE | EXECUTE FUNCTION audit.log_import_activity() |
| media_files | media_files_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| media_files | on_media_file_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION audit.log_media_file_activity() |
| media_files | set_updated_by_media_files | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| media_files | trigger_cleanup_media_file_hard_delete | AFTER | DELETE | EXECUTE FUNCTION cleanup_media_file_storage() |
| media_links | media_links_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| media_links | on_media_link_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION audit.log_media_link_activity() |
| media_links | set_updated_by_media_links | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| saved_views | on_saved_view_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_saved_view_activity() |
| saved_views | set_timestamp_saved_views | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| saved_views | set_updated_by_saved_views | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
