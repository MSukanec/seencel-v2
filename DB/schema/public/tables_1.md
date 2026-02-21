# Database Schema (Auto-generated)
> Generated: 2026-02-21T14:12:15.483Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 1: app_settings — organization_task_prices)

### `app_settings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| key | text | ✗ |  | PK |
| value | text | ✓ |  |  |
| description | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |

### `brands`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `capital_adjustments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| partner_id | uuid | ✓ |  |  |
| currency_id | uuid | ✗ |  |  |
| exchange_rate | numeric | ✗ | 1 |  |
| amount | numeric | ✗ |  |  |
| adjustment_date | date | ✗ | now() |  |
| reason | text | ✓ |  |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `client_portal_branding`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | UNIQUE |
| organization_id | uuid | ✗ |  |  |
| portal_name | text | ✓ |  |  |
| welcome_message | text | ✓ |  |  |
| primary_color | text | ✓ | '#83cc16'::text |  |
| background_color | text | ✓ | '#09090b'::text |  |
| show_footer | bool | ✓ | true |  |
| footer_text | text | ✓ |  |  |
| show_powered_by | bool | ✓ | true |  |
| hero_image_url | text | ✓ |  |  |
| show_hero | bool | ✓ | true |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `client_portal_settings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| project_id | uuid | ✗ |  | PK |
| organization_id | uuid | ✗ |  |  |
| show_dashboard | bool | ✗ | true |  |
| show_installments | bool | ✗ | false |  |
| show_payments | bool | ✗ | false |  |
| show_logs | bool | ✗ | false |  |
| show_amounts | bool | ✗ | true |  |
| show_progress | bool | ✗ | true |  |
| allow_comments | bool | ✗ | false |  |
| updated_at | timestamptz | ✓ | now() |  |
| updated_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| show_quotes | bool | ✓ | false |  |

### `countries`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| alpha_3 | text | ✗ |  |  |
| country_code | text | ✓ |  |  |
| name | text | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| alpha_2 | text | ✓ |  |  |

### `external_service_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| recipe_external_service_id | uuid | ✗ |  |  |
| organization_id | uuid | ✗ |  |  |
| currency_id | uuid | ✗ |  |  |
| unit_price | numeric | ✗ |  |  |
| valid_from | date | ✗ | CURRENT_DATE |  |
| valid_to | date | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

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

### `financial_operation_movements`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| financial_operation_id | uuid | ✗ |  | FK → financial_operations.id |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| wallet_id | uuid | ✗ |  |  |
| currency_id | uuid | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| direction | text | ✗ |  |  |
| exchange_rate | numeric | ✓ |  |  |
| created_by | uuid | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `financial_operations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| type | text | ✗ |  |  |
| operation_date | date | ✗ | CURRENT_DATE |  |
| description | text | ✓ |  |  |
| created_by | uuid | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_by | uuid | ✓ |  |  |
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
| course_id | uuid | ✓ |  |  |

### `forum_posts`

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

### `forum_reactions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE |
| item_type | text | ✗ |  | UNIQUE |
| item_id | uuid | ✗ |  | UNIQUE |
| reaction_type | text | ✗ | 'like'::text |  |
| created_at | timestamptz | ✓ | now() |  |

### `forum_threads`

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

### `founder_event_registrations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| event_id | uuid | ✗ |  | UNIQUE, FK → founder_portal_events.id |
| organization_id | uuid | ✗ |  | UNIQUE |
| user_id | uuid | ✗ |  | UNIQUE |
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
| created_by | uuid | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✓ | false |  |

### `founder_vote_ballots`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| topic_id | uuid | ✗ |  | UNIQUE, FK → founder_vote_topics.id |
| option_id | uuid | ✗ |  | FK → founder_vote_options.id |
| organization_id | uuid | ✗ |  | UNIQUE |
| user_id | uuid | ✗ |  | UNIQUE |
| voted_at | timestamptz | ✓ | now() |  |

### `founder_vote_options`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| topic_id | uuid | ✗ |  | FK → founder_vote_topics.id |
| option_text | text | ✗ |  |  |
| option_order | int4 | ✓ | 0 |  |

### `founder_vote_topics`

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

### `general_cost_payment_allocations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| payment_id | uuid | ✗ |  |  |
| project_id | uuid | ✗ |  |  |
| percentage | numeric | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |

### `global_announcements`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| title | text | ✗ |  |  |
| message | text | ✗ |  |  |
| type | text | ✗ |  |  |
| link_text | text | ✓ |  |  |
| link_url | text | ✓ |  |  |
| audience | text | ✓ | 'all'::text |  |
| is_active | bool | ✓ | true |  |
| starts_at | timestamptz | ✓ | now() |  |
| ends_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  |  |
| primary_button_text | text | ✓ |  |  |
| primary_button_url | text | ✓ |  |  |
| secondary_button_text | text | ✓ |  |  |
| secondary_button_url | text | ✓ |  |  |

### `hero_sections`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| section_type | text | ✗ | 'learning_dashboard'::text |  |
| order_index | int4 | ✗ | 0 |  |
| title | text | ✓ |  |  |
| description | text | ✓ |  |  |
| primary_button_text | text | ✓ |  |  |
| primary_button_action | text | ✓ |  |  |
| primary_button_action_type | text | ✓ | 'url'::text |  |
| secondary_button_text | text | ✓ |  |  |
| secondary_button_action | text | ✓ |  |  |
| secondary_button_action_type | text | ✓ | 'url'::text |  |
| is_active | bool | ✓ | true |  |
| created_at | timestamp | ✓ | now() |  |
| updated_at | timestamp | ✓ | now() |  |
| media_url | text | ✓ |  |  |
| media_type | text | ✓ | 'image'::text |  |
| is_deleted | bool | ✗ | false |  |

### `import_batches`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| entity_type | text | ✗ |  |  |
| record_count | int4 | ✗ | 0 |  |
| status | text | ✗ | 'completed'::text |  |
| created_at | timestamptz | ✗ | timezone('utc'::text, now()) |  |
| member_id | uuid | ✓ |  |  |

### `indirect_cost_values`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| indirect_cost_id | uuid | ✗ |  |  |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  |  |
| valid_from | date | ✗ | CURRENT_DATE |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `material_types`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  |  |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| is_system | bool | ✗ | false |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `media_file_folders`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  |  |
| project_id | uuid | ✓ |  |  |
| name | text | ✗ |  |  |
| parent_id | uuid | ✓ |  | FK → media_file_folders.id |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `media_files`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| bucket | text | ✗ |  |  |
| file_path | text | ✗ |  |  |
| file_name | text | ✓ |  |  |
| file_type | text | ✗ |  |  |
| file_size | int8 | ✓ |  |  |
| is_public | bool | ✗ | false |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  |  |

### `media_links`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| media_file_id | uuid | ✗ |  | FK → media_files.id |
| organization_id | uuid | ✓ |  |  |
| project_id | uuid | ✓ |  |  |
| site_log_id | uuid | ✓ |  |  |
| contact_id | uuid | ✓ |  |  |
| general_cost_payment_id | uuid | ✓ |  |  |
| created_by | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| visibility | text | ✓ |  |  |
| description | text | ✓ |  |  |
| category | text | ✓ |  |  |
| is_cover | bool | ✓ | false |  |
| position | int4 | ✓ |  |  |
| metadata | jsonb | ✓ | '{}'::jsonb |  |
| client_payment_id | uuid | ✓ |  |  |
| course_id | uuid | ✓ |  |  |
| is_public | bool | ✓ | false |  |
| material_payment_id | uuid | ✓ |  |  |
| material_purchase_id | uuid | ✓ |  |  |
| testimonial_id | uuid | ✓ |  | FK → testimonials.id |
| labor_payment_id | uuid | ✓ |  |  |
| forum_thread_id | uuid | ✓ |  | FK → forum_threads.id |
| partner_contribution_id | uuid | ✓ |  |  |
| partner_withdrawal_id | uuid | ✓ |  |  |
| pin_id | uuid | ✓ |  | FK → pins.id |
| updated_by | uuid | ✓ |  |  |
| subcontract_payment_id | uuid | ✓ |  |  |
| folder_id | uuid | ✓ |  | FK → media_file_folders.id |

### `organization_task_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE |
| task_id | uuid | ✗ |  | UNIQUE |
| labor_unit_cost | numeric | ✓ |  |  |
| material_unit_cost | numeric | ✓ |  |  |
| total_unit_cost | numeric | ✓ |  |  |
| currency_code | text | ✓ |  |  |
| note | text | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |
| supply_unit_cost | numeric | ✓ |  |  |
