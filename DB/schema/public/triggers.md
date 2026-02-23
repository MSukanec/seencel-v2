# Database Schema (Auto-generated)
> Generated: 2026-02-23T12:14:47.276Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Triggers (8)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| import_batches | set_import_batch_member_id | BEFORE | INSERT | EXECUTE FUNCTION handle_import_batch_member_id() |
| import_batches | tr_log_import_activity | AFTER | UPDATE, INSERT | EXECUTE FUNCTION audit.log_import_activity() |
| media_file_folders | media_file_folders_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| media_file_folders | on_media_file_folder_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION audit.log_media_file_folder_activity() |
| media_file_folders | set_updated_by_media_file_folders | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| media_files | set_updated_by_media_files | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| media_files | trigger_cleanup_media_file_hard_delete | AFTER | DELETE | EXECUTE FUNCTION cleanup_media_file_storage() |
| media_links | set_updated_by_media_links | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
