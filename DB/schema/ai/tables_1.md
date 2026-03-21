# Database Schema (Auto-generated)
> Generated: 2026-03-20T17:04:16.493Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AI] Tables (chunk 1: ai.ai_import_mapping_patterns — ai.ai_usage_logs)

### `ai.ai_import_mapping_patterns`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| entity | text | ✗ |  | UNIQUE |
| source_header | text | ✗ |  | UNIQUE |
| target_field | text | ✗ |  | UNIQUE |
| usage_count | int4 | ✗ | 1 |  |
| last_used_at | timestamptz | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |

### `ai.ai_import_value_patterns`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| entity | text | ✗ |  | UNIQUE |
| comp_field | text | ✗ |  | UNIQUE |
| source_value | text | ✗ |  | UNIQUE |
| target_id | text | ✗ |  |  |
| usage_count | int4 | ✗ | 1 |  |
| last_used_at | timestamptz | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |

### `ai.ai_organization_usage_limits`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| organization_id | uuid | ✗ |  | PK |
| plan | text | ✗ | 'free'::text |  |
| daily_requests_limit | int4 | ✗ | 10 |  |
| requests_used_today | int4 | ✗ | 0 |  |
| last_request_at | timestamptz | ✓ |  |  |
| last_reset_at | date | ✓ | CURRENT_DATE |  |
| monthly_tokens_limit | int4 | ✓ |  |  |
| tokens_used_this_month | int4 | ✓ | 0 |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |

### `ai.ai_usage_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✓ |  |  |
| provider | text | ✓ | 'openai'::text |  |
| model | text | ✓ | 'gpt-4o'::text |  |
| prompt_tokens | int4 | ✓ |  |  |
| completion_tokens | int4 | ✓ |  |  |
| total_tokens | int4 | ✓ |  |  |
| cost_usd | numeric | ✓ |  |  |
| context_type | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |
