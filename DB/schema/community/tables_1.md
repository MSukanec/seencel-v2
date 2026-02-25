# Database Schema (Auto-generated)
> Generated: 2026-02-25T18:05:07.898Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [COMMUNITY] Tables (chunk 1: community.forum_categories — community.founder_vote_topics)

### `community.forum_categories`

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
| course_id | uuid | ✓ |  |  |

### `community.forum_posts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| thread_id | uuid | ✗ |  | FK → forum_threads.id |
| organization_id | uuid | ✗ |  |  |
| author_id | uuid | ✗ |  |  |
| parent_id | uuid | ✓ |  | FK → forum_posts.id |
| content | jsonb | ✗ |  |  |
| is_accepted_answer | bool | ✓ | false |  |
| is_deleted | bool | ✓ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `community.forum_reactions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE |
| item_type | text | ✗ |  | UNIQUE |
| item_id | uuid | ✗ |  | UNIQUE |
| reaction_type | text | ✗ | 'like'::text |  |
| created_at | timestamptz | ✓ | now() |  |

### `community.forum_threads`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| category_id | uuid | ✗ |  | FK → forum_categories.id |
| organization_id | uuid | ✗ |  |  |
| author_id | uuid | ✗ |  |  |
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

### `community.founder_event_registrations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| event_id | uuid | ✗ |  | UNIQUE, FK → founder_portal_events.id |
| organization_id | uuid | ✗ |  | UNIQUE |
| user_id | uuid | ✗ |  | UNIQUE |
| registered_at | timestamptz | ✓ | now() |  |
| attended | bool | ✓ | false |  |

### `community.founder_portal_events`

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
| created_by | uuid | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✓ | false |  |

### `community.founder_vote_ballots`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| topic_id | uuid | ✗ |  | UNIQUE, FK → founder_vote_topics.id |
| option_id | uuid | ✗ |  | FK → founder_vote_options.id |
| organization_id | uuid | ✗ |  | UNIQUE |
| user_id | uuid | ✗ |  | UNIQUE |
| voted_at | timestamptz | ✓ | now() |  |

### `community.founder_vote_options`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| topic_id | uuid | ✗ |  | FK → founder_vote_topics.id |
| option_text | text | ✗ |  |  |
| option_order | int4 | ✓ | 0 |  |

### `community.founder_vote_topics`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| title | text | ✗ |  |  |
| description | text | ✓ |  |  |
| status | text | ✗ | 'active'::text |  |
| voting_deadline | timestamptz | ✓ |  |  |
| allow_multiple_votes | bool | ✓ | false |  |
| created_by | uuid | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| closed_at | timestamptz | ✓ |  |  |
| is_deleted | bool | ✓ | false |  |
