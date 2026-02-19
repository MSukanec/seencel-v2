# Database Schema (Auto-generated)
> Generated: 2026-02-19T19:04:24.438Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONSTRUCTION] Indexes (32, excluding PKs)

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
| quote_items | idx_quote_items_not_deleted | `CREATE INDEX idx_quote_items_not_deleted ON construction.quote_items USING bt...` |
| quote_items | idx_quote_items_sort | `CREATE INDEX idx_quote_items_sort ON construction.quote_items USING btree (qu...` |
| quote_items | idx_quote_items_updated_by | `CREATE INDEX idx_quote_items_updated_by ON construction.quote_items USING btr...` |
| quote_items | quote_items_id_key | `CREATE UNIQUE INDEX quote_items_id_key ON construction.quote_items USING btre...` |
| quotes | idx_quotes_client | `CREATE INDEX idx_quotes_client ON construction.quotes USING btree (client_id)` |
| quotes | idx_quotes_created | `CREATE INDEX idx_quotes_created ON construction.quotes USING btree (created_by)` |
| quotes | idx_quotes_not_deleted | `CREATE INDEX idx_quotes_not_deleted ON construction.quotes USING btree (is_de...` |
| quotes | idx_quotes_org | `CREATE INDEX idx_quotes_org ON construction.quotes USING btree (organization_id)` |
| quotes | idx_quotes_org_active | `CREATE INDEX idx_quotes_org_active ON construction.quotes USING btree (organi...` |
| quotes | idx_quotes_parent_quote | `CREATE INDEX idx_quotes_parent_quote ON construction.quotes USING btree (pare...` |
| quotes | idx_quotes_project | `CREATE INDEX idx_quotes_project ON construction.quotes USING btree (project_id)` |
| quotes | idx_quotes_status | `CREATE INDEX idx_quotes_status ON construction.quotes USING btree (status)` |
| quotes | idx_quotes_type | `CREATE INDEX idx_quotes_type ON construction.quotes USING btree (quote_type)` |
| quotes | idx_quotes_updated_by | `CREATE INDEX idx_quotes_updated_by ON construction.quotes USING btree (update...` |
| quotes | ux_quotes_project_name_version | `CREATE UNIQUE INDEX ux_quotes_project_name_version ON construction.quotes USI...` |
