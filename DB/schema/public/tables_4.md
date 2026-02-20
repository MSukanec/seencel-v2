# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 4: media_links — payments)

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
| task_id | uuid | ✗ |  | UNIQUE |
| recipe_id | uuid | ✗ |  |  |
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
| task_id | uuid | ✗ |  | UNIQUE |
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
