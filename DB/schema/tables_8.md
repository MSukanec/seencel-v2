# Database Schema (Auto-generated)
> Generated: 2026-02-18T21:46:26.792Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Tables (chunk 8: user_view_history — wallets)

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
