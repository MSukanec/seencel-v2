# Database Schema (Auto-generated)
> Generated: 2026-02-21T16:47:02.827Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [FINANCE] Tables (chunk 1: finance.capital_participants — finance.pdf_templates)

### `finance.capital_participants`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| contact_id | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| notes | text | ✓ |  |  |
| status | text | ✗ | 'active'::text |  |
| created_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| ownership_percentage | numeric | ✓ |  |  |

### `finance.client_commitments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  |  |
| client_id | uuid | ✗ |  |  |
| organization_id | uuid | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| commitment_method | client_commitment_method | ✗ | 'fixed'::client_commitment_method |  |
| unit_name | text | ✓ |  |  |
| concept | text | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| description | text | ✓ |  |  |
| quote_id | uuid | ✓ |  | FK → quotes.id |

### `finance.client_payment_schedule`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| commitment_id | uuid | ✗ |  | FK → client_commitments.id |
| due_date | date | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| status | text | ✗ | 'pending'::text |  |
| paid_at | timestamptz | ✓ |  |  |
| payment_method | text | ✓ |  |  |
| notes | text | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `finance.client_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  |  |
| commitment_id | uuid | ✓ |  | FK → client_commitments.id |
| schedule_id | uuid | ✓ |  | FK → client_payment_schedule.id |
| organization_id | uuid | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✓ |  |  |
| payment_date | date | ✗ | now() |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| wallet_id | uuid | ✗ |  | FK → organization_wallets.id |
| client_id | uuid | ✓ |  |  |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |

### `finance.currencies`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| code | text | ✗ |  | UNIQUE |
| name | text | ✗ |  |  |
| symbol | text | ✗ |  |  |
| country | text | ✓ |  |  |
| is_default | bool | ✓ | false |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `finance.economic_index_components`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| index_type_id | uuid | ✗ |  | UNIQUE, FK → economic_index_types.id |
| key | text | ✗ |  | UNIQUE |
| name | text | ✗ |  |  |
| is_main | bool | ✓ | false |  |
| sort_order | int4 | ✓ | 0 |  |
| color | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `finance.economic_index_types`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| name | text | ✗ |  | UNIQUE |
| description | text | ✓ |  |  |
| periodicity | text | ✗ | 'monthly'::text |  |
| base_year | int4 | ✓ |  |  |
| base_value | numeric | ✓ | 100 |  |
| source | text | ✓ |  |  |
| is_system | bool | ✓ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `finance.economic_index_values`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| index_type_id | uuid | ✗ |  | UNIQUE, FK → economic_index_types.id |
| period_year | int4 | ✗ |  | UNIQUE |
| period_month | int4 | ✓ |  | UNIQUE |
| period_quarter | int4 | ✓ |  | UNIQUE |
| values | jsonb | ✗ | '{}'::jsonb |  |
| source_url | text | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `finance.exchange_rates`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| from_currency | text | ✗ |  | UNIQUE |
| to_currency | text | ✗ |  | UNIQUE |
| rate | numeric | ✗ |  |  |
| is_active | bool | ✗ | true |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |

### `finance.general_cost_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  |  |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| is_system | bool | ✗ | false |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `finance.general_costs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| category_id | uuid | ✓ |  | FK → general_cost_categories.id |
| is_recurring | bool | ✗ | false |  |
| recurrence_interval | text | ✓ |  |  |
| expected_day | int2 | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `finance.general_costs_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✓ |  |  |
| payment_date | date | ✗ | now() |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| wallet_id | uuid | ✗ |  | FK → organization_wallets.id |
| general_cost_id | uuid | ✓ |  | FK → general_costs.id |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `finance.indirect_costs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| organization_id | uuid | ✗ |  |  |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| project_id | uuid | ✓ |  |  |

### `finance.indirect_costs_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  |  |
| indirect_cost_id | uuid | ✓ |  | FK → indirect_costs.id |
| organization_id | uuid | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✗ |  |  |
| payment_date | date | ✗ | now() |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| wallet_id | uuid | ✓ |  | FK → organization_wallets.id |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  |  |
| file_url | text | ✓ |  |  |

### `finance.labor_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  |  |
| labor_id | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✗ |  |  |
| payment_date | date | ✗ | now() |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| wallet_id | uuid | ✓ |  | FK → organization_wallets.id |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |

### `finance.material_invoice_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| invoice_id | uuid | ✗ |  | FK → material_invoices.id |
| product_id | uuid | ✓ |  |  |
| description | text | ✗ |  |  |
| quantity | numeric | ✗ | 1 |  |
| unit_price | numeric | ✗ |  |  |
| total_price | numeric | ✓ |  |  |
| unit_id | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✗ |  |  |
| material_id | uuid | ✓ |  |  |

### `finance.material_invoices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✗ |  |  |
| provider_id | uuid | ✓ |  |  |
| invoice_number | text | ✓ |  |  |
| document_type | text | ✗ | 'invoice'::text |  |
| purchase_date | date | ✗ | now() |  |
| subtotal | numeric | ✗ | 0 |  |
| tax_amount | numeric | ✗ | 0 |  |
| total_amount | numeric | ✓ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✓ |  |  |
| status | text | ✗ | 'pending'::text |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| purchase_order_id | uuid | ✓ |  | FK → material_purchase_orders.id |

### `finance.material_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  |  |
| organization_id | uuid | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✓ |  |  |
| payment_date | date | ✗ | now() |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| wallet_id | uuid | ✗ |  | FK → organization_wallets.id |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  |  |
| purchase_id | uuid | ✓ |  | FK → material_invoices.id |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| material_type_id | uuid | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |

### `finance.material_purchase_order_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| purchase_order_id | uuid | ✗ |  | FK → material_purchase_orders.id |
| description | text | ✗ |  |  |
| quantity | numeric | ✗ | 1 |  |
| unit_id | uuid | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| organization_id | uuid | ✓ |  |  |
| project_id | uuid | ✓ |  |  |
| material_id | uuid | ✓ |  |  |
| unit_price | numeric | ✓ |  |  |

### `finance.material_purchase_orders`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✗ |  |  |
| requested_by | uuid | ✓ |  |  |
| approved_by | uuid | ✓ |  |  |
| provider_id | uuid | ✓ |  |  |
| order_date | date | ✗ | now() |  |
| status | text | ✗ | 'draft'::text |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| order_number | text | ✓ |  |  |
| expected_delivery_date | date | ✓ |  |  |
| currency_id | uuid | ✓ |  | FK → currencies.id |
| subtotal | numeric | ✗ | 0 |  |
| tax_amount | numeric | ✗ | 0 |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `finance.movement_concepts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| parent_id | uuid | ✓ |  | FK → movement_concepts.id |
| organization_id | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| is_system | bool | ✓ | false |  |
| updated_at | timestamptz | ✓ | now() |  |
| view_mode | text | ✓ |  |  |
| extra_fields | jsonb | ✓ |  |  |
| description | text | ✓ |  |  |

### `finance.movement_indirects`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| movement_id | uuid | ✓ |  | UNIQUE, FK → movements.id |
| indirect_id | uuid | ✓ |  | FK → indirect_costs.id |

### `finance.movements`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| project_id | uuid | ✓ |  |  |
| description | text | ✓ |  |  |
| amount | numeric | ✗ |  |  |
| file_url | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| subcategory_id | uuid | ✓ |  | FK → movement_concepts.id |
| organization_id | uuid | ✓ |  |  |
| wallet_id | uuid | ✓ |  | FK → organization_wallets.id |
| currency_id | uuid | ✓ |  | FK → currencies.id |
| created_by | uuid | ✗ |  |  |
| type_id | uuid | ✓ |  | FK → movement_concepts.id |
| category_id | uuid | ✓ |  | FK → movement_concepts.id |
| is_conversion | bool | ✓ | false |  |
| is_favorite | bool | ✓ | false |  |
| movement_date | date | ✓ |  |  |
| conversion_group_id | uuid | ✓ |  |  |
| contact_id | uuid | ✓ |  |  |
| exchange_rate | numeric | ✓ |  |  |
| transfer_group_id | uuid | ✓ |  |  |
| member_id | uuid | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |

### `finance.organization_currencies`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| currency_id | uuid | ✗ |  | UNIQUE, FK → currencies.id |
| is_active | bool | ✗ | true |  |
| is_default | bool | ✗ | false |  |
| created_at | timestamptz | ✓ | timezone('utc'::text, now()) |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `finance.organization_wallets`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| wallet_id | uuid | ✓ |  | FK → wallets.id |
| is_active | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| is_default | bool | ✗ | false |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |

### `finance.partner_capital_balance`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| partner_id | uuid | ✗ |  | UNIQUE, FK → capital_participants.id |
| organization_id | uuid | ✗ |  | UNIQUE |
| balance_amount | numeric | ✗ |  |  |
| balance_date | date | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `finance.partner_contributions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✗ |  |  |
| contribution_date | date | ✗ | now() |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| wallet_id | uuid | ✓ |  | FK → organization_wallets.id |
| partner_id | uuid | ✓ |  | FK → capital_participants.id |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `finance.partner_withdrawals`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✗ |  |  |
| withdrawal_date | date | ✗ | now() |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| wallet_id | uuid | ✓ |  | FK → organization_wallets.id |
| partner_id | uuid | ✓ |  | FK → capital_participants.id |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `finance.pdf`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✓ |  |  |
| updated_at | timestamptz | ✓ |  |  |
| name | text | ✓ |  |  |
| blocks | jsonb | ✓ |  |  |
| config | jsonb | ✓ |  |  |

### `finance.pdf_templates`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ | 'Plantilla por defecto'::text |  |
| logo_width | int4 | ✓ | 80 |  |
| logo_height | int4 | ✓ | 80 |  |
| company_name_size | int4 | ✓ | 24 |  |
| company_name_color | text | ✓ | '''#000000''::text'::text |  |
| primary_color | text | ✓ | '''#000000''::text'::text |  |
| secondary_color | text | ✓ | '#e5e7eb'::text |  |
| text_color | text | ✓ | '#1f2937'::text |  |
| font_family | text | ✓ | 'Arial'::text |  |
| title_size | int4 | ✓ | 18 |  |
| subtitle_size | int4 | ✓ | 14 |  |
| body_size | int4 | ✓ | 12 |  |
| margin_top | int4 | ✓ | 10 |  |
| margin_bottom | int4 | ✓ | 10 |  |
| margin_left | int4 | ✓ | 10 |  |
| margin_right | int4 | ✓ | 10 |  |
| footer_text | text | ✓ | 'Documento generado por Seencel. SEEN... |  |
| footer_show_page_numbers | bool | ✓ | true |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| company_info_size | int4 | ✓ | 10 |  |
| show_footer_info | bool | ✓ | true |  |
| page_size | varchar(10) | ✓ | 'A4'::character varying |  |
| page_orientation | text | ✓ | 'vertical'::text |  |
| organization_id | uuid | ✓ |  |  |
| pdf_logo_path | text | ✓ |  |  |
| show_company_name | bool | ✓ | true |  |
| show_company_address | bool | ✓ | true |  |
