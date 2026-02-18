# Database Schema (Auto-generated)
> Generated: 2026-02-17T23:22:11.037Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Tables (chunk 2: course_details — founder_vote_ballots)

### `course_details`

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

### `course_enrollments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| course_id | uuid | ✗ |  | UNIQUE, FK → courses.id |
| status | text | ✗ | 'active'::text |  |
| started_at | timestamptz | ✗ | now() |  |
| expires_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `course_faqs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| course_id | uuid | ✗ |  | FK → courses.id |
| question | text | ✗ |  |  |
| answer | text | ✗ |  |  |
| sort_index | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `course_instructors`

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
| user_id | uuid | ✓ |  | FK → users.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → users.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `course_lesson_notes`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| lesson_id | uuid | ✗ |  | FK → course_lessons.id |
| body | text | ✗ |  |  |
| time_sec | int4 | ✓ |  |  |
| is_pinned | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| note_type | text | ✗ | 'marker'::text |  |

### `course_lesson_progress`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| lesson_id | uuid | ✗ |  | UNIQUE, FK → course_lessons.id |
| progress_pct | numeric | ✗ | 0 |  |
| last_position_sec | int4 | ✗ | 0 |  |
| completed_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_completed | bool | ✗ | false |  |
| is_favorite | bool | ✗ | false |  |
| created_at | timestamptz | ✗ | now() |  |

### `course_lessons`

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

### `course_modules`

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

### `courses`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| slug | text | ✗ |  | UNIQUE |
| title | text | ✗ |  |  |
| short_description | text | ✓ |  |  |
| is_active | bool | ✗ | true |  |
| visibility | text | ✗ | 'public'::text |  |
| created_by | uuid | ✓ |  | FK → users.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| price | numeric | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| status | text | ✗ | 'available'::text |  |
| image_path | text | ✓ |  |  |

### `currencies`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| code | text | ✗ |  | UNIQUE |
| name | text | ✗ |  |  |
| symbol | text | ✗ |  |  |
| country | text | ✓ |  |  |
| is_default | bool | ✓ | false |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `dashboard_layouts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| layout_key | text | ✗ | 'org_dashboard'::text | UNIQUE |
| layout_data | jsonb | ✗ | '[]'::jsonb |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `debug_signup_log`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| step | text | ✗ |  |  |
| payload | jsonb | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `economic_index_components`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| index_type_id | uuid | ✗ |  | UNIQUE, FK → economic_index_types.id |
| key | text | ✗ |  | UNIQUE |
| name | text | ✗ |  |  |
| is_main | bool | ✓ | false |  |
| sort_order | int4 | ✓ | 0 |  |
| color | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `economic_index_types`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| name | text | ✗ |  | UNIQUE |
| description | text | ✓ |  |  |
| periodicity | text | ✗ | 'monthly'::text |  |
| base_year | int4 | ✓ |  |  |
| base_value | numeric | ✓ | 100 |  |
| source | text | ✓ |  |  |
| is_system | bool | ✓ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `economic_index_values`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| index_type_id | uuid | ✗ |  | UNIQUE, FK → economic_index_types.id |
| period_year | int4 | ✗ |  | UNIQUE |
| period_month | int4 | ✓ |  | UNIQUE |
| period_quarter | int4 | ✓ |  | UNIQUE |
| values | jsonb | ✗ | '{}'::jsonb |  |
| source_url | text | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `email_queue`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipient_email | text | ✗ |  |  |
| recipient_name | text | ✓ |  |  |
| template_type | text | ✗ |  |  |
| subject | text | ✗ |  |  |
| data | jsonb | ✗ | '{}'::jsonb |  |
| status | text | ✗ | 'pending'::text |  |
| attempts | int4 | ✓ | 0 |  |
| last_error | text | ✓ |  |  |
| sent_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `exchange_rates`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| from_currency | text | ✗ |  | UNIQUE |
| to_currency | text | ✗ |  | UNIQUE |
| rate | numeric | ✗ |  |  |
| is_active | bool | ✗ | true |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |

### `external_service_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipe_external_service_id | uuid | ✗ |  | FK → task_recipe_external_services.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| unit_price | numeric | ✗ |  |  |
| valid_from | date | ✗ | CURRENT_DATE |  |
| valid_to | date | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `feature_flag_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| position | int4 | ✓ | 0 |  |
| parent_id | uuid | ✓ |  | FK → feature_flag_categories.id |
| created_at | timestamptz | ✓ | now() |  |

### `feature_flags`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| key | varchar(100) | ✗ |  | UNIQUE |
| value | bool | ✗ | true |  |
| description | text | ✓ |  |  |
| category | varchar(50) | ✓ | 'general'::character varying |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| parent_id | uuid | ✓ |  | FK → feature_flags.id |
| position | int4 | ✓ | 0 |  |
| status | varchar(20) | ✓ | 'active'::character varying |  |
| flag_type | text | ✓ | 'feature'::text |  |
| category_id | uuid | ✓ |  | FK → feature_flag_categories.id |

### `feedback`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| message | text | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| metadata | jsonb | ✓ | '{}'::jsonb |  |

### `financial_operation_movements`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| financial_operation_id | uuid | ✗ |  | FK → financial_operations.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| wallet_id | uuid | ✗ |  | FK → organization_wallets.id |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| amount | numeric | ✗ |  |  |
| direction | text | ✗ |  |  |
| exchange_rate | numeric | ✓ |  |  |
| created_by | uuid | ✗ |  | FK → organization_members.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `financial_operations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| type | text | ✗ |  |  |
| operation_date | date | ✗ | CURRENT_DATE |  |
| description | text | ✓ |  |  |
| created_by | uuid | ✗ |  | FK → organization_members.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `forum_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| slug | text | ✗ |  |  |
| description | text | ✓ |  |  |
| icon | text | ✓ |  |  |
| color | text | ✓ | '#000000'::text |  |
| sort_order | int4 | ✓ | 0 |  |
| allowed_roles | _text | ✓ | ARRAY['public'::text] |  |
| is_read_only | bool | ✓ | false |  |
| is_active | bool | ✓ | true |  |
| created_at | timestamptz | ✓ | now() |  |
| course_id | uuid | ✓ |  | FK → courses.id |

### `forum_posts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| thread_id | uuid | ✗ |  | FK → forum_threads.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| author_id | uuid | ✗ |  | FK → users.id |
| parent_id | uuid | ✓ |  | FK → forum_posts.id |
| content | jsonb | ✗ |  |  |
| is_accepted_answer | bool | ✓ | false |  |
| is_deleted | bool | ✓ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `forum_reactions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| item_type | text | ✗ |  | UNIQUE |
| item_id | uuid | ✗ |  | UNIQUE |
| reaction_type | text | ✗ | 'like'::text |  |
| created_at | timestamptz | ✓ | now() |  |

### `forum_threads`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| category_id | uuid | ✗ |  | FK → forum_categories.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| author_id | uuid | ✗ |  | FK → users.id |
| title | text | ✗ |  |  |
| slug | text | ✗ |  | UNIQUE |
| content | jsonb | ✗ |  |  |
| view_count | int4 | ✓ | 0 |  |
| reply_count | int4 | ✓ | 0 |  |
| last_activity_at | timestamptz | ✓ | now() |  |
| is_pinned | bool | ✓ | false |  |
| is_locked | bool | ✓ | false |  |
| is_deleted | bool | ✓ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `founder_event_registrations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| event_id | uuid | ✗ |  | UNIQUE, FK → founder_portal_events.id |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| registered_at | timestamptz | ✓ | now() |  |
| attended | bool | ✓ | false |  |

### `founder_portal_events`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| title | text | ✗ |  |  |
| description | text | ✓ |  |  |
| event_type | text | ✗ | 'webinar'::text |  |
| event_date | timestamptz | ✗ |  |  |
| event_end_date | timestamptz | ✓ |  |  |
| location | text | ✓ |  |  |
| is_virtual | bool | ✓ | true |  |
| max_attendees | int4 | ✓ |  |  |
| created_by | uuid | ✗ |  | FK → users.id |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✓ | false |  |

### `founder_vote_ballots`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| topic_id | uuid | ✗ |  | UNIQUE, FK → founder_vote_topics.id |
| option_id | uuid | ✗ |  | FK → founder_vote_options.id |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| voted_at | timestamptz | ✓ | now() |  |
