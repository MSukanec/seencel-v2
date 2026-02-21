# Database Schema (Auto-generated)
> Generated: 2026-02-21T16:47:02.827Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROJECTS] Tables (chunk 1: projects.client_roles — projects.signatures)

### `projects.client_roles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  |  |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| is_system | bool | ✓ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `projects.contact_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| organization_id | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |

### `projects.contact_category_links`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| contact_id | uuid | ✗ |  | UNIQUE, FK → contacts.id |
| contact_category_id | uuid | ✗ |  | UNIQUE, FK → contact_categories.id |
| created_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✗ |  |  |
| updated_at | timestamptz | ✓ | now() |  |

### `projects.contacts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| first_name | text | ✓ |  |  |
| email | text | ✓ |  |  |
| phone | text | ✓ |  |  |
| company_name | text | ✓ |  |  |
| location | text | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| last_name | text | ✓ |  |  |
| linked_user_id | uuid | ✓ |  |  |
| full_name | text | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| national_id | text | ✓ |  | UNIQUE |
| avatar_updated_at | timestamptz | ✓ |  |  |
| is_local | bool | ✗ | true |  |
| display_name_override | text | ✓ |  |  |
| linked_at | timestamptz | ✓ |  |  |
| sync_status | text | ✗ | 'local'::text |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| image_url | text | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| contact_type | text | ✗ | 'person'::text |  |
| company_id | uuid | ✓ |  | FK → contacts.id |

### `projects.labor_insurances`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  | FK → projects.id |
| labor_id | uuid | ✗ |  | FK → project_labor.id |
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

### `projects.personnel_attendees`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| site_log_id | uuid | ✓ |  |  |
| attendance_type | text | ✓ | 'full'::text |  |
| hours_worked | numeric | ✓ |  |  |
| description | text | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| project_id | uuid | ✓ |  | FK → projects.id |
| personnel_id | uuid | ✓ |  | FK → project_labor.id |
| organization_id | uuid | ✓ |  |  |
| work_date | date | ✗ | CURRENT_DATE |  |
| status | text | ✓ |  |  |

### `projects.project_clients`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| contact_id | uuid | ✓ |  | FK → contacts.id |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✗ |  |  |
| is_primary | bool | ✗ | true |  |
| notes | text | ✓ |  |  |
| status | text | ✗ | 'active'::text |  |
| client_role_id | uuid | ✓ |  | FK → client_roles.id |
| created_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `projects.project_data`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| project_id | uuid | ✗ |  | PK, FK → projects.id |
| surface_total | numeric | ✓ |  |  |
| surface_covered | numeric | ✓ |  |  |
| surface_semi | numeric | ✓ |  |  |
| lat | numeric | ✓ |  |  |
| lng | numeric | ✓ |  |  |
| zip_code | text | ✓ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| country | text | ✓ |  |  |
| state | text | ✓ |  |  |
| address | text | ✓ |  |  |
| city | text | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| accessibility_notes | text | ✓ |  |  |
| address_full | text | ✓ |  |  |
| location_type | text | ✓ |  |  |
| place_id | text | ✓ |  |  |
| timezone | text | ✓ |  |  |
| is_public | bool | ✗ | false |  |
| updated_by | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |

### `projects.project_labor`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| contact_id | uuid | ✗ |  | FK → contacts.id |
| notes | text | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✓ |  |  |
| labor_type_id | uuid | ✓ |  |  |
| start_date | date | ✓ |  |  |
| end_date | date | ✓ |  |  |
| status | text | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `projects.project_modalities`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| is_system | bool | ✗ | true |  |
| created_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `projects.project_settings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | UNIQUE, FK → projects.id |
| organization_id | uuid | ✗ |  |  |
| work_days | _int4 | ✗ | '{1,2,3,4,5}'::integer[] |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| use_palette_theme | bool | ✗ | false |  |
| use_custom_color | bool | ✗ | false |  |
| custom_color_h | int4 | ✓ |  |  |
| custom_color_hex | text | ✓ |  |  |

### `projects.project_types`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| is_system | bool | ✗ | false |  |
| organization_id | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `projects.projects`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| created_at | timestamptz | ✗ | now() |  |
| name | text | ✗ |  |  |
| organization_id | uuid | ✗ |  |  |
| is_active | bool | ✗ | true |  |
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| status | project_status | ✗ | 'active'::project_status |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| color | text | ✓ |  |  |
| code | text | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| last_active_at | timestamptz | ✓ |  |  |
| is_over_limit | bool | ✓ | false |  |
| image_url | text | ✓ |  |  |
| project_type_id | uuid | ✓ |  | FK → project_types.id |
| project_modality_id | uuid | ✓ |  | FK → project_modalities.id |
| updated_by | uuid | ✓ |  |  |
| image_palette | jsonb | ✓ |  |  |

### `projects.signatures`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| document_type | text | ✗ |  |  |
| document_id | uuid | ✗ |  |  |
| signer_name | text | ✗ |  |  |
| signer_email | text | ✓ |  |  |
| signer_user_id | uuid | ✓ |  |  |
| signature_url | text | ✗ |  |  |
| signature_method | text | ✗ |  |  |
| ip_address | inet | ✓ |  |  |
| user_agent | text | ✓ |  |  |
| signed_at | timestamptz | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
