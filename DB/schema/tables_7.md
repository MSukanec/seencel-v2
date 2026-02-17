# Database Schema (Auto-generated)
> Generated: 2026-02-17T17:51:37.665Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Tables (chunk 7: task_actions — user_view_history)

### `task_actions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| name | text | ✓ |  | UNIQUE |
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| description | text | ✓ |  |  |
| short_code | varchar(10) | ✓ |  |  |

### `task_construction_systems`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| name | text | ✗ |  | UNIQUE |
| slug | text | ✗ |  | UNIQUE |
| description | text | ✓ |  |  |
| code | varchar(10) | ✓ |  |  |
| icon | text | ✓ |  |  |
| order | int4 | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `task_division_actions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| division_id | uuid | ✗ |  | PK, FK → task_divisions.id |
| action_id | uuid | ✗ |  | PK, FK → task_actions.id |
| created_at | timestamptz | ✓ | now() |  |

### `task_division_elements`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| division_id | uuid | ✗ |  | PK, FK → task_divisions.id |
| element_id | uuid | ✗ |  | PK, FK → task_elements.id |
| created_at | timestamptz | ✓ | now() |  |

### `task_divisions`

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
| organization_id | uuid | ✓ |  | FK → organizations.id |
| is_system | bool | ✗ | true |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |

### `task_element_actions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| action_id | uuid | ✗ |  | PK, FK → task_actions.id |
| element_id | uuid | ✗ |  | PK, FK → task_elements.id |
| created_at | timestamptz | ✓ | now() |  |

### `task_element_parameters`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| element_id | uuid | ✗ |  | PK, FK → task_elements.id |
| parameter_id | uuid | ✗ |  | PK, FK → task_parameters.id |
| order | int4 | ✓ | 0 |  |
| is_required | bool | ✓ | true |  |
| created_at | timestamptz | ✓ | now() |  |

### `task_element_systems`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| element_id | uuid | ✗ |  | PK, FK → task_elements.id |
| system_id | uuid | ✗ |  | PK, FK → task_construction_systems.id |
| created_at | timestamptz | ✓ | now() |  |

### `task_elements`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| name | text | ✗ |  |  |
| slug | text | ✗ |  |  |
| description | text | ✓ |  |  |
| icon | text | ✓ |  |  |
| order | int4 | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| code | varchar(4) | ✓ |  |  |
| default_unit_id | uuid | ✓ |  | FK → units.id |

### `task_parameter_options`

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

### `task_parameters`

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
| order | int4 | ✓ |  |  |
| description | text | ✓ |  |  |
| default_value | text | ✓ |  |  |
| validation_rules | jsonb | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `task_recipe_external_services`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipe_id | uuid | ✗ |  | FK → task_recipes.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| name | text | ✗ |  |  |
| unit_id | uuid | ✓ |  | FK → units.id |
| unit_price | numeric | ✗ | 0 |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| contact_id | uuid | ✓ |  | FK → contacts.id |
| notes | text | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |
| includes_materials | bool | ✗ | false |  |

### `task_recipe_labor`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipe_id | uuid | ✗ |  | FK → task_recipes.id |
| labor_type_id | uuid | ✗ |  | FK → labor_types.id |
| quantity | numeric | ✗ |  |  |
| unit_id | uuid | ✓ |  | FK → units.id |
| notes | text | ✓ |  |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |

### `task_recipe_materials`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipe_id | uuid | ✗ |  | FK → task_recipes.id |
| material_id | uuid | ✗ |  | FK → materials.id |
| quantity | numeric | ✗ |  |  |
| unit_id | uuid | ✓ |  | FK → units.id |
| notes | text | ✓ |  |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |
| waste_percentage | numeric | ✗ | 0 |  |
| total_quantity | numeric | ✓ |  |  |

### `task_recipe_ratings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipe_id | uuid | ✗ |  | UNIQUE, FK → task_recipes.id |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| user_id | uuid | ✗ |  | FK → users.id |
| rating | int4 | ✗ |  |  |
| comment | text | ✓ |  |  |
| is_verified_usage | bool | ✗ | false |  |
| construction_task_id | uuid | ✓ |  | FK → construction_tasks.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `task_recipes`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| task_id | uuid | ✗ |  | FK → tasks.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| is_public | bool | ✗ | false |  |
| region | text | ✓ |  |  |
| rating_avg | numeric | ✓ |  |  |
| rating_count | int4 | ✗ | 0 |  |
| usage_count | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |
| name | text | ✓ |  |  |
| execution_type | text | ✗ | 'own'::text |  |

### `task_task_parameters`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| task_id | uuid | ✗ |  | UNIQUE, FK → tasks.id |
| parameter_id | uuid | ✗ |  | UNIQUE, FK → task_parameters.id |
| default_value | text | ✓ |  |  |
| is_required | bool | ✗ | true |  |
| order | int4 | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `tasks`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| code | text | ✓ |  |  |
| unit_id | uuid | ✗ |  | FK → units.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| is_system | bool | ✓ | true |  |
| custom_name | text | ✓ |  |  |
| task_division_id | uuid | ✓ |  | FK → task_divisions.id |
| description | text | ✓ |  |  |
| name | text | ✓ |  |  |
| is_published | bool | ✓ | false |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| task_action_id | uuid | ✓ |  | FK → task_actions.id |
| task_element_id | uuid | ✓ |  | FK → task_elements.id |
| is_parametric | bool | ✗ | false |  |
| parameter_values | jsonb | ✓ | '{}'::jsonb |  |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |

### `tax_labels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| code | text | ✗ |  | UNIQUE |
| name | text | ✗ |  |  |
| country_codes | _text | ✓ |  |  |
| is_system | bool | ✓ | true |  |

### `testimonials`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| course_id | uuid | ✓ |  | FK → courses.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| product_id | uuid | ✓ |  |  |
| author_name | text | ✗ |  |  |
| author_title | text | ✓ |  |  |
| author_avatar_url | text | ✓ |  |  |
| content | text | ✗ |  |  |
| rating | int4 | ✓ |  |  |
| is_featured | bool | ✓ | false |  |
| is_active | bool | ✓ | true |  |
| sort_index | int4 | ✓ | 0 |  |
| is_deleted | bool | ✓ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| user_id | uuid | ✓ |  | FK → users.id |

### `unit_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| code | text | ✗ |  | UNIQUE |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `units`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| name | text | ✗ |  |  |
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| symbol | text | ✓ |  |  |
| applicable_to | _text | ✗ | ARRAY['task'::text, 'material'::text,... |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| unit_category_id | uuid | ✓ |  | FK → unit_categories.id |
| is_system | bool | ✗ | false |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `user_acquisition`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| source | text | ✗ |  |  |
| medium | text | ✓ |  |  |
| campaign | text | ✓ |  |  |
| content | text | ✓ |  |  |
| landing_page | text | ✓ |  |  |
| referrer | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |

### `user_data`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| country | uuid | ✓ |  | FK → countries.id |
| created_at | timestamptz | ✓ | now() |  |
| birthdate | date | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| first_name | text | ✓ |  |  |
| last_name | text | ✓ |  |  |
| phone_e164 | text | ✓ |  |  |

### `user_insight_interactions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE |
| insight_id | text | ✗ |  | UNIQUE |
| interaction_type | text | ✗ |  | UNIQUE |
| metadata | jsonb | ✓ | '{}'::jsonb |  |
| created_at | timestamptz | ✓ | now() |  |

### `user_notifications`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| notification_id | uuid | ✗ |  | UNIQUE, FK → notifications.id |
| delivered_at | timestamptz | ✗ | now() |  |
| read_at | timestamptz | ✓ |  |  |
| clicked_at | timestamptz | ✓ |  |  |

### `user_organization_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| last_project_id | uuid | ✓ |  | FK → projects.id |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `user_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| last_organization_id | uuid | ✓ |  | FK → organizations.id |
| theme | text | ✓ | 'dark'::text |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| home_checklist | jsonb | ✗ | '{"create_contact": false, "create_pr... |  |
| home_banner_dismissed | bool | ✗ | false |  |
| layout | text | ✗ | 'classic'::text |  |
| language | text | ✗ | 'es'::text |  |
| sidebar_mode | text | ✗ | 'docked'::text |  |
| timezone | text | ✓ | 'UTC'::text |  |

### `user_presence`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| user_id | uuid | ✗ |  | PK, UNIQUE, FK → users.id |
| org_id | uuid | ✗ |  |  |
| last_seen_at | timestamptz | ✗ | now() |  |
| status | text | ✗ | 'online'::text |  |
| user_agent | text | ✓ |  |  |
| locale | text | ✓ |  |  |
| updated_from | text | ✓ |  |  |
| current_view | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| session_id | uuid | ✓ |  |  |

### `user_view_history`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| view_name | text | ✗ |  |  |
| entered_at | timestamptz | ✗ | now() |  |
| exited_at | timestamptz | ✓ |  |  |
| duration_seconds | int4 | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| session_id | uuid | ✓ |  |  |
