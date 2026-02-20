# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONSTRUCTION] Tables (chunk 1: construction.construction_dependencies — construction.quotes)

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
| quote_item_id | uuid | ✓ |  | FK → quote_items.id |
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

### `construction.quote_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| quote_id | uuid | ✗ |  | FK → quotes.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| task_id | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| description | text | ✓ |  |  |
| quantity | numeric | ✗ | 1 |  |
| unit_price | numeric | ✗ | 0 |  |
| currency_id | uuid | ✗ |  |  |
| markup_pct | numeric | ✗ | 0 |  |
| tax_pct | numeric | ✗ | 0 |  |
| created_by | uuid | ✓ |  |  |
| cost_scope | cost_scope_enum | ✗ | 'materials_and_labor'::cost_scope_enum |  |
| sort_key | numeric | ✗ | 0 |  |
| updated_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `construction.quotes`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  | UNIQUE |
| description | text | ✓ |  |  |
| project_id | uuid | ✓ |  | UNIQUE |
| organization_id | uuid | ✗ |  |  |
| status | text | ✗ | 'draft'::text |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| version | int4 | ✗ | 1 | UNIQUE |
| currency_id | uuid | ✗ |  |  |
| exchange_rate | numeric | ✓ |  |  |
| tax_pct | numeric | ✗ | 0 |  |
| tax_label | text | ✓ | '''IVA''::text'::text |  |
| discount_pct | numeric | ✗ | 0 |  |
| client_id | uuid | ✓ |  |  |
| quote_type | text | ✗ | 'quote'::text |  |
| valid_until | date | ✓ |  |  |
| approved_at | timestamptz | ✓ |  |  |
| approved_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| quote_date | date | ✓ |  |  |
| parent_quote_id | uuid | ✓ |  | FK → quotes.id |
| original_contract_value | numeric | ✓ |  |  |
| change_order_number | int4 | ✓ |  |  |
