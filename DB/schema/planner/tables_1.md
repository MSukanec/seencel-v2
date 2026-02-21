# Database Schema (Auto-generated)
> Generated: 2026-02-21T21:03:12.424Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] Tables (chunk 1: planner.calendar_event_attendees — planner.kanban_mentions)

### `planner.calendar_event_attendees`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| event_id | uuid | ✗ |  | UNIQUE, FK → calendar_events.id |
| member_id | uuid | ✗ |  | UNIQUE |
| status | text | ✗ | 'pending'::text |  |
| created_at | timestamptz | ✗ | now() |  |

### `planner.calendar_event_reminders`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| event_id | uuid | ✗ |  | FK → calendar_events.id |
| remind_at | timestamptz | ✗ |  |  |
| reminder_type | text | ✗ | 'notification'::text |  |
| is_sent | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |

### `planner.calendar_events`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| title | text | ✗ |  |  |
| description | text | ✓ |  |  |
| location | text | ✓ |  |  |
| color | text | ✓ |  |  |
| start_at | timestamptz | ✗ |  |  |
| end_at | timestamptz | ✓ |  |  |
| is_all_day | bool | ✗ | false |  |
| timezone | text | ✓ | 'America/Argentina/Buenos_Aires'::text |  |
| source_type | text | ✓ |  |  |
| source_id | uuid | ✓ |  |  |
| recurrence_rule | text | ✓ |  |  |
| recurrence_end_at | timestamptz | ✓ |  |  |
| parent_event_id | uuid | ✓ |  | FK → calendar_events.id |
| status | text | ✗ | 'scheduled'::text |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| deleted_at | timestamptz | ✓ |  |  |

### `planner.kanban_attachments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| card_id | uuid | ✓ |  | FK → kanban_cards.id |
| file_url | text | ✗ |  |  |
| file_name | text | ✓ |  |  |
| uploaded_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| updated_by | uuid | ✓ |  |  |

### `planner.kanban_board_permissions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| board_id | uuid | ✗ |  | FK → kanban_boards.id |
| member_id | uuid | ✓ |  |  |
| role_id | uuid | ✓ |  |  |
| permission_level | text | ✗ | 'view'::text |  |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |

### `planner.kanban_boards`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| organization_id | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| project_id | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_template | bool | ✓ | false |  |
| template_id | uuid | ✓ |  | FK → kanban_boards.id |
| default_list_id | uuid | ✓ |  |  |
| is_archived | bool | ✓ | false |  |
| color | text | ✓ |  |  |
| icon | text | ✓ |  |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| settings | jsonb | ✓ | '{}'::jsonb |  |
| updated_by | uuid | ✓ |  |  |

### `planner.kanban_card_labels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| card_id | uuid | ✗ |  | PK, FK → kanban_cards.id |
| label_id | uuid | ✗ |  | PK, FK → kanban_labels.id |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |

### `planner.kanban_card_watchers`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| card_id | uuid | ✗ |  | PK, FK → kanban_cards.id |
| member_id | uuid | ✗ |  | PK |
| created_at | timestamptz | ✓ | now() |  |

### `planner.kanban_cards`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| list_id | uuid | ✓ |  | FK → kanban_lists.id |
| title | text | ✗ |  |  |
| description | text | ✓ |  |  |
| due_date | date | ✓ |  |  |
| position | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| is_completed | bool | ✓ | false |  |
| completed_at | timestamptz | ✓ |  |  |
| assigned_to | uuid | ✓ |  |  |
| updated_at | timestamptz | ✓ |  |  |
| priority | text | ✓ | 'none'::text |  |
| estimated_hours | numeric | ✓ |  |  |
| actual_hours | numeric | ✓ |  |  |
| start_date | date | ✓ |  |  |
| cover_image_url | text | ✓ |  |  |
| cover_color | text | ✓ |  |  |
| is_archived | bool | ✓ | false |  |
| archived_at | timestamptz | ✓ |  |  |
| board_id | uuid | ✓ |  | FK → kanban_boards.id |
| updated_by | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| project_id | uuid | ✓ |  |  |

### `planner.kanban_checklist_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| checklist_id | uuid | ✗ |  | FK → kanban_checklists.id |
| content | text | ✗ |  |  |
| is_completed | bool | ✓ | false |  |
| completed_at | timestamptz | ✓ |  |  |
| completed_by | uuid | ✓ |  |  |
| position | int4 | ✓ | 0 |  |
| due_date | date | ✓ |  |  |
| assigned_to | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| updated_by | uuid | ✓ |  |  |

### `planner.kanban_checklists`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| card_id | uuid | ✗ |  | FK → kanban_cards.id |
| title | text | ✗ | 'Checklist'::text |  |
| position | int4 | ✓ | 0 |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `planner.kanban_comments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| card_id | uuid | ✓ |  | FK → kanban_cards.id |
| author_id | uuid | ✓ |  |  |
| content | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `planner.kanban_labels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| name | text | ✗ |  | UNIQUE |
| color | text | ✗ | '#6366f1'::text |  |
| description | text | ✓ |  |  |
| position | int4 | ✓ | 0 |  |
| is_default | bool | ✓ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `planner.kanban_lists`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| board_id | uuid | ✓ |  | FK → kanban_boards.id |
| name | text | ✗ |  |  |
| position | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| color | text | ✓ |  |  |
| limit_wip | int4 | ✓ |  |  |
| auto_complete | bool | ✓ | false |  |
| is_collapsed | bool | ✓ | false |  |
| updated_by | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `planner.kanban_mentions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| comment_id | uuid | ✗ |  | FK → kanban_comments.id |
| mentioned_member_id | uuid | ✗ |  |  |
| is_read | bool | ✓ | false |  |
| read_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
