# Database Schema (Auto-generated)
> Generated: 2026-02-26T22:25:46.213Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROJECTS] Tables (chunk 1: projects.client_portal_branding — projects.projects)

### `projects.client_portal_branding`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | UNIQUE, FK → projects.id |
| organization_id | uuid | ✗ |  |  |
| portal_name | text | ✓ |  |  |
| welcome_message | text | ✓ |  |  |
| primary_color | text | ✓ | '#83cc16'::text |  |
| background_color | text | ✓ | '#09090b'::text |  |
| show_footer | bool | ✓ | true |  |
| footer_text | text | ✓ |  |  |
| show_powered_by | bool | ✓ | true |  |
| hero_image_url | text | ✓ |  |  |
| show_hero | bool | ✓ | true |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `projects.client_portal_settings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| project_id | uuid | ✗ |  | PK, FK → projects.id |
| organization_id | uuid | ✗ |  |  |
| show_dashboard | bool | ✗ | true |  |
| show_installments | bool | ✗ | false |  |
| show_payments | bool | ✗ | false |  |
| show_logs | bool | ✗ | false |  |
| show_amounts | bool | ✗ | true |  |
| show_progress | bool | ✗ | true |  |
| allow_comments | bool | ✗ | false |  |
| updated_at | timestamptz | ✓ | now() |  |
| updated_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| show_quotes | bool | ✓ | false |  |

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

### `projects.project_clients`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| contact_id | uuid | ✓ |  |  |
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
| contact_id | uuid | ✗ |  |  |
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
