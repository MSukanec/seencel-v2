# Database Schema (Auto-generated)
> Generated: 2026-02-23T12:14:47.276Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [NOTIFICATIONS] Tables (chunk 1: notifications.email_queue — notifications.user_notifications)

### `notifications.email_queue`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipient_email | text | ✗ |  |  |
| recipient_name | text | ✓ |  |  |
| template_type | text | ✗ |  |  |
| subject | text | ✗ |  |  |
| data | jsonb | ✗ | '{}'::jsonb |  |
| status | text | ✗ | 'pending'::text |  |
| attempts | int4 | ✓ | 0 |  |
| last_error | text | ✓ |  |  |
| sent_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `notifications.notification_settings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| user_id | uuid | ✗ |  | PK |
| email_marketing | bool | ✓ | true |  |
| email_transactional | bool | ✓ | true |  |
| push_enabled | bool | ✓ | true |  |
| notify_on_course_access | bool | ✓ | true |  |
| notify_on_payment | bool | ✓ | true |  |

### `notifications.notifications`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| type | text | ✗ |  |  |
| title | text | ✗ |  |  |
| body | text | ✓ |  |  |
| data | jsonb | ✓ | '{}'::jsonb |  |
| audience | text | ✗ | 'direct'::text |  |
| role_id | uuid | ✓ |  |  |
| org_id | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| start_at | timestamptz | ✓ |  |  |
| expires_at | timestamptz | ✓ |  |  |

### `notifications.push_subscriptions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE |
| endpoint | text | ✗ |  | UNIQUE |
| p256dh | text | ✗ |  |  |
| auth | text | ✗ |  |  |
| user_agent | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |

### `notifications.user_notifications`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE |
| notification_id | uuid | ✗ |  | UNIQUE, FK → notifications.id |
| delivered_at | timestamptz | ✗ | now() |  |
| read_at | timestamptz | ✓ |  |  |
| clicked_at | timestamptz | ✓ |  |  |
