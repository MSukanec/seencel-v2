# Database Schema (Auto-generated)
> Generated: 2026-02-26T15:52:15.290Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROJECTS] Triggers (19)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| client_portal_settings | set_audit_client_portal | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| client_roles | on_client_role_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION audit.log_client_role_activity() |
| client_roles | set_audit_client_roles | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| project_clients | on_project_client_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION audit.log_project_client_activity() |
| project_clients | set_audit_project_clients | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| project_data | on_project_data_audit | AFTER | UPDATE | EXECUTE FUNCTION audit.log_project_data_activity() |
| project_data | project_data_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| project_data | set_updated_by_project_data | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| project_labor | on_project_labor_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION audit.log_project_labor_activity() |
| project_labor | set_updated_by_project_labor | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| project_modalities | on_project_modality_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_project_modality_activity() |
| project_modalities | project_modalities_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| project_modalities | set_updated_by_project_modalities | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| project_types | on_project_type_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION audit.log_project_type_activity() |
| project_types | project_types_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| project_types | set_updated_by_project_types | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| projects | on_project_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION audit.log_project_activity() |
| projects | projects_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| projects | set_updated_by_projects | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
