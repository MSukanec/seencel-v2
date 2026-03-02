# Database Schema (Auto-generated)
> Generated: 2026-03-01T21:32:52.143Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROJECTS] Indexes (41, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| client_portal_branding | client_portal_branding_project_id_key | `CREATE UNIQUE INDEX client_portal_branding_project_id_key ON projects.client_...` |
| client_portal_settings | idx_client_portal_settings_org | `CREATE INDEX idx_client_portal_settings_org ON projects.client_portal_setting...` |
| project_clients | idx_project_clients_client | `CREATE INDEX idx_project_clients_client ON projects.project_clients USING btr...` |
| project_clients | idx_project_clients_created_at | `CREATE INDEX idx_project_clients_created_at ON projects.project_clients USING...` |
| project_clients | idx_project_clients_is_primary | `CREATE INDEX idx_project_clients_is_primary ON projects.project_clients USING...` |
| project_clients | idx_project_clients_org_project | `CREATE INDEX idx_project_clients_org_project ON projects.project_clients USIN...` |
| project_clients | idx_project_clients_project | `CREATE INDEX idx_project_clients_project ON projects.project_clients USING bt...` |
| project_clients | uniq_project_client | `CREATE UNIQUE INDEX uniq_project_client ON projects.project_clients USING btr...` |
| project_data | project_data_city_idx | `CREATE INDEX project_data_city_idx ON projects.project_data USING btree (city)` |
| project_data | project_data_org_idx | `CREATE INDEX project_data_org_idx ON projects.project_data USING btree (organ...` |
| project_data | project_data_org_project_idx | `CREATE INDEX project_data_org_project_idx ON projects.project_data USING btre...` |
| project_data | project_data_zip_idx | `CREATE INDEX project_data_zip_idx ON projects.project_data USING btree (zip_c...` |
| project_labor | idx_project_labor_contact_id | `CREATE INDEX idx_project_labor_contact_id ON projects.project_labor USING btr...` |
| project_labor | idx_project_labor_is_deleted | `CREATE INDEX idx_project_labor_is_deleted ON projects.project_labor USING btr...` |
| project_labor | idx_project_labor_labor_type_id | `CREATE INDEX idx_project_labor_labor_type_id ON projects.project_labor USING ...` |
| project_labor | idx_project_labor_organization_id | `CREATE INDEX idx_project_labor_organization_id ON projects.project_labor USIN...` |
| project_labor | idx_project_labor_project_id | `CREATE INDEX idx_project_labor_project_id ON projects.project_labor USING btr...` |
| project_labor | idx_project_labor_status | `CREATE INDEX idx_project_labor_status ON projects.project_labor USING btree (...` |
| project_modalities | project_modalities_not_deleted_idx | `CREATE INDEX project_modalities_not_deleted_idx ON projects.project_modalitie...` |
| project_modalities | project_modalities_org_idx | `CREATE INDEX project_modalities_org_idx ON projects.project_modalities USING ...` |
| project_modalities | project_modalities_org_name_active_uniq | `CREATE UNIQUE INDEX project_modalities_org_name_active_uniq ON projects.proje...` |
| project_modalities | project_modalities_system_name_active_uniq | `CREATE UNIQUE INDEX project_modalities_system_name_active_uniq ON projects.pr...` |
| project_settings | idx_project_settings_organization_id | `CREATE INDEX idx_project_settings_organization_id ON projects.project_setting...` |
| project_settings | idx_project_settings_project_id | `CREATE INDEX idx_project_settings_project_id ON projects.project_settings USI...` |
| project_settings | project_settings_project_id_unique | `CREATE UNIQUE INDEX project_settings_project_id_unique ON projects.project_se...` |
| project_types | project_types_not_deleted_idx | `CREATE INDEX project_types_not_deleted_idx ON projects.project_types USING bt...` |
| project_types | project_types_org_idx | `CREATE INDEX project_types_org_idx ON projects.project_types USING btree (org...` |
| project_types | project_types_org_name_active_uniq | `CREATE UNIQUE INDEX project_types_org_name_active_uniq ON projects.project_ty...` |
| project_types | project_types_system_name_active_uniq | `CREATE UNIQUE INDEX project_types_system_name_active_uniq ON projects.project...` |
| projects | idx_projects_code | `CREATE INDEX idx_projects_code ON projects.projects USING btree (code)` |
| projects | idx_projects_org_status_active | `CREATE INDEX idx_projects_org_status_active ON projects.projects USING btree ...` |
| projects | projects_created_at_idx | `CREATE INDEX projects_created_at_idx ON projects.projects USING btree (create...` |
| projects | projects_created_by_idx | `CREATE INDEX projects_created_by_idx ON projects.projects USING btree (create...` |
| projects | projects_id_key | `CREATE UNIQUE INDEX projects_id_key ON projects.projects USING btree (id)` |
| projects | projects_modality_idx | `CREATE INDEX projects_modality_idx ON projects.projects USING btree (project_...` |
| projects | projects_org_active_idx | `CREATE INDEX projects_org_active_idx ON projects.projects USING btree (organi...` |
| projects | projects_org_code_uniq | `CREATE UNIQUE INDEX projects_org_code_uniq ON projects.projects USING btree (...` |
| projects | projects_org_idx | `CREATE INDEX projects_org_idx ON projects.projects USING btree (organization_id)` |
| projects | projects_org_name_lower_uniq | `CREATE UNIQUE INDEX projects_org_name_lower_uniq ON projects.projects USING b...` |
| projects | projects_over_limit_idx | `CREATE INDEX projects_over_limit_idx ON projects.projects USING btree (organi...` |
| projects | projects_type_idx | `CREATE INDEX projects_type_idx ON projects.projects USING btree (project_type...` |
