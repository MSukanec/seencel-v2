# Database Schema (Auto-generated)
> Generated: 2026-02-25T18:05:07.898Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AUDIT] Tables (chunk 1: audit.changelog_entries — audit.signatures)

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

### `audit.signatures`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| document_type | text | ✗ |  |  |
| document_id | uuid | ✗ |  |  |
| signer_name | text | ✗ |  |  |
| signer_email | text | ✓ |  |  |
| signer_user_id | uuid | ✓ |  |  |
| signature_url | text | ✗ |  |  |
| signature_method | text | ✗ |  |  |
| ip_address | inet | ✓ |  |  |
| user_agent | text | ✓ |  |  |
| signed_at | timestamptz | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
