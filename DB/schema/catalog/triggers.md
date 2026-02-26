# Database Schema (Auto-generated)
> Generated: 2026-02-26T15:52:15.290Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CATALOG] Triggers (38)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| external_service_prices | external_service_prices_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| labor_categories | on_labor_category_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION audit.log_labor_category_activity() |
| labor_categories | set_updated_by_labor_categories | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| labor_prices | on_labor_price_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION audit.log_labor_price_activity() |
| labor_prices | set_updated_by_labor_prices | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| material_types | set_updated_by_material_types | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| material_types | trg_set_updated_at_material_types | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| materials | on_material_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION audit.log_material_activity() |
| materials | set_updated_by_materials | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| organization_task_prices | trg_lock_org_task | BEFORE | UPDATE | EXECUTE FUNCTION catalog.lock_org_task_on_update() |
| task_action_categories | task_action_categories_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_actions | task_kind_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_construction_systems | task_construction_systems_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_divisions | on_task_division_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION audit.log_task_division_activity() |
| task_divisions | set_updated_by_task_divisions | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| task_divisions | task_divisions_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_elements | task_elements_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_parameter_options | task_parameter_options_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_parameters | task_parameters_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_recipe_external_services | on_recipe_external_service_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION audit.log_recipe_external_service_activi... |
| task_recipe_external_services | set_updated_by_task_recipe_external_services | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| task_recipe_external_services | task_recipe_external_services_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_recipe_labor | on_recipe_labor_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION audit.log_recipe_labor_activity() |
| task_recipe_labor | set_updated_by_task_recipe_labor | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| task_recipe_labor | task_recipe_labor_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_recipe_materials | on_recipe_material_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION audit.log_recipe_material_activity() |
| task_recipe_materials | set_updated_by_task_recipe_materials | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| task_recipe_materials | task_recipe_materials_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_recipe_ratings | trg_recalculate_recipe_rating | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION catalog.recalculate_recipe_rating() |
| task_recipes | on_task_recipe_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION audit.log_task_recipe_activity() |
| task_recipes | set_updated_by_task_recipes | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| task_recipes | task_recipes_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| tasks | on_task_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION audit.log_task_activity() |
| tasks | set_updated_by_tasks | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| unit_categories | trg_set_updated_at_unit_categories | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| units | on_unit_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION audit.log_unit_activity() |
| units | set_updated_by_units | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| units | trg_set_updated_at_units | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
