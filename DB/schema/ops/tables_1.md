# Database Schema (Auto-generated)
> Generated: 2026-03-01T21:32:52.143Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [OPS] Tables (chunk 1: ops.ops_alerts — ops.system_job_logs)

### `ops.ops_alerts`

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
| organization_id | uuid | ✓ |  |  |
| user_id | uuid | ✓ |  |  |
| provider | text | ✓ |  |  |
| provider_payment_id | text | ✓ |  |  |
| payment_id | uuid | ✓ |  |  |
| event_id | uuid | ✓ |  |  |
| fingerprint | text | ✓ |  |  |
| evidence | jsonb | ✗ | '{}'::jsonb |  |
| ack_by | uuid | ✓ |  |  |
| ack_at | timestamptz | ✓ |  |  |
| resolved_by | uuid | ✓ |  |  |
| resolved_at | timestamptz | ✓ |  |  |

### `ops.ops_check_runs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| check_suite | text | ✗ | 'ops_core'::text |  |
| status | text | ✗ | 'success'::text |  |
| duration_ms | int4 | ✓ |  |  |
| stats | jsonb | ✗ | '{}'::jsonb |  |
| error_message | text | ✓ |  |  |

### `ops.ops_repair_actions`

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

### `ops.ops_repair_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| alert_id | uuid | ✓ |  | FK → ops_alerts.id |
| action_id | text | ✗ |  |  |
| executed_by | uuid | ✓ |  |  |
| result | text | ✓ |  |  |
| details | jsonb | ✓ | '{}'::jsonb |  |
| created_at | timestamptz | ✓ | now() |  |

### `ops.system_error_logs`

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

### `ops.system_job_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| subscription_id | uuid | ✓ |  |  |
| job_type | text | ✗ |  |  |
| details | jsonb | ✓ |  |  |
| status | text | ✗ |  |  |
| error_message | text | ✓ |  |  |
| processed_at | timestamptz | ✓ | now() |  |
