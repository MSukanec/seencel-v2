# Database Schema (Auto-generated)
> Generated: 2026-02-26T15:52:15.290Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROVIDERS] Tables (chunk 1: providers.brands — providers.provider_products)

### `providers.brands`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `providers.product_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| provider_product_id | uuid | ✗ |  | FK → provider_products.id |
| price | numeric | ✓ |  |  |
| currency_id | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `providers.products`

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

### `providers.provider_products`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| product_id | uuid | ✗ |  | UNIQUE, FK → products.id |
| provider_code | text | ✓ |  |  |
| is_active | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
