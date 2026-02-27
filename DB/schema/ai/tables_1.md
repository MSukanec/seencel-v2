# Database Schema (Auto-generated)
> Generated: 2026-02-26T22:25:46.213Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AI] Tables (chunk 1: ai.ai_context_snapshots — ai.ai_user_usage_limits)

### `ai.ai_context_snapshots`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✓ |  |  |
| organization_id | uuid | ✓ |  |  |
| type | text | ✗ |  |  |
| content | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |

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

### `ai.ai_messages`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✓ |  |  |
| role | text | ✗ |  |  |
| content | text | ✗ |  |  |
| context_type | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

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

### `ai.ai_user_greetings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✓ |  | UNIQUE |
| period | text | ✗ |  | UNIQUE |
| greeting | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `ai.ai_user_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| user_id | uuid | ✗ |  | PK |
| display_name | text | ✓ |  |  |
| tone | text | ✓ | 'amistoso'::text |  |
| language | text | ✓ | 'es'::text |  |
| personality | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |

### `ai.ai_user_usage_limits`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| user_id | uuid | ✗ |  | PK |
| plan | text | ✗ | 'free'::text |  |
| daily_limit | int4 | ✗ | 3 |  |
| prompts_used_today | int4 | ✗ | 0 |  |
| last_prompt_at | timestamptz | ✓ |  |  |
| last_reset_at | date | ✓ | CURRENT_DATE |  |
