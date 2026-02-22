# Database Schema (Auto-generated)
> Generated: 2026-02-22T17:21:28.968Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [FINANCE] Tables (chunk 2: finance.personnel_rates — finance.wallets)

### `finance.personnel_rates`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| personnel_id | uuid | ✓ |  |  |
| labor_type_id | uuid | ✓ |  |  |
| rate_hour | numeric | ✓ |  |  |
| rate_day | numeric | ✓ |  |  |
| rate_month | numeric | ✓ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| valid_from | date | ✗ |  |  |
| valid_to | date | ✓ |  |  |
| is_active | bool | ✗ | true |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| pay_type | text | ✗ | 'hour'::text |  |

### `finance.quote_items`

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
| currency_id | uuid | ✗ |  | FK → currencies.id |
| markup_pct | numeric | ✗ | 0 |  |
| tax_pct | numeric | ✗ | 0 |  |
| created_by | uuid | ✓ |  |  |
| cost_scope | cost_scope_enum | ✗ | 'materials_and_labor'::cost_scope_enum |  |
| sort_key | numeric | ✗ | 0 |  |
| updated_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `finance.quotes`

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
| currency_id | uuid | ✗ |  | FK → currencies.id |
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

### `finance.subcontract_bid_tasks`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| subcontract_bid_id | uuid | ✓ |  | FK → subcontract_bids.id |
| subcontract_task_id | uuid | ✓ |  | FK → subcontract_tasks.id |
| quantity | numeric | ✓ |  |  |
| unit | text | ✓ |  |  |
| unit_price | numeric | ✓ |  |  |
| amount | numeric | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `finance.subcontract_bids`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| contact_id | uuid | ✗ |  |  |
| amount | numeric | ✓ |  |  |
| currency_id | uuid | ✓ |  | FK → currencies.id |
| exchange_rate | numeric | ✓ |  |  |
| notes | text | ✓ |  |  |
| submitted_at | date | ✓ |  |  |
| status | text | ✓ | 'pending'::text |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| subcontract_id | uuid | ✓ |  | FK → subcontracts.id |

### `finance.subcontract_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  |  |
| subcontract_id | uuid | ✓ |  | FK → subcontracts.id |
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
| updated_by | uuid | ✓ |  |  |
| is_deleted | bool | ✓ | false |  |
| import_batch_id | uuid | ✓ |  |  |

### `finance.subcontract_tasks`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| subcontract_id | uuid | ✗ |  | FK → subcontracts.id |
| task_id | uuid | ✗ |  |  |
| unit | text | ✓ |  |  |
| amount | numeric | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `finance.subcontracts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| code | text | ✓ |  |  |
| title | text | ✗ |  |  |
| amount_total | numeric | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| status | text | ✓ | 'draft'::text |  |
| exchange_rate | numeric | ✓ |  |  |
| date | date | ✓ |  |  |
| winner_bid_id | uuid | ✓ |  | FK → subcontract_bids.id |
| contact_id | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| is_deleted | bool | ✓ | false |  |
| currency_id | uuid | ✓ |  | FK → currencies.id |
| adjustment_index_type_id | uuid | ✓ |  | FK → economic_index_types.id |
| base_period_year | int4 | ✓ |  |  |
| base_period_month | int4 | ✓ |  |  |
| base_index_value | numeric | ✓ |  |  |

### `finance.tax_labels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| code | text | ✗ |  | UNIQUE |
| name | text | ✗ |  |  |
| country_codes | _text | ✓ |  |  |
| is_system | bool | ✓ | true |  |

### `finance.wallets`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| name | text | ✗ |  | UNIQUE |
| created_at | timestamptz | ✗ | now() |  |
| is_active | bool | ✗ | true |  |
| updated_at | timestamptz | ✗ | now() |  |
