# Database Schema (Auto-generated)
> Generated: 2026-02-21T13:42:37.043Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CATALOG] Indexes (79, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| labor_categories | labor_categories_id_key | `CREATE UNIQUE INDEX labor_categories_id_key ON catalog.labor_categories USING...` |
| labor_categories | labor_categories_system_name_unique | `CREATE UNIQUE INDEX labor_categories_system_name_unique ON catalog.labor_cate...` |
| labor_prices | labor_prices_type_org_idx | `CREATE INDEX labor_prices_type_org_idx ON catalog.labor_prices USING btree (l...` |
| material_categories | material_categories_unique_name | `CREATE UNIQUE INDEX material_categories_unique_name ON catalog.material_categ...` |
| material_prices | material_prices_material_org_idx | `CREATE INDEX material_prices_material_org_idx ON catalog.material_prices USIN...` |
| materials | idx_materials_code_org | `CREATE INDEX idx_materials_code_org ON catalog.materials USING btree (code, o...` |
| materials | idx_materials_default_provider | `CREATE INDEX idx_materials_default_provider ON catalog.materials USING btree ...` |
| materials | idx_materials_import_batch | `CREATE INDEX idx_materials_import_batch ON catalog.materials USING btree (imp...` |
| materials | idx_materials_is_deleted | `CREATE INDEX idx_materials_is_deleted ON catalog.materials USING btree (is_de...` |
| materials | idx_materials_org_deleted | `CREATE INDEX idx_materials_org_deleted ON catalog.materials USING btree (orga...` |
| materials | materials_id_key | `CREATE UNIQUE INDEX materials_id_key ON catalog.materials USING btree (id)` |
| materials | materials_name_org_unique | `CREATE UNIQUE INDEX materials_name_org_unique ON catalog.materials USING btre...` |
| materials | materials_name_system_unique | `CREATE UNIQUE INDEX materials_name_system_unique ON catalog.materials USING b...` |
| organization_material_prices | unique_org_material | `CREATE UNIQUE INDEX unique_org_material ON catalog.organization_material_pric...` |
| task_action_categories | task_action_categories_code_key | `CREATE UNIQUE INDEX task_action_categories_code_key ON catalog.task_action_ca...` |
| task_action_categories | task_action_categories_name_key | `CREATE UNIQUE INDEX task_action_categories_name_key ON catalog.task_action_ca...` |
| task_actions | idx_task_actions_category_id | `CREATE INDEX idx_task_actions_category_id ON catalog.task_actions USING btree...` |
| task_actions | task_kind_name_key | `CREATE UNIQUE INDEX task_kind_name_key ON catalog.task_actions USING btree (n...` |
| task_construction_systems | idx_task_construction_systems_not_deleted | `CREATE INDEX idx_task_construction_systems_not_deleted ON catalog.task_constr...` |
| task_construction_systems | task_construction_systems_name_key | `CREATE UNIQUE INDEX task_construction_systems_name_key ON catalog.task_constr...` |
| task_construction_systems | task_construction_systems_slug_key | `CREATE UNIQUE INDEX task_construction_systems_slug_key ON catalog.task_constr...` |
| task_construction_systems | task_construction_systems_slug_uniq | `CREATE UNIQUE INDEX task_construction_systems_slug_uniq ON catalog.task_const...` |
| task_divisions | idx_task_divisions_import_batch_id | `CREATE INDEX idx_task_divisions_import_batch_id ON catalog.task_divisions USI...` |
| task_divisions | idx_task_divisions_not_deleted | `CREATE INDEX idx_task_divisions_not_deleted ON catalog.task_divisions USING b...` |
| task_divisions | idx_task_divisions_org | `CREATE INDEX idx_task_divisions_org ON catalog.task_divisions USING btree (or...` |
| task_elements | idx_task_elements_element_type | `CREATE UNIQUE INDEX idx_task_elements_element_type ON catalog.task_elements U...` |
| task_elements | idx_task_elements_not_deleted | `CREATE INDEX idx_task_elements_not_deleted ON catalog.task_elements USING btr...` |
| task_elements | task_elements_slug_uniq | `CREATE UNIQUE INDEX task_elements_slug_uniq ON catalog.task_elements USING bt...` |
| task_parameter_options | idx_task_parameter_options_not_deleted | `CREATE INDEX idx_task_parameter_options_not_deleted ON catalog.task_parameter...` |
| task_parameter_options | idx_task_parameter_options_parameter_id | `CREATE INDEX idx_task_parameter_options_parameter_id ON catalog.task_paramete...` |
| task_parameters | idx_task_parameters_not_deleted | `CREATE INDEX idx_task_parameters_not_deleted ON catalog.task_parameters USING...` |
| task_parameters | idx_task_parameters_slug | `CREATE INDEX idx_task_parameters_slug ON catalog.task_parameters USING btree ...` |
| task_parameters | idx_task_parameters_slug_unique | `CREATE UNIQUE INDEX idx_task_parameters_slug_unique ON catalog.task_parameter...` |
| task_recipe_external_services | idx_task_recipe_ext_services_org | `CREATE INDEX idx_task_recipe_ext_services_org ON catalog.task_recipe_external...` |
| task_recipe_external_services | idx_task_recipe_ext_services_recipe | `CREATE INDEX idx_task_recipe_ext_services_recipe ON catalog.task_recipe_exter...` |
| task_recipe_labor | idx_trl_import_batch_id | `CREATE INDEX idx_trl_import_batch_id ON catalog.task_recipe_labor USING btree...` |
| task_recipe_labor | idx_trl_labor_type | `CREATE INDEX idx_trl_labor_type ON catalog.task_recipe_labor USING btree (lab...` |
| task_recipe_labor | idx_trl_org | `CREATE INDEX idx_trl_org ON catalog.task_recipe_labor USING btree (organizati...` |
| task_recipe_labor | idx_trl_recipe | `CREATE INDEX idx_trl_recipe ON catalog.task_recipe_labor USING btree (recipe_...` |
| task_recipe_materials | idx_trm_import_batch_id | `CREATE INDEX idx_trm_import_batch_id ON catalog.task_recipe_materials USING b...` |
| task_recipe_materials | idx_trm_material | `CREATE INDEX idx_trm_material ON catalog.task_recipe_materials USING btree (m...` |
| task_recipe_materials | idx_trm_org | `CREATE INDEX idx_trm_org ON catalog.task_recipe_materials USING btree (organi...` |
| task_recipe_materials | idx_trm_recipe | `CREATE INDEX idx_trm_recipe ON catalog.task_recipe_materials USING btree (rec...` |
| task_recipe_ratings | idx_task_recipe_ratings_org | `CREATE INDEX idx_task_recipe_ratings_org ON catalog.task_recipe_ratings USING...` |
| task_recipe_ratings | idx_task_recipe_ratings_recipe | `CREATE INDEX idx_task_recipe_ratings_recipe ON catalog.task_recipe_ratings US...` |
| task_recipe_ratings | task_recipe_ratings_unique | `CREATE UNIQUE INDEX task_recipe_ratings_unique ON catalog.task_recipe_ratings...` |
| task_recipes | idx_task_recipes_import_batch_id | `CREATE INDEX idx_task_recipes_import_batch_id ON catalog.task_recipes USING b...` |
| task_recipes | idx_task_recipes_org | `CREATE INDEX idx_task_recipes_org ON catalog.task_recipes USING btree (organi...` |
| task_recipes | idx_task_recipes_public | `CREATE INDEX idx_task_recipes_public ON catalog.task_recipes USING btree (is_...` |
| task_recipes | idx_task_recipes_task | `CREATE INDEX idx_task_recipes_task ON catalog.task_recipes USING btree (task_...` |
| task_system_parameters | idx_task_system_parameters_parameter_id | `CREATE INDEX idx_task_system_parameters_parameter_id ON catalog.task_system_p...` |
| task_system_parameters | idx_task_system_parameters_system_id | `CREATE INDEX idx_task_system_parameters_system_id ON catalog.task_system_para...` |
| task_template_parameters | idx_task_template_parameters_template_id | `CREATE INDEX idx_task_template_parameters_template_id ON catalog.task_templat...` |
| task_templates | idx_task_templates_action_id | `CREATE INDEX idx_task_templates_action_id ON catalog.task_templates USING btr...` |
| task_templates | idx_task_templates_code | `CREATE UNIQUE INDEX idx_task_templates_code ON catalog.task_templates USING b...` |
| task_templates | idx_task_templates_element_id | `CREATE INDEX idx_task_templates_element_id ON catalog.task_templates USING bt...` |
| task_templates | idx_task_templates_status | `CREATE INDEX idx_task_templates_status ON catalog.task_templates USING btree ...` |
| task_templates | idx_task_templates_system_id | `CREATE INDEX idx_task_templates_system_id ON catalog.task_templates USING btr...` |
| task_templates | idx_task_templates_unique_combination | `CREATE UNIQUE INDEX idx_task_templates_unique_combination ON catalog.task_tem...` |
| tasks | idx_tasks_construction_system_id | `CREATE INDEX idx_tasks_construction_system_id ON catalog.tasks USING btree (t...` |
| tasks | idx_tasks_import_batch_id | `CREATE INDEX idx_tasks_import_batch_id ON catalog.tasks USING btree (import_b...` |
| tasks | idx_tasks_template_id | `CREATE INDEX idx_tasks_template_id ON catalog.tasks USING btree (template_id)...` |
| tasks | idx_tasks_unique_system_code | `CREATE UNIQUE INDEX idx_tasks_unique_system_code ON catalog.tasks USING btree...` |
| tasks | tasks_active_idx | `CREATE INDEX tasks_active_idx ON catalog.tasks USING btree (organization_id, ...` |
| tasks | tasks_code_lower_uniq | `CREATE UNIQUE INDEX tasks_code_lower_uniq ON catalog.tasks USING btree (organ...` |
| tasks | tasks_custom_name_org_uniq | `CREATE UNIQUE INDEX tasks_custom_name_org_uniq ON catalog.tasks USING btree (...` |
| tasks | tasks_custom_name_system_uniq | `CREATE UNIQUE INDEX tasks_custom_name_system_uniq ON catalog.tasks USING btre...` |
| tasks | tasks_division_idx | `CREATE INDEX tasks_division_idx ON catalog.tasks USING btree (task_division_id)` |
| tasks | tasks_org_idx | `CREATE INDEX tasks_org_idx ON catalog.tasks USING btree (organization_id)` |
| tasks | tasks_parametric_signature_uniq | `CREATE UNIQUE INDEX tasks_parametric_signature_uniq ON catalog.tasks USING bt...` |
| tasks | tasks_unit_idx | `CREATE INDEX tasks_unit_idx ON catalog.tasks USING btree (unit_id)` |
| unit_categories | idx_unit_categories_name | `CREATE INDEX idx_unit_categories_name ON catalog.unit_categories USING btree ...` |
| unit_categories | unit_categories_code_unique | `CREATE UNIQUE INDEX unit_categories_code_unique ON catalog.unit_categories US...` |
| units | idx_units_category | `CREATE INDEX idx_units_category ON catalog.units USING btree (unit_category_id)` |
| units | idx_units_list | `CREATE INDEX idx_units_list ON catalog.units USING btree (is_system, organiza...` |
| units | idx_units_organization | `CREATE INDEX idx_units_organization ON catalog.units USING btree (organizatio...` |
| units | units_id_key1 | `CREATE UNIQUE INDEX units_id_key1 ON catalog.units USING btree (id)` |
| units | uq_units_org_name | `CREATE UNIQUE INDEX uq_units_org_name ON catalog.units USING btree (organizat...` |
| units | uq_units_system_name | `CREATE UNIQUE INDEX uq_units_system_name ON catalog.units USING btree (lower(...` |
