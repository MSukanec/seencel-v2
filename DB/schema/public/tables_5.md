# Database Schema (Auto-generated)
> Generated: 2026-02-19T12:56:55.329Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 5: ops_check_runs — pin_board_items)

### `ops_check_runs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| check_suite | text | ✗ | 'ops_core'::text |  |
| status | text | ✗ | 'success'::text |  |
| duration_ms | int4 | ✓ |  |  |
| stats | jsonb | ✗ | '{}'::jsonb |  |
| error_message | text | ✓ |  |  |

### `ops_repair_actions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | text | ✗ |  | PK |
| alert_type | text | ✗ |  |  |
| label | text | ✗ |  |  |
| description | text | ✓ |  |  |
| requires_confirmation | bool | ✓ | true |  |
| is_dangerous | bool | ✓ | false |  |
| is_active | bool | ✓ | true |  |
| metadata | jsonb | ✓ | '{}'::jsonb |  |
| created_at | timestamptz | ✓ | now() |  |

### `ops_repair_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| alert_id | uuid | ✓ |  | FK → ops_alerts.id |
| action_id | text | ✗ |  |  |
| executed_by | uuid | ✓ |  |  |
| result | text | ✓ |  |  |
| details | jsonb | ✓ | '{}'::jsonb |  |
| created_at | timestamptz | ✓ | now() |  |

### `organization_activity_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| action | text | ✗ |  |  |
| target_table | text | ✗ |  |  |
| target_id | uuid | ✓ |  |  |
| metadata | jsonb | ✓ | '{}'::jsonb |  |
| created_at | timestamptz | ✗ | now() |  |
| member_id | uuid | ✓ |  | FK → organization_members.id |

### `organization_billing_cycles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| subscription_id | uuid | ✓ |  | FK → organization_subscriptions.id |
| plan_id | uuid | ✗ |  | FK → plans.id |
| seats | int4 | ✗ |  |  |
| amount_per_seat | numeric | ✗ |  |  |
| seat_price_source | text | ✓ |  |  |
| base_amount | numeric | ✗ |  |  |
| proration_adjustment | numeric | ✓ | 0 |  |
| total_amount | numeric | ✗ |  |  |
| billing_period | text | ✗ |  |  |
| period_start | timestamptz | ✗ |  |  |
| period_end | timestamptz | ✗ |  |  |
| paid | bool | ✓ | false |  |
| status | text | ✓ | 'pending'::text |  |
| payment_provider | text | ✓ |  |  |
| payment_id | text | ✓ |  |  |
| currency_code | text | ✗ | 'USD'::text |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| billed_seats | int4 | ✗ | 1 |  |
| payment_uuid | uuid | ✓ |  | FK → payments.id |

### `organization_currencies`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| currency_id | uuid | ✗ |  | UNIQUE, FK → currencies.id |
| is_active | bool | ✗ | true |  |
| is_default | bool | ✗ | false |  |
| created_at | timestamptz | ✓ | timezone('utc'::text, now()) |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `organization_data`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| slug | text | ✓ |  |  |
| description | text | ✓ |  |  |
| address | text | ✓ |  |  |
| city | text | ✓ |  |  |
| state | text | ✓ |  |  |
| country | text | ✓ |  |  |
| postal_code | text | ✓ |  |  |
| phone | text | ✓ |  |  |
| email | text | ✓ |  |  |
| website | text | ✓ |  |  |
| tax_id | text | ✓ |  |  |
| lat | numeric | ✓ |  |  |
| lng | numeric | ✓ |  |  |
| address_full | text | ✓ |  |  |
| place_id | text | ✓ |  |  |
| timezone | text | ✓ |  |  |
| location_type | text | ✓ |  |  |
| accessibility_notes | text | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |

### `organization_external_actors`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| actor_type | text | ✗ |  |  |
| is_active | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `organization_material_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| material_id | uuid | ✗ |  | FK → materials.id |
| unit_price | float8 | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| is_default | bool | ✓ | false |  |
| source | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `organization_member_events`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| subscription_id | uuid | ✓ |  | FK → organization_subscriptions.id |
| member_id | uuid | ✗ |  | FK → organization_members.id |
| user_id | uuid | ✓ |  | FK → users.id |
| event_type | text | ✗ |  |  |
| was_billable | bool | ✓ |  |  |
| is_billable | bool | ✓ |  |  |
| event_date | timestamptz | ✗ | now() |  |
| performed_by | uuid | ✓ |  | FK → users.id |
| created_at | timestamptz | ✓ | now() |  |

### `organization_members`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| created_at | timestamptz | ✗ | now() |  |
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| user_id | uuid | ✓ |  | FK → users.id |
| is_active | bool | ✗ | true |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| invited_by | uuid | ✓ |  | FK → organization_members.id |
| joined_at | timestamptz | ✓ | now() |  |
| role_id | uuid | ✓ |  | FK → roles.id |
| last_active_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_billable | bool | ✗ | true |  |
| is_over_limit | bool | ✓ | false |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |

### `organization_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  | UNIQUE, FK → organizations.id |
| default_pdf_template_id | uuid | ✓ |  | FK → pdf_templates.id |
| created_at | timestamptz | ✓ | now() |  |
| default_currency_id | uuid | ✓ |  | FK → currencies.id |
| default_wallet_id | uuid | ✓ |  | FK → wallets.id |
| updated_at | timestamptz | ✓ | now() |  |
| use_currency_exchange | bool | ✗ | false |  |
| functional_currency_id | uuid | ✓ |  | FK → currencies.id |
| insight_config | jsonb | ✓ | '{}'::jsonb |  |
| currency_decimal_places | int4 | ✓ | 2 |  |
| default_tax_label_id | uuid | ✓ |  | FK → tax_labels.id |
| kpi_compact_format | bool | ✗ | false |  |

### `organization_recipe_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| task_id | uuid | ✗ |  | UNIQUE, FK → tasks.id |
| recipe_id | uuid | ✗ |  | FK → task_recipes.id |
| adopted_at | timestamptz | ✗ | now() |  |

### `organization_subscriptions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| plan_id | uuid | ✗ |  | FK → plans.id |
| payment_id | uuid | ✓ |  | FK → payments.id |
| status | text | ✗ | 'active'::text |  |
| billing_period | text | ✗ |  |  |
| started_at | timestamptz | ✗ | now() |  |
| expires_at | timestamptz | ✗ |  |  |
| cancelled_at | timestamptz | ✓ |  |  |
| amount | numeric | ✗ |  |  |
| currency | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| scheduled_downgrade_plan_id | uuid | ✓ |  | FK → plans.id |
| provider_subscription_id | text | ✓ |  |  |
| coupon_id | uuid | ✓ |  | FK → coupons.id |
| coupon_code | text | ✓ |  |  |
| payer_email | text | ✓ |  |  |

### `organization_task_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| task_id | uuid | ✗ |  | UNIQUE, FK → tasks.id |
| labor_unit_cost | numeric | ✓ |  |  |
| material_unit_cost | numeric | ✓ |  |  |
| total_unit_cost | numeric | ✓ |  |  |
| currency_code | text | ✓ |  |  |
| note | text | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |
| supply_unit_cost | numeric | ✓ |  |  |

### `organization_wallets`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| wallet_id | uuid | ✓ |  | FK → wallets.id |
| is_active | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| is_default | bool | ✗ | false |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |

### `organizations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| created_at | timestamptz | ✗ | now() |  |
| name | text | ✗ |  |  |
| created_by | uuid | ✓ |  | FK → users.id |
| is_active | bool | ✗ | true |  |
| updated_at | timestamptz | ✗ | now() |  |
| plan_id | uuid | ✓ |  | FK → plans.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| owner_id | uuid | ✓ |  | FK → users.id |
| settings | jsonb | ✓ | '{}'::jsonb |  |
| is_demo | bool | ✗ | false |  |
| logo_url | text | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| purchased_seats | int4 | ✓ | 0 |  |
| business_mode | text | ✗ | 'professional'::text |  |

### `partner_capital_balance`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| partner_id | uuid | ✗ |  | UNIQUE, FK → capital_participants.id |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| balance_amount | numeric | ✗ |  |  |
| balance_date | date | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `partner_contributions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✓ |  | FK → projects.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
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
| created_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `partner_withdrawals`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✓ |  | FK → projects.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
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
| created_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `payment_events`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| provider_event_id | text | ✓ |  |  |
| provider_event_type | text | ✓ |  |  |
| status | text | ✓ | 'RECEIVED'::text |  |
| raw_headers | jsonb | ✓ |  |  |
| raw_payload | jsonb | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| order_id | text | ✓ |  |  |
| custom_id | text | ✓ |  |  |
| user_hint | text | ✓ |  |  |
| course_hint | text | ✓ |  |  |
| provider | text | ✗ | 'paypal'::text |  |
| provider_payment_id | text | ✓ |  |  |
| amount | numeric | ✓ |  |  |
| currency | text | ✓ |  |  |
| processed_at | timestamptz | ✓ |  |  |

### `payment_plans`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| provider | text | ✗ |  | UNIQUE |
| provider_payment_id | text | ✓ |  | UNIQUE |
| user_id | uuid | ✗ |  | FK → users.id |
| course_id | uuid | ✓ |  | FK → courses.id |
| amount | numeric | ✓ |  |  |
| currency | text | ✓ | 'USD'::text |  |
| status | text | ✗ | 'completed'::text |  |
| created_at | timestamptz | ✗ | now() |  |
| product_type | text | ✓ |  |  |
| product_id | uuid | ✓ |  |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| approved_at | timestamptz | ✓ |  |  |
| metadata | jsonb | ✓ |  |  |
| gateway | text | ✓ |  |  |
| exchange_rate | numeric | ✓ |  |  |

### `paypal_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | varchar(50) | ✗ |  | PK |
| order_id | varchar(100) | ✓ |  |  |
| user_id | uuid | ✗ |  | FK → users.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| plan_id | uuid | ✓ |  | FK → plans.id |
| plan_slug | text | ✓ |  |  |
| billing_period | text | ✓ |  |  |
| amount | numeric | ✓ |  |  |
| currency | text | ✓ | 'USD'::text |  |
| product_type | text | ✓ |  |  |
| course_id | uuid | ✓ |  | FK → courses.id |
| coupon_id | uuid | ✓ |  | FK → coupons.id |
| coupon_code | text | ✓ |  |  |
| discount_amount | numeric | ✓ | 0 |  |
| is_test | bool | ✓ | false |  |
| is_sandbox | bool | ✓ | false |  |
| status | text | ✓ | 'pending'::text |  |
| created_at | timestamptz | ✓ | now() |  |
| captured_at | timestamptz | ✓ |  |  |
| expires_at | timestamptz | ✓ |  |  |
| seats_quantity | int4 | ✓ |  |  |

### `pdf`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| updated_at | timestamptz | ✓ |  |  |
| name | text | ✓ |  |  |
| blocks | jsonb | ✓ |  |  |
| config | jsonb | ✓ |  |  |

### `pdf_templates`

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
| organization_id | uuid | ✓ |  | FK → organizations.id |
| pdf_logo_path | text | ✓ |  |  |
| show_company_name | bool | ✓ | true |  |
| show_company_address | bool | ✓ | true |  |

### `permissions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| key | text | ✗ |  | UNIQUE |
| description | text | ✗ |  |  |
| category | text | ✗ |  |  |
| is_system | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |

### `personnel_attendees`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| site_log_id | uuid | ✓ |  | FK → site_logs.id |
| attendance_type | text | ✓ | 'full'::text |  |
| hours_worked | numeric | ✓ |  |  |
| description | text | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| project_id | uuid | ✓ |  | FK → projects.id |
| personnel_id | uuid | ✓ |  | FK → project_labor.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| work_date | date | ✗ | CURRENT_DATE |  |
| status | text | ✓ |  |  |

### `personnel_rates`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| personnel_id | uuid | ✓ |  | FK → project_labor.id |
| labor_type_id | uuid | ✓ |  | FK → labor_categories.id |
| rate_hour | numeric | ✓ |  |  |
| rate_day | numeric | ✓ |  |  |
| rate_month | numeric | ✓ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| valid_from | date | ✗ |  |  |
| valid_to | date | ✓ |  |  |
| is_active | bool | ✗ | true |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| pay_type | text | ✗ | 'hour'::text |  |

### `pin_board_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| board_id | uuid | ✗ |  | UNIQUE, FK → pin_boards.id |
| pin_id | uuid | ✗ |  | UNIQUE, FK → pins.id |
| position | int4 | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
