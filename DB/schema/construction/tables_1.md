# Database Schema (Auto-generated)
> Generated: 2026-02-27T17:03:38.530Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONSTRUCTION] Tables (chunk 1: construction.construction_dependencies — construction.site_logs)

### `construction.construction_dependencies`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| predecessor_task_id | uuid | ✗ |  | UNIQUE, FK → construction_tasks.id |
| successor_task_id | uuid | ✗ |  | UNIQUE, FK → construction_tasks.id |
| type | text | ✗ | 'FS'::text | UNIQUE |
| lag_days | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `construction.construction_phase_tasks`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| construction_task_id | uuid | ✗ |  | UNIQUE, FK → construction_tasks.id |
| project_phase_id | uuid | ✗ |  | UNIQUE, FK → construction_project_phases.id |
| created_at | timestamptz | ✓ | now() |  |
| progress_percent | int4 | ✓ | 0 |  |
| project_id | uuid | ✓ |  |  |

### `construction.construction_phases`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| organization_id | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| project_id | uuid | ✓ |  |  |

### `construction.construction_project_phases`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  |  |
| phase_id | uuid | ✗ |  | FK → construction_phases.id |
| start_date | date | ✓ |  |  |
| end_date | date | ✓ |  |  |
| position | int4 | ✓ | 1 |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `construction.construction_task_material_snapshots`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| construction_task_id | uuid | ✗ |  | UNIQUE, FK → construction_tasks.id |
| material_id | uuid | ✗ |  | UNIQUE |
| quantity_planned | numeric | ✗ |  |  |
| amount_per_unit | numeric | ✗ |  |  |
| unit_id | uuid | ✓ |  |  |
| source_task_id | uuid | ✓ |  |  |
| snapshot_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |

### `construction.construction_tasks`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| created_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✗ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| project_id | uuid | ✗ |  |  |
| task_id | uuid | ✓ |  |  |
| quantity | float4 | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| planned_start_date | date | ✓ |  |  |
| planned_end_date | date | ✓ |  |  |
| duration_in_days | int4 | ✓ |  |  |
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| progress_percent | int4 | ✓ | 0 |  |
| description | text | ✓ |  |  |
| cost_scope | cost_scope_enum | ✗ | 'materials_and_labor'::cost_scope_enum |  |
| updated_by | uuid | ✓ |  |  |
| quote_item_id | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| status | text | ✗ | 'pending'::text |  |
| notes | text | ✓ |  |  |
| original_quantity | float4 | ✓ |  |  |
| custom_name | text | ✓ |  |  |
| custom_unit | text | ✓ |  |  |
| actual_start_date | date | ✓ |  |  |
| actual_end_date | date | ✓ |  |  |
| recipe_id | uuid | ✓ |  |  |

### `construction.labor_insurances`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| labor_id | uuid | ✗ |  |  |
| insurance_type | text | ✗ |  |  |
| policy_number | text | ✓ |  |  |
| provider | text | ✓ |  |  |
| coverage_start | date | ✗ |  |  |
| coverage_end | date | ✗ |  |  |
| reminder_days | _int2 | ✓ | ARRAY[30, 15, 7] |  |
| certificate_attachment_id | uuid | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| coverage_range | daterange | ✓ |  |  |

### `construction.personnel_attendees`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| site_log_id | uuid | ✓ |  | FK → site_logs.id |
| attendance_type | text | ✓ | 'full'::text |  |
| hours_worked | numeric | ✓ |  |  |
| description | text | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| project_id | uuid | ✓ |  |  |
| personnel_id | uuid | ✓ |  |  |
| organization_id | uuid | ✓ |  |  |
| work_date | date | ✗ | CURRENT_DATE |  |
| status | text | ✓ |  |  |

### `construction.site_log_types`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| is_system | bool | ✗ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `construction.site_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  |  |
| created_by | uuid | ✓ |  |  |
| log_date | date | ✗ |  |  |
| comments | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| is_public | bool | ✓ | false |  |
| status | site_log_status | ✓ | 'approved'::site_log_status |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_favorite | bool | ✓ | false |  |
| weather | weather_enum | ✓ | 'none'::weather_enum |  |
| organization_id | uuid | ✗ |  |  |
| entry_type_id | uuid | ✓ |  | FK → site_log_types.id |
| severity | site_log_severity | ✓ | 'low'::site_log_severity |  |
| ai_summary | text | ✓ |  |  |
| ai_tags | _text | ✓ |  |  |
| ai_analyzed | bool | ✗ | false |  |
| updated_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
