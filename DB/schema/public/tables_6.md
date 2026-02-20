# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 6: subcontract_tasks — wallets)

### `subcontract_tasks`

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

### `subcontracts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
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
| contact_id | uuid | ✓ |  | FK → contacts.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✓ | false |  |
| currency_id | uuid | ✓ |  | FK → currencies.id |
| adjustment_index_type_id | uuid | ✓ |  | FK → economic_index_types.id |
| base_period_year | int4 | ✓ |  |  |
| base_period_month | int4 | ✓ |  |  |
| base_index_value | numeric | ✓ |  |  |

### `subscription_notifications_log`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| subscription_id | uuid | ✗ |  | UNIQUE, FK → organization_subscriptions.id |
| notification_type | text | ✗ |  | UNIQUE |
| sent_at | timestamptz | ✓ | now() |  |

### `support_messages`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| message | text | ✗ |  |  |
| sender | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| read_by_admin | bool | ✗ | false |  |
| read_by_user | bool | ✗ | false |  |

### `system_error_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| domain | text | ✗ |  |  |
| entity | text | ✗ |  |  |
| function_name | text | ✗ |  |  |
| error_message | text | ✗ |  |  |
| context | jsonb | ✓ |  |  |
| severity | text | ✗ | 'error'::text |  |
| created_at | timestamptz | ✗ | now() |  |

### `system_job_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| subscription_id | uuid | ✓ |  |  |
| job_type | text | ✗ |  |  |
| details | jsonb | ✓ |  |  |
| status | text | ✗ |  |  |
| error_message | text | ✓ |  |  |
| processed_at | timestamptz | ✓ | now() |  |

### `tax_labels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| code | text | ✗ |  | UNIQUE |
| name | text | ✗ |  |  |
| country_codes | _text | ✓ |  |  |
| is_system | bool | ✓ | true |  |

### `testimonials`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| course_id | uuid | ✓ |  | FK → courses.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
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
| user_id | uuid | ✓ |  | FK → users.id |

### `user_acquisition`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| source | text | ✗ |  |  |
| medium | text | ✓ |  |  |
| campaign | text | ✓ |  |  |
| content | text | ✓ |  |  |
| landing_page | text | ✓ |  |  |
| referrer | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |

### `user_data`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| country | uuid | ✓ |  | FK → countries.id |
| created_at | timestamptz | ✓ | now() |  |
| birthdate | date | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| first_name | text | ✓ |  |  |
| last_name | text | ✓ |  |  |
| phone_e164 | text | ✓ |  |  |

### `user_notifications`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| notification_id | uuid | ✗ |  | UNIQUE, FK → notifications.id |
| delivered_at | timestamptz | ✗ | now() |  |
| read_at | timestamptz | ✓ |  |  |
| clicked_at | timestamptz | ✓ |  |  |

### `user_organization_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| last_project_id | uuid | ✓ |  | FK → projects.id |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `user_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| last_organization_id | uuid | ✓ |  | FK → organizations.id |
| theme | text | ✓ | 'dark'::text |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| home_checklist | jsonb | ✗ | '{"create_contact": false, "create_pr... |  |
| home_banner_dismissed | bool | ✗ | false |  |
| layout | text | ✗ | 'classic'::text |  |
| language | text | ✗ | 'es'::text |  |
| sidebar_mode | text | ✗ | 'docked'::text |  |
| timezone | text | ✓ | 'UTC'::text |  |

### `user_presence`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| user_id | uuid | ✗ |  | PK, FK → users.id |
| organization_id | uuid | ✓ |  |  |
| last_seen_at | timestamptz | ✗ | now() |  |
| status | text | ✗ | 'online'::text |  |
| user_agent | text | ✓ |  |  |
| locale | text | ✓ |  |  |
| updated_from | text | ✓ |  |  |
| current_view | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| session_id | uuid | ✓ |  |  |

### `user_view_history`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| view_name | text | ✗ |  |  |
| entered_at | timestamptz | ✗ | now() |  |
| exited_at | timestamptz | ✓ |  |  |
| duration_seconds | int4 | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| session_id | uuid | ✓ |  |  |

### `users`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| created_at | timestamptz | ✗ | now() |  |
| auth_id | uuid | ✗ |  | UNIQUE |
| email | text | ✗ |  |  |
| avatar_url | text | ✓ |  |  |
| avatar_source | avatar_source_t | ✓ | 'email'::avatar_source_t |  |
| full_name | text | ✓ |  |  |
| role_id | uuid | ✗ | 'e6cc68d2-fc28-421b-8bd3-303326ef91b8... | FK → roles.id |
| updated_at | timestamptz | ✓ | now() |  |
| is_active | bool | ✗ | true |  |
| signup_completed | bool | ✗ | false |  |

### `wallets`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| name | text | ✗ |  | UNIQUE |
| created_at | timestamptz | ✗ | now() |  |
| is_active | bool | ✗ | true |  |
| updated_at | timestamptz | ✗ | now() |  |
