# Database Schema (Auto-generated)
> Generated: 2026-02-26T22:25:46.213Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Triggers (20)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| feedback | notify_new_feedback | AFTER | INSERT | EXECUTE FUNCTION notifications.notify_new_feedback() |
| organization_data | on_organization_data_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_organization_data_activity() |
| organization_data | set_updated_by_organization_data | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| organization_external_actors | oea_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| organization_external_actors | on_external_actor_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION audit.log_external_actor_activity() |
| organization_external_actors | set_updated_by_oea | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| organization_external_actors | trigger_create_contact_on_new_external_actor | AFTER | INSERT | EXECUTE FUNCTION iam.handle_new_external_actor_contact() |
| organization_invitations | trigger_create_contact_on_registered_invitation | AFTER | INSERT | EXECUTE FUNCTION iam.handle_registered_invitation() |
| organization_members | log_member_billable_changes | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION audit.log_member_billable_change() |
| organization_members | set_updated_by_organization_members | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| organization_members | trigger_create_contact_on_new_member | AFTER | INSERT | EXECUTE FUNCTION iam.handle_new_org_member_contact() |
| organization_recipe_preferences | trg_increment_recipe_usage | AFTER | INSERT | EXECUTE FUNCTION catalog.increment_recipe_usage() |
| organizations | on_organizations_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION audit.log_organizations_activity() |
| organizations | set_updated_by_organizations | BEFORE | UPDATE | EXECUTE FUNCTION iam.handle_updated_by_organizations() |
| role_permissions | trg_role_permissions_sync_org | BEFORE | INSERT | EXECUTE FUNCTION iam.sync_role_permission_org_id() |
| user_data | trg_user_data_fill_user | BEFORE | INSERT | EXECUTE FUNCTION iam.fill_user_data_user_id_from_auth() |
| users | notify_new_user | AFTER | INSERT | EXECUTE FUNCTION notifications.notify_admin_on_new_user() |
| users | on_user_created_queue_email_welcome | AFTER | INSERT | EXECUTE FUNCTION notifications.queue_email_welcome() |
| users | trg_users_normalize_email | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION iam.users_normalize_email() |
| users | trigger_sync_contact_on_user_update | AFTER | UPDATE | EXECUTE FUNCTION iam.sync_contact_on_user_update() |
