# Database Schema (Auto-generated)
> Generated: 2026-02-22T17:21:28.968Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AUDIT] Tables (chunk 1: audit.changelog_entries — audit.organization_activity_logs)

### `audit.changelog_entries`

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
| created_by | uuid | ✓ |  |  |

### `audit.organization_activity_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| action | text | ✗ |  |  |
| target_table | text | ✗ |  |  |
| target_id | uuid | ✓ |  |  |
| metadata | jsonb | ✓ | '{}'::jsonb |  |
| created_at | timestamptz | ✗ | now() |  |
| member_id | uuid | ✓ |  |  |
