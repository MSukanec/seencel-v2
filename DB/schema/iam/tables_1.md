# Database Schema (Auto-generated)
> Generated: 2026-02-21T19:23:32.061Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Tables (chunk 1: iam.dashboard_layouts — iam.users)

### `iam.dashboard_layouts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| layout_key | text | ✗ | 'org_dashboard'::text | UNIQUE |
| layout_data | jsonb | ✗ | '[]'::jsonb |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `iam.debug_signup_log`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| step | text | ✗ |  |  |
| payload | jsonb | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `iam.external_actor_scopes`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| external_actor_id | uuid | ✗ |  | UNIQUE, FK → organization_external_actors.id |
| permission_key | text | ✗ |  | UNIQUE |
| created_at | timestamptz | ✗ | now() |  |

### `iam.feedback`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| message | text | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| metadata | jsonb | ✓ | '{}'::jsonb |  |

### `iam.linked_accounts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| auth_id | uuid | ✗ |  | UNIQUE |
| provider_source | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `iam.organization_clients`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| is_active | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `iam.organization_data`

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

### `iam.organization_external_actors`

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

### `iam.organization_invitations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| email | text | ✗ |  |  |
| status | text | ✓ | 'pending'::text |  |
| token | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| accepted_at | timestamptz | ✓ |  |  |
| role_id | uuid | ✓ |  | FK → roles.id |
| invited_by | uuid | ✓ |  | FK → organization_members.id |
| updated_at | timestamptz | ✓ | now() |  |
| user_id | uuid | ✓ |  | FK → users.id |
| expires_at | timestamptz | ✓ | (now() + '7 days'::interval) |  |
| invitation_type | text | ✗ | 'member'::text |  |
| actor_type | text | ✓ |  |  |
| project_id | uuid | ✓ |  |  |
| client_id | uuid | ✓ |  |  |

### `iam.organization_members`

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

### `iam.organization_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  | UNIQUE, FK → organizations.id |
| default_pdf_template_id | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| default_currency_id | uuid | ✓ |  |  |
| default_wallet_id | uuid | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| use_currency_exchange | bool | ✗ | false |  |
| functional_currency_id | uuid | ✓ |  |  |
| insight_config | jsonb | ✓ | '{}'::jsonb |  |
| currency_decimal_places | int4 | ✓ | 2 |  |
| default_tax_label_id | uuid | ✓ |  |  |
| kpi_compact_format | bool | ✗ | false |  |

### `iam.organization_recipe_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| task_id | uuid | ✗ |  | UNIQUE |
| recipe_id | uuid | ✗ |  |  |
| adopted_at | timestamptz | ✗ | now() |  |

### `iam.organizations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| created_at | timestamptz | ✗ | now() |  |
| name | text | ✗ |  |  |
| created_by | uuid | ✓ |  | FK → users.id |
| is_active | bool | ✗ | true |  |
| updated_at | timestamptz | ✗ | now() |  |
| plan_id | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| owner_id | uuid | ✓ |  | FK → users.id |
| settings | jsonb | ✓ | '{}'::jsonb |  |
| is_demo | bool | ✗ | false |  |
| logo_url | text | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| purchased_seats | int4 | ✓ | 0 |  |
| business_mode | text | ✗ | 'professional'::text |  |

### `iam.permissions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| key | text | ✗ |  | UNIQUE |
| description | text | ✗ |  |  |
| category | text | ✗ |  |  |
| is_system | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |

### `iam.project_access`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | UNIQUE |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| access_type | text | ✗ |  |  |
| access_level | text | ✗ | 'viewer'::text |  |
| granted_by | uuid | ✓ |  | FK → organization_members.id |
| is_active | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| client_id | uuid | ✓ |  |  |

### `iam.role_permissions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| role_id | uuid | ✗ |  | UNIQUE, FK → roles.id |
| permission_id | uuid | ✗ |  | UNIQUE, FK → permissions.id |
| created_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |

### `iam.roles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| type | text | ✓ |  |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| is_system | bool | ✗ | false |  |

### `iam.support_messages`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| message | text | ✗ |  |  |
| sender | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| read_by_admin | bool | ✗ | false |  |
| read_by_user | bool | ✗ | false |  |

### `iam.user_acquisition`

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

### `iam.user_data`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| country | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| birthdate | date | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| first_name | text | ✓ |  |  |
| last_name | text | ✓ |  |  |
| phone_e164 | text | ✓ |  |  |

### `iam.user_organization_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| last_project_id | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `iam.user_preferences`

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

### `iam.user_presence`

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

### `iam.user_view_history`

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

### `iam.users`

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
