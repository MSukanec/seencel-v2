# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CATALOG] Tables (chunk 1: catalog.labor_categories — catalog.units)

### `catalog.labor_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| organization_id | uuid | ✓ |  |  |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| is_system | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `catalog.labor_levels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| sort_order | int4 | ✗ | 0 |  |

### `catalog.labor_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| labor_type_id | uuid | ✗ |  | FK → labor_types.id |
| organization_id | uuid | ✗ |  |  |
| currency_id | uuid | ✗ |  |  |
| unit_price | numeric | ✗ |  |  |
| valid_from | date | ✗ | CURRENT_DATE |  |
| valid_to | date | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `catalog.labor_roles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| is_system | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `catalog.labor_types`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| labor_category_id | uuid | ✗ |  | FK → labor_categories.id |
| labor_level_id | uuid | ✗ |  | FK → labor_levels.id |
| labor_role_id | uuid | ✓ |  | FK → labor_roles.id |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| unit_id | uuid | ✗ |  | FK → units.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `catalog.material_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| name | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| parent_id | uuid | ✓ |  | FK → material_categories.id |

### `catalog.material_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| material_id | uuid | ✗ |  | FK → materials.id |
| organization_id | uuid | ✗ |  |  |
| currency_id | uuid | ✗ |  |  |
| unit_price | numeric | ✗ |  |  |
| valid_from | date | ✗ | CURRENT_DATE |  |
| valid_to | date | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `catalog.materials`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| name | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| unit_id | uuid | ✓ |  | FK → units.id |
| category_id | uuid | ✓ |  | FK → material_categories.id |
| updated_at | timestamptz | ✓ | now() |  |
| is_system | bool | ✓ | false |  |
| organization_id | uuid | ✓ |  |  |
| default_sale_unit_id | uuid | ✓ |  | FK → units.id |
| is_completed | bool | ✓ | false |  |
| material_type | text | ✓ | 'material'::text |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| code | text | ✓ |  |  |
| description | text | ✓ |  |  |
| default_provider_id | uuid | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |
| default_sale_unit_quantity | numeric | ✓ |  |  |

### `catalog.organization_material_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| material_id | uuid | ✗ |  | FK → materials.id |
| unit_price | float8 | ✗ |  |  |
| currency_id | uuid | ✗ |  |  |
| is_default | bool | ✓ | false |  |
| source | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `catalog.task_action_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  | UNIQUE |
| code | varchar(20) | ✗ |  | UNIQUE |
| description | text | ✓ |  |  |
| sort_order | int4 | ✗ | 0 |  |
| is_system | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `catalog.task_actions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| name | text | ✓ |  | UNIQUE |
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| description | text | ✓ |  |  |
| short_code | varchar(10) | ✓ |  |  |
| is_system | bool | ✗ | true |  |
| action_category_id | uuid | ✓ |  | FK → task_action_categories.id |

### `catalog.task_construction_systems`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| name | text | ✗ |  | UNIQUE |
| slug | text | ✗ |  | UNIQUE |
| description | text | ✓ |  |  |
| code | varchar(10) | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| category | text | ✓ |  |  |
| expression_template | text | ✓ |  |  |

### `catalog.task_divisions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| order | int4 | ✓ |  |  |
| code | text | ✓ |  |  |
| parent_id | uuid | ✓ |  | FK → task_divisions.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| organization_id | uuid | ✓ |  |  |
| is_system | bool | ✗ | true |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |

### `catalog.task_element_actions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| action_id | uuid | ✗ |  | PK, FK → task_actions.id |
| element_id | uuid | ✗ |  | PK, FK → task_elements.id |
| created_at | timestamptz | ✓ | now() |  |

### `catalog.task_element_systems`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| element_id | uuid | ✗ |  | PK, FK → task_elements.id |
| system_id | uuid | ✗ |  | PK, FK → task_construction_systems.id |
| created_at | timestamptz | ✓ | now() |  |

### `catalog.task_elements`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| name | text | ✗ |  |  |
| slug | text | ✗ |  |  |
| description | text | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| code | varchar(4) | ✓ |  |  |
| element_type | text | ✗ |  |  |
| is_system | bool | ✗ | true |  |
| expression_template | text | ✓ |  |  |

### `catalog.task_parameter_options`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| parameter_id | uuid | ✓ |  | FK → task_parameters.id |
| label | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| name | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| description | text | ✓ |  |  |
| unit_id | uuid | ✓ |  | FK → units.id |
| value | text | ✓ |  |  |
| order | int4 | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| short_code | varchar(10) | ✓ |  |  |
| material_id | uuid | ✓ |  | FK → materials.id |

### `catalog.task_parameters`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| slug | text | ✗ |  |  |
| label | text | ✗ |  |  |
| type | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| expression_template | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_required | bool | ✓ | true |  |
| description | text | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| value_unit | text | ✓ |  |  |
| semantic_group | text | ✓ |  |  |
| affects_recipe | bool | ✗ | true |  |

### `catalog.task_recipe_external_services`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipe_id | uuid | ✗ |  | FK → task_recipes.id |
| organization_id | uuid | ✗ |  |  |
| name | text | ✗ |  |  |
| unit_id | uuid | ✓ |  | FK → units.id |
| unit_price | numeric | ✗ | 0 |  |
| currency_id | uuid | ✗ |  |  |
| contact_id | uuid | ✓ |  |  |
| notes | text | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |
| includes_materials | bool | ✗ | false |  |

### `catalog.task_recipe_labor`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipe_id | uuid | ✗ |  | FK → task_recipes.id |
| labor_type_id | uuid | ✗ |  | FK → labor_types.id |
| quantity | numeric | ✗ |  |  |
| unit_id | uuid | ✓ |  | FK → units.id |
| notes | text | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |

### `catalog.task_recipe_materials`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipe_id | uuid | ✗ |  | FK → task_recipes.id |
| material_id | uuid | ✗ |  | FK → materials.id |
| quantity | numeric | ✗ |  |  |
| unit_id | uuid | ✓ |  | FK → units.id |
| notes | text | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |
| waste_percentage | numeric | ✗ | 0 |  |
| total_quantity | numeric | ✓ |  |  |

### `catalog.task_recipe_ratings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipe_id | uuid | ✗ |  | UNIQUE, FK → task_recipes.id |
| organization_id | uuid | ✗ |  | UNIQUE |
| user_id | uuid | ✗ |  |  |
| rating | int4 | ✗ |  |  |
| comment | text | ✓ |  |  |
| is_verified_usage | bool | ✗ | false |  |
| construction_task_id | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `catalog.task_recipes`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| task_id | uuid | ✗ |  | FK → tasks.id |
| organization_id | uuid | ✗ |  |  |
| is_public | bool | ✗ | false |  |
| region | text | ✓ |  |  |
| rating_avg | numeric | ✓ |  |  |
| rating_count | int4 | ✗ | 0 |  |
| usage_count | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |
| name | text | ✓ |  |  |
| execution_type | text | ✗ | 'own'::text |  |
| status | task_catalog_status | ✗ | 'draft'::task_catalog_status |  |

### `catalog.task_system_parameters`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| system_id | uuid | ✗ |  | PK, FK → task_construction_systems.id |
| parameter_id | uuid | ✗ |  | PK, FK → task_parameters.id |
| order | int4 | ✓ | 0 |  |
| is_required | bool | ✓ | true |  |
| created_at | timestamptz | ✓ | now() |  |

### `catalog.task_template_parameters`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| template_id | uuid | ✗ |  | PK, FK → task_templates.id |
| parameter_id | uuid | ✗ |  | PK, FK → task_parameters.id |
| order | int4 | ✗ | 0 |  |
| is_required | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| default_value | text | ✓ |  |  |

### `catalog.task_templates`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| task_action_id | uuid | ✗ |  | FK → task_actions.id |
| task_element_id | uuid | ✗ |  | FK → task_elements.id |
| task_construction_system_id | uuid | ✗ |  | FK → task_construction_systems.id |
| task_division_id | uuid | ✓ |  | FK → task_divisions.id |
| unit_id | uuid | ✗ |  | FK → units.id |
| is_system | bool | ✗ | true |  |
| status | task_catalog_status | ✗ | 'draft'::task_catalog_status |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| code | varchar(20) | ✓ |  |  |

### `catalog.tasks`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| code | text | ✓ |  |  |
| unit_id | uuid | ✗ |  | FK → units.id |
| organization_id | uuid | ✓ |  |  |
| is_system | bool | ✓ | true |  |
| custom_name | text | ✓ |  |  |
| task_division_id | uuid | ✓ |  | FK → task_divisions.id |
| description | text | ✓ |  |  |
| name | text | ✓ |  |  |
| is_published | bool | ✓ | false |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| task_action_id | uuid | ✓ |  | FK → task_actions.id |
| task_element_id | uuid | ✓ |  | FK → task_elements.id |
| is_parametric | bool | ✗ | false |  |
| parameter_values | jsonb | ✓ | '{}'::jsonb |  |
| import_batch_id | uuid | ✓ |  |  |
| status | task_catalog_status | ✗ | 'draft'::task_catalog_status |  |
| task_construction_system_id | uuid | ✓ |  | FK → task_construction_systems.id |
| template_id | uuid | ✓ |  | FK → task_templates.id |

### `catalog.unit_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| code | text | ✗ |  | UNIQUE |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `catalog.units`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| name | text | ✗ |  |  |
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| symbol | text | ✓ |  |  |
| applicable_to | _text | ✗ | ARRAY['task'::text, 'material'::text,... |  |
| organization_id | uuid | ✓ |  |  |
| unit_category_id | uuid | ✓ |  | FK → unit_categories.id |
| is_system | bool | ✗ | false |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
