# Database Schema (Auto-generated)
> Generated: 2026-02-23T12:14:47.276Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONTACTS] Tables (chunk 1: contacts.contact_categories — contacts.contacts)

### `contacts.contact_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| organization_id | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |

### `contacts.contact_category_links`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| contact_id | uuid | ✗ |  | UNIQUE, FK → contacts.id |
| contact_category_id | uuid | ✗ |  | UNIQUE, FK → contact_categories.id |
| created_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✗ |  |  |
| updated_at | timestamptz | ✓ | now() |  |

### `contacts.contacts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| first_name | text | ✓ |  |  |
| email | text | ✓ |  |  |
| phone | text | ✓ |  |  |
| company_name | text | ✓ |  |  |
| location | text | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| last_name | text | ✓ |  |  |
| linked_user_id | uuid | ✓ |  |  |
| full_name | text | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| national_id | text | ✓ |  | UNIQUE |
| avatar_updated_at | timestamptz | ✓ |  |  |
| is_local | bool | ✗ | true |  |
| display_name_override | text | ✓ |  |  |
| linked_at | timestamptz | ✓ |  |  |
| sync_status | text | ✗ | 'local'::text |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| image_url | text | ✓ |  |  |
| import_batch_id | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| contact_type | text | ✗ | 'person'::text |  |
| company_id | uuid | ✓ |  | FK → contacts.id |
