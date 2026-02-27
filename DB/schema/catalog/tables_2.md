# Database Schema (Auto-generated)
> Generated: 2026-02-26T22:25:46.213Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CATALOG] Tables (chunk 2: catalog.task_templates — catalog.units)

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
