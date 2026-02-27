# Database Schema (Auto-generated)
> Generated: 2026-02-26T22:25:46.213Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONSTRUCTION] Indexes (35, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| construction_dependencies | construction_dependencies_unique | `CREATE UNIQUE INDEX construction_dependencies_unique ON construction.construc...` |
| construction_dependencies | idx_construction_dependencies_organization | `CREATE INDEX idx_construction_dependencies_organization ON construction.const...` |
| construction_dependencies | idx_construction_dependencies_predecessor | `CREATE INDEX idx_construction_dependencies_predecessor ON construction.constr...` |
| construction_dependencies | idx_construction_dependencies_successor | `CREATE INDEX idx_construction_dependencies_successor ON construction.construc...` |
| construction_phase_tasks | unique_phase_task | `CREATE UNIQUE INDEX unique_phase_task ON construction.construction_phase_task...` |
| construction_task_material_snapshots | ctms_unique_material | `CREATE UNIQUE INDEX ctms_unique_material ON construction.construction_task_ma...` |
| construction_task_material_snapshots | idx_ctms_construction_task | `CREATE INDEX idx_ctms_construction_task ON construction.construction_task_mat...` |
| construction_task_material_snapshots | idx_ctms_material | `CREATE INDEX idx_ctms_material ON construction.construction_task_material_sna...` |
| construction_task_material_snapshots | idx_ctms_organization | `CREATE INDEX idx_ctms_organization ON construction.construction_task_material...` |
| construction_task_material_snapshots | idx_ctms_project | `CREATE INDEX idx_ctms_project ON construction.construction_task_material_snap...` |
| construction_tasks | construction_tasks_id_key | `CREATE UNIQUE INDEX construction_tasks_id_key ON construction.construction_ta...` |
| construction_tasks | idx_construction_tasks_not_deleted | `CREATE INDEX idx_construction_tasks_not_deleted ON construction.construction_...` |
| construction_tasks | idx_construction_tasks_organization_id | `CREATE INDEX idx_construction_tasks_organization_id ON construction.construct...` |
| construction_tasks | idx_construction_tasks_project_id | `CREATE INDEX idx_construction_tasks_project_id ON construction.construction_t...` |
| construction_tasks | idx_construction_tasks_quote_item_id | `CREATE INDEX idx_construction_tasks_quote_item_id ON construction.constructio...` |
| construction_tasks | idx_construction_tasks_recipe_id | `CREATE INDEX idx_construction_tasks_recipe_id ON construction.construction_ta...` |
| construction_tasks | idx_construction_tasks_status | `CREATE INDEX idx_construction_tasks_status ON construction.construction_tasks...` |
| site_log_types | site_log_types_not_deleted_idx | `CREATE INDEX site_log_types_not_deleted_idx ON construction.site_log_types US...` |
| site_log_types | site_log_types_org_idx | `CREATE INDEX site_log_types_org_idx ON construction.site_log_types USING btre...` |
| site_log_types | site_log_types_org_name_uniq | `CREATE UNIQUE INDEX site_log_types_org_name_uniq ON construction.site_log_typ...` |
| site_log_types | site_log_types_org_not_deleted_idx | `CREATE INDEX site_log_types_org_not_deleted_idx ON construction.site_log_type...` |
| site_log_types | site_log_types_system_idx | `CREATE INDEX site_log_types_system_idx ON construction.site_log_types USING b...` |
| site_log_types | site_log_types_system_name_uniq | `CREATE UNIQUE INDEX site_log_types_system_name_uniq ON construction.site_log_...` |
| site_logs | site_logs_ai_analyzed_idx | `CREATE INDEX site_logs_ai_analyzed_idx ON construction.site_logs USING btree ...` |
| site_logs | site_logs_ai_full_idx | `CREATE INDEX site_logs_ai_full_idx ON construction.site_logs USING btree (org...` |
| site_logs | site_logs_created_by_idx | `CREATE INDEX site_logs_created_by_idx ON construction.site_logs USING btree (...` |
| site_logs | site_logs_date_idx | `CREATE INDEX site_logs_date_idx ON construction.site_logs USING btree (log_da...` |
| site_logs | site_logs_favorite_idx | `CREATE INDEX site_logs_favorite_idx ON construction.site_logs USING btree (is...` |
| site_logs | site_logs_not_deleted_date_idx | `CREATE INDEX site_logs_not_deleted_date_idx ON construction.site_logs USING b...` |
| site_logs | site_logs_not_deleted_pub_idx | `CREATE INDEX site_logs_not_deleted_pub_idx ON construction.site_logs USING bt...` |
| site_logs | site_logs_org_idx | `CREATE INDEX site_logs_org_idx ON construction.site_logs USING btree (organiz...` |
| site_logs | site_logs_org_project_date_idx | `CREATE INDEX site_logs_org_project_date_idx ON construction.site_logs USING b...` |
| site_logs | site_logs_project_idx | `CREATE INDEX site_logs_project_idx ON construction.site_logs USING btree (pro...` |
| site_logs | site_logs_public_idx | `CREATE INDEX site_logs_public_idx ON construction.site_logs USING btree (is_p...` |
| site_logs | site_logs_status_idx | `CREATE INDEX site_logs_status_idx ON construction.site_logs USING btree (status)` |
