# Database Schema (Auto-generated)
> Generated: 2026-02-22T20:08:16.861Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] Tables (chunk 1: planner.attachments — planner.reminders)

### `planner.attachments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| item_id | uuid | ✗ |  | FK → items.id |
| file_url | text | ✗ |  |  |
| file_name | text | ✓ |  |  |
| uploaded_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |

### `planner.attendees`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| item_id | uuid | ✗ |  | UNIQUE, FK → items.id |
| member_id | uuid | ✗ |  | UNIQUE |
| status | text | ✗ | 'pending'::text |  |
| created_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |

### `planner.board_permissions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| board_id | uuid | ✗ |  | FK → boards.id |
| member_id | uuid | ✓ |  |  |
| role_id | uuid | ✓ |  |  |
| permission_level | text | ✗ | 'view'::text |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `planner.boards`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| color | text | ✓ |  |  |
| icon | text | ✓ |  |  |
| default_list_id | uuid | ✓ |  |  |
| is_template | bool | ✗ | false |  |
| template_id | uuid | ✓ |  | FK → boards.id |
| settings | jsonb | ✗ | '{}'::jsonb |  |
| is_archived | bool | ✗ | false |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `planner.checklist_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| checklist_id | uuid | ✗ |  | FK → checklists.id |
| content | text | ✗ |  |  |
| is_completed | bool | ✗ | false |  |
| completed_at | timestamptz | ✓ |  |  |
| completed_by | uuid | ✓ |  |  |
| position | int4 | ✗ | 0 |  |
| due_date | date | ✓ |  |  |
| assigned_to | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| updated_by | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |

### `planner.checklists`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| item_id | uuid | ✗ |  | FK → items.id |
| title | text | ✗ | 'Checklist'::text |  |
| position | int4 | ✗ | 0 |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `planner.comments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| item_id | uuid | ✗ |  | FK → items.id |
| author_id | uuid | ✓ |  |  |
| content | text | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `planner.item_labels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| item_id | uuid | ✗ |  | PK, FK → items.id |
| label_id | uuid | ✗ |  | PK, FK → labels.id |
| created_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |

### `planner.item_watchers`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| item_id | uuid | ✗ |  | PK, FK → items.id |
| member_id | uuid | ✗ |  | PK |
| created_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `planner.items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| item_type | text | ✗ | 'task'::text |  |
| title | text | ✗ |  |  |
| description | text | ✓ |  |  |
| color | text | ✓ |  |  |
| start_at | timestamptz | ✓ |  |  |
| due_at | timestamptz | ✓ |  |  |
| end_at | timestamptz | ✓ |  |  |
| is_all_day | bool | ✗ | true |  |
| timezone | text | ✓ | 'America/Argentina/Buenos_Aires'::text |  |
| status | text | ✗ | 'todo'::text |  |
| priority | text | ✗ | 'none'::text |  |
| is_completed | bool | ✗ | false |  |
| completed_at | timestamptz | ✓ |  |  |
| estimated_hours | numeric | ✓ |  |  |
| actual_hours | numeric | ✓ |  |  |
| assigned_to | uuid | ✓ |  |  |
| location | text | ✓ |  |  |
| recurrence_rule | text | ✓ |  |  |
| recurrence_end_at | timestamptz | ✓ |  |  |
| parent_item_id | uuid | ✓ |  | FK → items.id |
| source_type | text | ✓ |  |  |
| source_id | uuid | ✓ |  |  |
| cover_image_url | text | ✓ |  |  |
| cover_color | text | ✓ |  |  |
| board_id | uuid | ✓ |  | FK → boards.id |
| list_id | uuid | ✓ |  | FK → lists.id |
| position | int4 | ✗ | 0 |  |
| is_archived | bool | ✗ | false |  |
| archived_at | timestamptz | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `planner.labels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| name | text | ✗ |  | UNIQUE |
| color | text | ✗ | '#6366f1'::text |  |
| description | text | ✓ |  |  |
| position | int4 | ✗ | 0 |  |
| is_default | bool | ✗ | false |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `planner.lists`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| board_id | uuid | ✗ |  | FK → boards.id |
| organization_id | uuid | ✗ |  |  |
| name | text | ✗ |  |  |
| position | int4 | ✗ | 0 |  |
| color | text | ✓ |  |  |
| limit_wip | int4 | ✓ |  |  |
| auto_complete | bool | ✗ | false |  |
| is_collapsed | bool | ✗ | false |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `planner.mentions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| comment_id | uuid | ✗ |  | FK → comments.id |
| mentioned_member_id | uuid | ✗ |  |  |
| is_read | bool | ✗ | false |  |
| read_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `planner.reminders`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| item_id | uuid | ✗ |  | FK → items.id |
| remind_at | timestamptz | ✗ |  |  |
| reminder_type | text | ✗ | 'notification'::text |  |
| is_sent | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
