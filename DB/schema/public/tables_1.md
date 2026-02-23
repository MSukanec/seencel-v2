# Database Schema (Auto-generated)
> Generated: 2026-02-23T12:14:47.276Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 1: app_settings — media_links)

### `app_settings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| key | text | ✗ |  | PK |
| value | text | ✓ |  |  |
| description | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |

### `countries`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| alpha_3 | text | ✗ |  |  |
| country_code | text | ✓ |  |  |
| name | text | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| alpha_2 | text | ✓ |  |  |

### `feature_flag_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| position | int4 | ✓ | 0 |  |
| parent_id | uuid | ✓ |  | FK → feature_flag_categories.id |
| created_at | timestamptz | ✓ | now() |  |

### `feature_flags`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| key | varchar(100) | ✗ |  | UNIQUE |
| value | bool | ✗ | true |  |
| description | text | ✓ |  |  |
| category | varchar(50) | ✓ | 'general'::character varying |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| parent_id | uuid | ✓ |  | FK → feature_flags.id |
| position | int4 | ✓ | 0 |  |
| status | varchar(20) | ✓ | 'active'::character varying |  |
| flag_type | text | ✓ | 'feature'::text |  |
| category_id | uuid | ✓ |  | FK → feature_flag_categories.id |

### `global_announcements`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| title | text | ✗ |  |  |
| message | text | ✗ |  |  |
| type | text | ✗ |  |  |
| link_text | text | ✓ |  |  |
| link_url | text | ✓ |  |  |
| audience | text | ✓ | 'all'::text |  |
| is_active | bool | ✓ | true |  |
| starts_at | timestamptz | ✓ | now() |  |
| ends_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| primary_button_text | text | ✓ |  |  |
| primary_button_url | text | ✓ |  |  |
| secondary_button_text | text | ✓ |  |  |
| secondary_button_url | text | ✓ |  |  |

### `hero_sections`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| section_type | text | ✗ | 'learning_dashboard'::text |  |
| order_index | int4 | ✗ | 0 |  |
| title | text | ✓ |  |  |
| description | text | ✓ |  |  |
| primary_button_text | text | ✓ |  |  |
| primary_button_action | text | ✓ |  |  |
| primary_button_action_type | text | ✓ | 'url'::text |  |
| secondary_button_text | text | ✓ |  |  |
| secondary_button_action | text | ✓ |  |  |
| secondary_button_action_type | text | ✓ | 'url'::text |  |
| is_active | bool | ✓ | true |  |
| created_at | timestamp | ✓ | now() |  |
| updated_at | timestamp | ✓ | now() |  |
| media_url | text | ✓ |  |  |
| media_type | text | ✓ | 'image'::text |  |
| is_deleted | bool | ✗ | false |  |

### `import_batches`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| entity_type | text | ✗ |  |  |
| record_count | int4 | ✗ | 0 |  |
| status | text | ✗ | 'completed'::text |  |
| created_at | timestamptz | ✗ | timezone('utc'::text, now()) |  |
| member_id | uuid | ✓ |  |  |

### `media_file_folders`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| name | text | ✗ |  |  |
| parent_id | uuid | ✓ |  | FK → media_file_folders.id |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `media_files`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| bucket | text | ✗ |  |  |
| file_path | text | ✗ |  |  |
| file_name | text | ✓ |  |  |
| file_type | text | ✗ |  |  |
| file_size | int8 | ✓ |  |  |
| is_public | bool | ✗ | false |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `media_links`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| media_file_id | uuid | ✗ |  | FK → media_files.id |
| organization_id | uuid | ✓ |  |  |
| project_id | uuid | ✓ |  |  |
| site_log_id | uuid | ✓ |  |  |
| contact_id | uuid | ✓ |  |  |
| general_cost_payment_id | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| visibility | text | ✓ |  |  |
| description | text | ✓ |  |  |
| category | text | ✓ |  |  |
| is_cover | bool | ✓ | false |  |
| position | int4 | ✓ |  |  |
| metadata | jsonb | ✓ | '{}'::jsonb |  |
| client_payment_id | uuid | ✓ |  |  |
| course_id | uuid | ✓ |  |  |
| is_public | bool | ✓ | false |  |
| material_payment_id | uuid | ✓ |  |  |
| material_purchase_id | uuid | ✓ |  |  |
| testimonial_id | uuid | ✓ |  |  |
| labor_payment_id | uuid | ✓ |  |  |
| forum_thread_id | uuid | ✓ |  |  |
| partner_contribution_id | uuid | ✓ |  |  |
| partner_withdrawal_id | uuid | ✓ |  |  |
| pin_id | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| subcontract_payment_id | uuid | ✓ |  |  |
| folder_id | uuid | ✓ |  | FK → media_file_folders.id |
