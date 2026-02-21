# Database Schema (Auto-generated)
> Generated: 2026-02-21T12:04:42.647Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Triggers (23)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| capital_adjustments | capital_adjustments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| capital_adjustments | trg_update_balance_adjustment | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION update_partner_balance_after_capital_cha... |
| client_portal_settings | set_audit_client_portal | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| external_service_prices | external_service_prices_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| financial_operation_movements | on_financial_movement_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION audit.log_financial_movement_activity() |
| financial_operation_movements | set_updated_at_financial_operation_movements | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| financial_operation_movements | set_updated_by_financial_operation_movements | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| financial_operations | on_financial_operation_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_financial_operation_activity() |
| financial_operations | set_updated_at_financial_operations | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| financial_operations | set_updated_by_financial_operations | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| forum_posts | trg_update_thread_activity | AFTER | DELETE, INSERT | EXECUTE FUNCTION update_forum_thread_activity() |
| import_batches | set_import_batch_member_id | BEFORE | INSERT | EXECUTE FUNCTION handle_import_batch_member_id() |
| import_batches | tr_log_import_activity | AFTER | UPDATE, INSERT | EXECUTE FUNCTION audit.log_import_activity() |
| material_types | set_updated_by_material_types | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| material_types | trg_set_updated_at_material_types | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| media_file_folders | media_file_folders_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| media_file_folders | on_media_file_folder_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_media_file_folder_activity() |
| media_file_folders | set_updated_by_media_file_folders | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| media_files | set_updated_by_media_files | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| media_files | trigger_cleanup_media_file_hard_delete | AFTER | DELETE | EXECUTE FUNCTION cleanup_media_file_storage() |
| media_links | set_updated_by_media_links | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| organization_task_prices | trg_lock_org_task | BEFORE | UPDATE | EXECUTE FUNCTION lock_org_task_on_update() |
| testimonials | trigger_testimonials_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_testimonials_updated_at() |
