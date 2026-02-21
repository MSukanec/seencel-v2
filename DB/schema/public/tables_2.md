# Database Schema (Auto-generated)
> Generated: 2026-02-21T19:23:32.061Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 2: pin_board_items — testimonials)

### `pin_board_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| board_id | uuid | ✗ |  | UNIQUE, FK → pin_boards.id |
| pin_id | uuid | ✗ |  | UNIQUE, FK → pins.id |
| position | int4 | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |

### `pin_boards`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_by | uuid | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `pins`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| title | text | ✓ |  |  |
| source_url | text | ✓ |  |  |
| image_url | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✓ |  |  |
| project_id | uuid | ✓ |  |  |
| media_file_id | uuid | ✓ |  | FK → media_files.id |

### `product_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| provider_product_id | uuid | ✗ |  | FK → provider_products.id |
| price | numeric | ✓ |  |  |
| currency_id | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `products`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| material_id | uuid | ✓ |  |  |
| brand_id | uuid | ✓ |  | FK → brands.id |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| image_url | text | ✓ |  |  |
| specs | jsonb | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| unit_id | uuid | ✓ |  |  |
| default_price | numeric | ✓ |  |  |
| default_provider | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| url | text | ✓ |  |  |
| is_system | bool | ✓ | true |  |
| organization_id | uuid | ✓ |  |  |

### `provider_products`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| product_id | uuid | ✗ |  | UNIQUE, FK → products.id |
| provider_code | text | ✓ |  |  |
| is_active | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `system_job_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| subscription_id | uuid | ✓ |  |  |
| job_type | text | ✗ |  |  |
| details | jsonb | ✓ |  |  |
| status | text | ✗ |  |  |
| error_message | text | ✓ |  |  |
| processed_at | timestamptz | ✓ | now() |  |

### `testimonials`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| course_id | uuid | ✓ |  |  |
| organization_id | uuid | ✓ |  |  |
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
| user_id | uuid | ✓ |  |  |
