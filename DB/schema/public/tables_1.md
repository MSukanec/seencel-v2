# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 1: app_settings — course_lesson_progress)

### `app_settings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| key | text | ✗ |  | PK |
| value | text | ✓ |  |  |
| description | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |

### `bank_transfer_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| order_id | uuid | ✗ |  |  |
| user_id | uuid | ✗ |  | FK → users.id |
| amount | numeric | ✗ |  |  |
| currency | text | ✗ |  |  |
| payer_name | text | ✓ |  |  |
| payer_note | text | ✓ |  |  |
| status | payment_review_status | ✗ | 'pending'::payment_review_status |  |
| reviewed_by | uuid | ✓ |  | FK → users.id |
| reviewed_at | timestamptz | ✓ |  |  |
| review_reason | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| payment_id | uuid | ✓ |  | FK → payments.id |
| course_id | uuid | ✓ |  | FK → courses.id |
| discount_percent | numeric | ✓ | 5.0 |  |
| discount_amount | numeric | ✓ | 0 |  |
| receipt_url | text | ✓ |  |  |
| plan_id | uuid | ✓ |  | FK → plans.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| billing_period | text | ✓ |  |  |
| exchange_rate | numeric | ✓ |  |  |

### `billing_profiles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| is_company | bool | ✗ | false |  |
| full_name | text | ✓ |  |  |
| company_name | text | ✓ |  |  |
| tax_id | text | ✓ |  |  |
| country_id | uuid | ✓ |  | FK → countries.id |
| address_line1 | text | ✓ |  |  |
| city | text | ✓ |  |  |
| postcode | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `brands`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `calendar_event_attendees`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| event_id | uuid | ✗ |  | UNIQUE, FK → calendar_events.id |
| member_id | uuid | ✗ |  | UNIQUE, FK → organization_members.id |
| status | text | ✗ | 'pending'::text |  |
| created_at | timestamptz | ✗ | now() |  |

### `calendar_event_reminders`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| event_id | uuid | ✗ |  | FK → calendar_events.id |
| remind_at | timestamptz | ✗ |  |  |
| reminder_type | text | ✗ | 'notification'::text |  |
| is_sent | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |

### `calendar_events`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| title | text | ✗ |  |  |
| description | text | ✓ |  |  |
| location | text | ✓ |  |  |
| color | text | ✓ |  |  |
| start_at | timestamptz | ✗ |  |  |
| end_at | timestamptz | ✓ |  |  |
| is_all_day | bool | ✗ | false |  |
| timezone | text | ✓ | 'America/Argentina/Buenos_Aires'::text |  |
| source_type | text | ✓ |  |  |
| source_id | uuid | ✓ |  |  |
| recurrence_rule | text | ✓ |  |  |
| recurrence_end_at | timestamptz | ✓ |  |  |
| parent_event_id | uuid | ✓ |  | FK → calendar_events.id |
| status | text | ✗ | 'scheduled'::text |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| deleted_at | timestamptz | ✓ |  |  |

### `capital_adjustments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| partner_id | uuid | ✓ |  | FK → capital_participants.id |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✗ | 1 |  |
| amount | numeric | ✗ |  |  |
| adjustment_date | date | ✗ | now() |  |
| reason | text | ✓ |  |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `capital_participants`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| contact_id | uuid | ✓ |  | FK → contacts.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| updated_at | timestamptz | ✓ | now() |  |
| notes | text | ✓ |  |  |
| status | text | ✗ | 'active'::text |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| ownership_percentage | numeric | ✓ |  |  |

### `changelog_entries`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| title | text | ✗ |  |  |
| description | text | ✓ |  |  |
| date | date | ✗ |  |  |
| is_public | bool | ✗ | true |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| type | changelog_type | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → users.id |

### `client_commitments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| client_id | uuid | ✗ |  | FK → project_clients.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| commitment_method | client_commitment_method | ✗ | 'fixed'::client_commitment_method |  |
| unit_name | text | ✓ |  |  |
| concept | text | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| description | text | ✓ |  |  |
| quote_id | uuid | ✓ |  |  |

### `client_payment_schedule`

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
| organization_id | uuid | ✗ |  | FK → organizations.id |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `client_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| commitment_id | uuid | ✓ |  | FK → client_commitments.id |
| schedule_id | uuid | ✓ |  | FK → client_payment_schedule.id |
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
| client_id | uuid | ✓ |  | FK → project_clients.id |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |

### `client_portal_branding`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | UNIQUE, FK → projects.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
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

### `client_portal_settings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| project_id | uuid | ✗ |  | PK, FK → projects.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| show_dashboard | bool | ✗ | true |  |
| show_installments | bool | ✗ | false |  |
| show_payments | bool | ✗ | false |  |
| show_logs | bool | ✗ | false |  |
| show_amounts | bool | ✗ | true |  |
| show_progress | bool | ✗ | true |  |
| allow_comments | bool | ✗ | false |  |
| updated_at | timestamptz | ✓ | now() |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| show_quotes | bool | ✓ | false |  |

### `client_roles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| is_system | bool | ✓ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `contact_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |

### `contact_category_links`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| contact_id | uuid | ✗ |  | UNIQUE, FK → contacts.id |
| contact_category_id | uuid | ✗ |  | UNIQUE, FK → contact_categories.id |
| created_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| updated_at | timestamptz | ✓ | now() |  |

### `contacts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| first_name | text | ✓ |  |  |
| email | text | ✓ |  |  |
| phone | text | ✓ |  |  |
| company_name | text | ✓ |  |  |
| location | text | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| last_name | text | ✓ |  |  |
| linked_user_id | uuid | ✓ |  | FK → users.id |
| full_name | text | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| national_id | text | ✓ |  | UNIQUE |
| avatar_updated_at | timestamptz | ✓ |  |  |
| is_local | bool | ✗ | true |  |
| display_name_override | text | ✓ |  |  |
| linked_at | timestamptz | ✓ |  |  |
| sync_status | text | ✗ | 'local'::text |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| image_url | text | ✓ |  |  |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| contact_type | text | ✗ | 'person'::text |  |
| company_id | uuid | ✓ |  | FK → contacts.id |

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

### `coupon_courses`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| coupon_id | uuid | ✗ |  | PK, FK → coupons.id |
| course_id | uuid | ✗ |  | PK, FK → courses.id |

### `coupon_plans`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| coupon_id | uuid | ✗ |  | PK, FK → coupons.id |
| plan_id | uuid | ✗ |  | PK, FK → plans.id |

### `coupon_redemptions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| coupon_id | uuid | ✗ |  | FK → coupons.id |
| user_id | uuid | ✗ |  | FK → users.id |
| course_id | uuid | ✓ |  | FK → courses.id |
| order_id | uuid | ✓ |  |  |
| amount_saved | numeric | ✗ |  |  |
| currency | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| subscription_id | uuid | ✓ |  | FK → organization_subscriptions.id |
| plan_id | uuid | ✓ |  | FK → plans.id |

### `coupons`

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
| created_by | uuid | ✓ |  | FK → users.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| applies_to | text | ✓ | 'courses'::text |  |

### `course_details`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| course_id | uuid | ✗ |  | UNIQUE, FK → courses.id |
| badge_text | text | ✓ |  |  |
| highlights | _text | ✓ |  |  |
| preview_video_id | text | ✓ |  |  |
| seo_keywords | _text | ✓ |  |  |
| landing_sections | jsonb | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| instructor_id | uuid | ✓ |  | FK → course_instructors.id |
| endorsement_image_path | text | ✓ |  |  |
| endorsement_title | text | ✓ | 'Avalado por...'::text |  |
| endorsement_description | text | ✓ |  |  |

### `course_enrollments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| course_id | uuid | ✗ |  | UNIQUE, FK → courses.id |
| status | text | ✗ | 'active'::text |  |
| started_at | timestamptz | ✗ | now() |  |
| expires_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `course_faqs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| course_id | uuid | ✗ |  | FK → courses.id |
| question | text | ✗ |  |  |
| answer | text | ✗ |  |  |
| sort_index | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `course_instructors`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| title | text | ✓ |  |  |
| bio | text | ✓ |  |  |
| avatar_path | text | ✓ |  |  |
| credentials | _text | ✓ |  |  |
| linkedin_url | text | ✓ |  |  |
| youtube_url | text | ✓ |  |  |
| instagram_url | text | ✓ |  |  |
| website_url | text | ✓ |  |  |
| user_id | uuid | ✓ |  | FK → users.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → users.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `course_lesson_notes`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| lesson_id | uuid | ✗ |  | FK → course_lessons.id |
| body | text | ✗ |  |  |
| time_sec | int4 | ✓ |  |  |
| is_pinned | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| note_type | text | ✗ | 'marker'::text |  |

### `course_lesson_progress`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| lesson_id | uuid | ✗ |  | UNIQUE, FK → course_lessons.id |
| progress_pct | numeric | ✗ | 0 |  |
| last_position_sec | int4 | ✗ | 0 |  |
| completed_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_completed | bool | ✗ | false |  |
| is_favorite | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |
