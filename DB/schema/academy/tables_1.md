# Database Schema (Auto-generated)
> Generated: 2026-02-21T13:42:37.043Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [ACADEMY] Tables (chunk 1: academy.course_details — academy.courses)

### `academy.course_details`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| course_id | uuid | ✗ |  | UNIQUE, FK → courses.id |
| badge_text | text | ✓ |  |  |
| highlights | _text | ✓ |  |  |
| preview_video_id | text | ✓ |  |  |
| seo_keywords | _text | ✓ |  |  |
| landing_sections | jsonb | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| instructor_id | uuid | ✓ |  | FK → course_instructors.id |
| endorsement_image_path | text | ✓ |  |  |
| endorsement_title | text | ✓ | 'Avalado por...'::text |  |
| endorsement_description | text | ✓ |  |  |

### `academy.course_enrollments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE |
| course_id | uuid | ✗ |  | UNIQUE, FK → courses.id |
| status | text | ✗ | 'active'::text |  |
| started_at | timestamptz | ✗ | now() |  |
| expires_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `academy.course_faqs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| course_id | uuid | ✗ |  | FK → courses.id |
| question | text | ✗ |  |  |
| answer | text | ✗ |  |  |
| sort_index | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `academy.course_instructors`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| title | text | ✓ |  |  |
| bio | text | ✓ |  |  |
| avatar_path | text | ✓ |  |  |
| credentials | _text | ✓ |  |  |
| linkedin_url | text | ✓ |  |  |
| youtube_url | text | ✓ |  |  |
| instagram_url | text | ✓ |  |  |
| website_url | text | ✓ |  |  |
| user_id | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `academy.course_lesson_notes`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  |  |
| lesson_id | uuid | ✗ |  | FK → course_lessons.id |
| body | text | ✗ |  |  |
| time_sec | int4 | ✓ |  |  |
| is_pinned | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| note_type | text | ✗ | 'marker'::text |  |

### `academy.course_lesson_progress`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE |
| lesson_id | uuid | ✗ |  | UNIQUE, FK → course_lessons.id |
| progress_pct | numeric | ✗ | 0 |  |
| last_position_sec | int4 | ✗ | 0 |  |
| completed_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_completed | bool | ✗ | false |  |
| is_favorite | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |

### `academy.course_lessons`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| module_id | uuid | ✓ |  | FK → course_modules.id |
| title | text | ✗ |  |  |
| duration_sec | int4 | ✓ |  |  |
| free_preview | bool | ✗ | false |  |
| sort_index | int4 | ✗ | 0 |  |
| is_active | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| video_provider | video_provider_t | ✗ | 'vimeo'::video_provider_t |  |
| video_id | text | ✓ |  |  |

### `academy.course_modules`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| course_id | uuid | ✗ |  | FK → courses.id |
| title | text | ✗ |  |  |
| sort_index | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| description | text | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| image_path | text | ✓ |  |  |

### `academy.courses`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| slug | text | ✗ |  | UNIQUE |
| title | text | ✗ |  |  |
| short_description | text | ✓ |  |  |
| is_active | bool | ✗ | true |  |
| visibility | text | ✗ | 'public'::text |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| price | numeric | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| status | text | ✗ | 'available'::text |  |
| image_path | text | ✓ |  |  |
