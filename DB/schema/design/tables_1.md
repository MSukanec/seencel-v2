# Database Schema (Auto-generated)
> Generated: 2026-02-25T18:05:07.898Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [DESIGN] Tables (chunk 1: design.pin_board_items — design.pins)

### `design.pin_board_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| board_id | uuid | ✗ |  | UNIQUE, FK → pin_boards.id |
| pin_id | uuid | ✗ |  | UNIQUE, FK → pins.id |
| position | int4 | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |

### `design.pin_boards`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_by | uuid | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `design.pins`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| title | text | ✓ |  |  |
| source_url | text | ✓ |  |  |
| image_url | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✓ |  |  |
| project_id | uuid | ✓ |  |  |
| media_file_id | uuid | ✓ |  |  |
