# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Tables (chunk 1: iam.organization_clients — iam.organization_invitations)

### `iam.organization_clients`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| user_id | uuid | ✗ |  | UNIQUE |
| is_active | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `iam.organization_invitations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| email | text | ✗ |  |  |
| status | text | ✓ | 'pending'::text |  |
| token | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| accepted_at | timestamptz | ✓ |  |  |
| role_id | uuid | ✓ |  |  |
| invited_by | uuid | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| user_id | uuid | ✓ |  |  |
| expires_at | timestamptz | ✓ | (now() + '7 days'::interval) |  |
| invitation_type | text | ✗ | 'member'::text |  |
| actor_type | text | ✓ |  |  |
| project_id | uuid | ✓ |  |  |
| client_id | uuid | ✓ |  |  |
