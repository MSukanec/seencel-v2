# Database Schema (Auto-generated)
> Generated: 2026-02-21T12:04:42.647Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROJECTS] Triggers (26)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| client_roles | on_client_role_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_client_role_activity() |
| client_roles | set_audit_client_roles | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| contact_categories | on_contact_category_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION audit.log_contact_category_activity() |
| contact_categories | set_updated_by_contact_categories | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| contact_category_links | trigger_contact_category_links_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION iam.update_contact_category_links_update... |
| contacts | on_contact_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_contact_activity() |
| contacts | set_updated_by_contacts | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| contacts | trigger_protect_linked_contact_delete | BEFORE | UPDATE | EXECUTE FUNCTION iam.protect_linked_contact_delete() |
| project_clients | on_project_client_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION audit.log_project_client_activity() |
| project_clients | set_audit_project_clients | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| project_data | on_project_data_audit | AFTER | UPDATE | EXECUTE FUNCTION audit.log_project_data_activity() |
| project_data | project_data_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| project_data | set_updated_by_project_data | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| project_labor | on_project_labor_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION audit.log_project_labor_activity() |
| project_labor | set_project_labor_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| project_labor | set_updated_by_project_labor | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| project_modalities | on_project_modality_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION audit.log_project_modality_activity() |
| project_modalities | project_modalities_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| project_modalities | set_updated_by_project_modalities | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| project_settings | set_project_settings_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| project_types | on_project_type_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION audit.log_project_type_activity() |
| project_types | project_types_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| project_types | set_updated_by_project_types | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| projects | on_project_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION audit.log_project_activity() |
| projects | projects_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| projects | set_updated_by_projects | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
