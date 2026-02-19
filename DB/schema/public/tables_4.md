# Database Schema (Auto-generated)
> Generated: 2026-02-19T12:56:55.329Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 4: kanban_labels — ops_alerts)

### `kanban_labels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| name | text | ✗ |  | UNIQUE |
| color | text | ✗ | '#6366f1'::text |  |
| description | text | ✓ |  |  |
| position | int4 | ✓ | 0 |  |
| is_default | bool | ✓ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `kanban_lists`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| board_id | uuid | ✓ |  | FK → kanban_boards.id |
| name | text | ✗ |  |  |
| position | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_at | timestamptz | ✓ | now() |  |
| color | text | ✓ |  |  |
| limit_wip | int4 | ✓ |  |  |
| auto_complete | bool | ✓ | false |  |
| is_collapsed | bool | ✓ | false |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `kanban_mentions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| comment_id | uuid | ✗ |  | FK → kanban_comments.id |
| mentioned_member_id | uuid | ✗ |  | FK → organization_members.id |
| is_read | bool | ✓ | false |  |
| read_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `labor_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| is_system | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `labor_insurances`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
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
| created_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| coverage_range | daterange | ✓ |  |  |

### `labor_levels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| sort_order | int4 | ✗ | 0 |  |

### `labor_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| labor_id | uuid | ✓ |  | FK → project_labor.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
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
| created_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |

### `labor_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| labor_type_id | uuid | ✗ |  | FK → labor_types.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| unit_price | numeric | ✗ |  |  |
| valid_from | date | ✗ | CURRENT_DATE |  |
| valid_to | date | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `labor_roles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| is_system | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `labor_types`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| labor_category_id | uuid | ✗ |  | FK → labor_categories.id |
| labor_level_id | uuid | ✗ |  | FK → labor_levels.id |
| labor_role_id | uuid | ✓ |  | FK → labor_roles.id |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| unit_id | uuid | ✗ |  | FK → units.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `linked_accounts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| auth_id | uuid | ✗ |  | UNIQUE |
| provider_source | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `material_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| name | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| parent_id | uuid | ✓ |  | FK → material_categories.id |

### `material_invoice_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| invoice_id | uuid | ✗ |  | FK → material_invoices.id |
| product_id | uuid | ✓ |  | FK → products.id |
| description | text | ✗ |  |  |
| quantity | numeric | ✗ | 1 |  |
| unit_price | numeric | ✗ |  |  |
| total_price | numeric | ✓ |  |  |
| unit_id | uuid | ✓ |  | FK → units.id |
| created_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✗ |  | FK → projects.id |
| material_id | uuid | ✓ |  | FK → materials.id |

### `material_invoices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✗ |  | FK → projects.id |
| provider_id | uuid | ✓ |  | FK → contacts.id |
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
| created_by | uuid | ✓ |  | FK → organization_members.id |
| purchase_order_id | uuid | ✓ |  | FK → material_purchase_orders.id |

### `material_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
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
| created_by | uuid | ✓ |  | FK → organization_members.id |
| purchase_id | uuid | ✓ |  | FK → material_invoices.id |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| material_type_id | uuid | ✓ |  | FK → material_types.id |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |

### `material_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| material_id | uuid | ✗ |  | FK → materials.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| unit_price | numeric | ✗ |  |  |
| valid_from | date | ✗ | CURRENT_DATE |  |
| valid_to | date | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `material_purchase_order_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| purchase_order_id | uuid | ✗ |  | FK → material_purchase_orders.id |
| description | text | ✗ |  |  |
| quantity | numeric | ✗ | 1 |  |
| unit_id | uuid | ✓ |  | FK → units.id |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| material_id | uuid | ✓ |  | FK → materials.id |
| unit_price | numeric | ✓ |  |  |

### `material_purchase_orders`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✗ |  | FK → projects.id |
| requested_by | uuid | ✓ |  | FK → organization_members.id |
| approved_by | uuid | ✓ |  | FK → organization_members.id |
| provider_id | uuid | ✓ |  | FK → contacts.id |
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

### `material_types`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| is_system | bool | ✗ | false |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `materials`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| name | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| unit_id | uuid | ✓ |  | FK → units.id |
| category_id | uuid | ✓ |  | FK → material_categories.id |
| updated_at | timestamptz | ✓ | now() |  |
| is_system | bool | ✓ | false |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| default_sale_unit_id | uuid | ✓ |  | FK → units.id |
| is_completed | bool | ✓ | false |  |
| material_type | text | ✓ | 'material'::text |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| code | text | ✓ |  |  |
| description | text | ✓ |  |  |
| default_provider_id | uuid | ✓ |  | FK → contacts.id |
| import_batch_id | uuid | ✓ |  |  |
| default_sale_unit_quantity | numeric | ✓ |  |  |

### `media_file_folders`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| name | text | ✗ |  |  |
| parent_id | uuid | ✓ |  | FK → media_file_folders.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `media_files`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  | FK → organizations.id |
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
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `media_links`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| media_file_id | uuid | ✗ |  | FK → media_files.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| site_log_id | uuid | ✓ |  | FK → site_logs.id |
| contact_id | uuid | ✓ |  | FK → contacts.id |
| general_cost_payment_id | uuid | ✓ |  | FK → general_costs_payments.id |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| visibility | text | ✓ |  |  |
| description | text | ✓ |  |  |
| category | text | ✓ |  |  |
| is_cover | bool | ✓ | false |  |
| position | int4 | ✓ |  |  |
| metadata | jsonb | ✓ | '{}'::jsonb |  |
| client_payment_id | uuid | ✓ |  | FK → client_payments.id |
| course_id | uuid | ✓ |  | FK → courses.id |
| is_public | bool | ✓ | false |  |
| material_payment_id | uuid | ✓ |  | FK → material_payments.id |
| material_purchase_id | uuid | ✓ |  | FK → material_invoices.id |
| testimonial_id | uuid | ✓ |  | FK → testimonials.id |
| labor_payment_id | uuid | ✓ |  | FK → labor_payments.id |
| forum_thread_id | uuid | ✓ |  | FK → forum_threads.id |
| partner_contribution_id | uuid | ✓ |  | FK → partner_contributions.id |
| partner_withdrawal_id | uuid | ✓ |  | FK → partner_withdrawals.id |
| pin_id | uuid | ✓ |  | FK → pins.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| subcontract_payment_id | uuid | ✓ |  | FK → subcontract_payments.id |
| folder_id | uuid | ✓ |  | FK → media_file_folders.id |

### `movement_concepts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| parent_id | uuid | ✓ |  | FK → movement_concepts.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| created_at | timestamptz | ✓ | now() |  |
| is_system | bool | ✓ | false |  |
| updated_at | timestamptz | ✓ | now() |  |
| view_mode | text | ✓ |  |  |
| extra_fields | jsonb | ✓ |  |  |
| description | text | ✓ |  |  |

### `movement_indirects`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| movement_id | uuid | ✓ |  | UNIQUE, FK → movements.id |
| indirect_id | uuid | ✓ |  | FK → indirect_costs.id |

### `movements`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| project_id | uuid | ✓ |  | FK → projects.id |
| description | text | ✓ |  |  |
| amount | numeric | ✗ |  |  |
| file_url | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| subcategory_id | uuid | ✓ |  | FK → movement_concepts.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| wallet_id | uuid | ✓ |  | FK → organization_wallets.id |
| currency_id | uuid | ✓ |  | FK → currencies.id |
| created_by | uuid | ✗ |  | FK → organization_members.id |
| type_id | uuid | ✓ |  | FK → movement_concepts.id |
| category_id | uuid | ✓ |  | FK → movement_concepts.id |
| is_conversion | bool | ✓ | false |  |
| is_favorite | bool | ✓ | false |  |
| movement_date | date | ✓ |  |  |
| conversion_group_id | uuid | ✓ |  |  |
| contact_id | uuid | ✓ |  | FK → contacts.id |
| exchange_rate | numeric | ✓ |  |  |
| transfer_group_id | uuid | ✓ |  |  |
| member_id | uuid | ✓ |  | FK → organization_members.id |
| updated_at | timestamptz | ✓ | now() |  |

### `mp_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | varchar(64) | ✗ |  | PK |
| preapproval_id | text | ✓ |  |  |
| user_id | uuid | ✗ |  | FK → users.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| plan_id | uuid | ✓ |  | FK → plans.id |
| plan_slug | text | ✓ |  |  |
| billing_period | text | ✗ |  |  |
| amount_ars | numeric | ✓ |  |  |
| is_upgrade | bool | ✓ | false |  |
| previous_subscription_id | uuid | ✓ |  |  |
| proration_credit | numeric | ✓ |  |  |
| created_at | timestamp | ✓ | now() |  |
| product_type | text | ✓ |  |  |
| preference_id | text | ✓ |  |  |
| invitee_email | text | ✓ |  |  |
| role_id | uuid | ✓ |  |  |
| subscription_id | uuid | ✓ |  |  |
| payer_email | text | ✓ |  |  |
| course_id | uuid | ✓ |  | FK → courses.id |
| amount | numeric | ✓ |  |  |
| currency | text | ✓ | 'ARS'::text |  |
| exchange_rate | numeric | ✓ |  |  |
| coupon_id | uuid | ✓ |  | FK → coupons.id |
| discount_amount | numeric | ✓ | 0 |  |
| init_point | text | ✓ |  |  |
| status | text | ✓ | 'pending'::text |  |
| expires_at | timestamptz | ✓ |  |  |
| completed_at | timestamptz | ✓ |  |  |
| seats_quantity | int4 | ✓ |  |  |
| is_sandbox | bool | ✓ | false |  |
| is_test | bool | ✓ | false |  |

### `notification_settings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| user_id | uuid | ✗ |  | PK, FK → users.id |
| email_marketing | bool | ✓ | true |  |
| email_transactional | bool | ✓ | true |  |
| push_enabled | bool | ✓ | true |  |
| notify_on_course_access | bool | ✓ | true |  |
| notify_on_payment | bool | ✓ | true |  |

### `notifications`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| type | text | ✗ |  |  |
| title | text | ✗ |  |  |
| body | text | ✓ |  |  |
| data | jsonb | ✓ | '{}'::jsonb |  |
| audience | text | ✗ | 'direct'::text |  |
| role_id | uuid | ✓ |  | FK → roles.id |
| org_id | uuid | ✓ |  | FK → organizations.id |
| created_by | uuid | ✓ |  | FK → users.id |
| created_at | timestamptz | ✗ | now() |  |
| start_at | timestamptz | ✓ |  |  |
| expires_at | timestamptz | ✓ |  |  |

### `ops_alerts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| severity | text | ✗ | 'high'::text |  |
| status | text | ✗ | 'open'::text |  |
| alert_type | text | ✗ |  |  |
| title | text | ✗ |  |  |
| description | text | ✓ |  |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| user_id | uuid | ✓ |  | FK → users.id |
| provider | text | ✓ |  |  |
| provider_payment_id | text | ✓ |  |  |
| payment_id | uuid | ✓ |  | FK → payments.id |
| event_id | uuid | ✓ |  | FK → payment_events.id |
| fingerprint | text | ✓ |  |  |
| evidence | jsonb | ✗ | '{}'::jsonb |  |
| ack_by | uuid | ✓ |  | FK → users.id |
| ack_at | timestamptz | ✓ |  |  |
| resolved_by | uuid | ✓ |  | FK → users.id |
| resolved_at | timestamptz | ✓ |  |  |
