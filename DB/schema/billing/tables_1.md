# Database Schema (Auto-generated)
> Generated: 2026-02-25T18:05:07.898Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [BILLING] Tables (chunk 1: billing.bank_transfer_payments — billing.subscription_notifications_log)

### `billing.bank_transfer_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| order_id | uuid | ✗ |  |  |
| user_id | uuid | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency | text | ✗ |  |  |
| payer_name | text | ✓ |  |  |
| payer_note | text | ✓ |  |  |
| status | payment_review_status | ✗ | 'pending'::payment_review_status |  |
| reviewed_by | uuid | ✓ |  |  |
| reviewed_at | timestamptz | ✓ |  |  |
| review_reason | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| payment_id | uuid | ✓ |  | FK → payments.id |
| course_id | uuid | ✓ |  |  |
| discount_percent | numeric | ✓ | 5.0 |  |
| discount_amount | numeric | ✓ | 0 |  |
| receipt_url | text | ✓ |  |  |
| plan_id | uuid | ✓ |  | FK → plans.id |
| organization_id | uuid | ✓ |  |  |
| billing_period | text | ✓ |  |  |
| exchange_rate | numeric | ✓ |  |  |

### `billing.billing_profiles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  |  |
| is_company | bool | ✗ | false |  |
| full_name | text | ✓ |  |  |
| company_name | text | ✓ |  |  |
| tax_id | text | ✓ |  |  |
| country_id | uuid | ✓ |  |  |
| address_line1 | text | ✓ |  |  |
| city | text | ✓ |  |  |
| postcode | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `billing.coupon_courses`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| coupon_id | uuid | ✗ |  | PK, FK → coupons.id |
| course_id | uuid | ✗ |  | PK |

### `billing.coupon_plans`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| coupon_id | uuid | ✗ |  | PK, FK → coupons.id |
| plan_id | uuid | ✗ |  | PK, FK → plans.id |

### `billing.coupon_redemptions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| coupon_id | uuid | ✗ |  | FK → coupons.id |
| user_id | uuid | ✗ |  |  |
| course_id | uuid | ✓ |  |  |
| order_id | uuid | ✓ |  |  |
| amount_saved | numeric | ✗ |  |  |
| currency | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| subscription_id | uuid | ✓ |  | FK → organization_subscriptions.id |
| plan_id | uuid | ✓ |  | FK → plans.id |

### `billing.coupons`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| code | text | ✗ |  |  |
| type | coupon_type_t | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency | text | ✓ |  |  |
| max_redemptions | int4 | ✓ |  |  |
| per_user_limit | int4 | ✓ | 1 |  |
| starts_at | timestamptz | ✓ |  |  |
| expires_at | timestamptz | ✓ |  |  |
| min_order_total | numeric | ✓ |  |  |
| applies_to_all | bool | ✗ | true |  |
| is_active | bool | ✗ | true |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| applies_to | text | ✓ | 'courses'::text |  |

### `billing.mp_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | varchar(64) | ✗ |  | PK |
| preapproval_id | text | ✓ |  |  |
| user_id | uuid | ✗ |  |  |
| organization_id | uuid | ✗ |  |  |
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
| course_id | uuid | ✓ |  |  |
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

### `billing.organization_billing_cycles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
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

### `billing.organization_member_events`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| subscription_id | uuid | ✓ |  | FK → organization_subscriptions.id |
| member_id | uuid | ✗ |  |  |
| user_id | uuid | ✓ |  |  |
| event_type | text | ✗ |  |  |
| was_billable | bool | ✓ |  |  |
| is_billable | bool | ✓ |  |  |
| event_date | timestamptz | ✗ | now() |  |
| performed_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `billing.organization_subscriptions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
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

### `billing.payment_events`

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

### `billing.payment_plans`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `billing.payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| provider | text | ✗ |  | UNIQUE |
| provider_payment_id | text | ✓ |  | UNIQUE |
| user_id | uuid | ✗ |  |  |
| course_id | uuid | ✓ |  |  |
| amount | numeric | ✓ |  |  |
| currency | text | ✓ | 'USD'::text |  |
| status | text | ✗ | 'completed'::text |  |
| created_at | timestamptz | ✗ | now() |  |
| product_type | text | ✓ |  |  |
| product_id | uuid | ✓ |  |  |
| organization_id | uuid | ✓ |  |  |
| approved_at | timestamptz | ✓ |  |  |
| metadata | jsonb | ✓ |  |  |
| gateway | text | ✓ |  |  |
| exchange_rate | numeric | ✓ |  |  |

### `billing.paypal_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | varchar(50) | ✗ |  | PK |
| order_id | varchar(100) | ✓ |  |  |
| user_id | uuid | ✗ |  |  |
| organization_id | uuid | ✓ |  |  |
| plan_id | uuid | ✓ |  | FK → plans.id |
| plan_slug | text | ✓ |  |  |
| billing_period | text | ✓ |  |  |
| amount | numeric | ✓ |  |  |
| currency | text | ✓ | 'USD'::text |  |
| product_type | text | ✓ |  |  |
| course_id | uuid | ✓ |  |  |
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

### `billing.plans`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  | UNIQUE |
| features | jsonb | ✓ |  |  |
| is_active | bool | ✓ | true |  |
| billing_type | text | ✓ | 'per_user'::text |  |
| slug | text | ✓ |  |  |
| monthly_amount | numeric | ✓ |  |  |
| annual_amount | numeric | ✓ |  |  |
| paypal_product_id | text | ✓ |  |  |
| paypal_plan_monthly_id | text | ✓ |  |  |
| paypal_plan_annual_id | text | ✓ |  |  |
| mp_plan_monthly_id | text | ✓ |  |  |
| mp_plan_annual_id | text | ✓ |  |  |
| status | text | ✗ | 'available'::text |  |
| paypal_product_id_sandbox | text | ✓ |  |  |
| paypal_plan_monthly_id_sandbox | text | ✓ |  |  |
| paypal_plan_annual_id_sandbox | text | ✓ |  |  |
| annual_discount_percent | numeric | ✓ | 0 |  |

### `billing.subscription_notifications_log`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| subscription_id | uuid | ✗ |  | UNIQUE, FK → organization_subscriptions.id |
| notification_type | text | ✗ |  | UNIQUE |
| sent_at | timestamptz | ✓ | now() |  |
