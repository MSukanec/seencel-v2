# Database Schema (Auto-generated)
> Generated: 2026-02-19T12:56:55.329Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 3: founder_vote_ballots — kanban_comments)

### `founder_vote_ballots`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| topic_id | uuid | ✗ |  | UNIQUE, FK → founder_vote_topics.id |
| option_id | uuid | ✗ |  | FK → founder_vote_options.id |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
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
| created_by | uuid | ✗ |  | FK → users.id |
| created_at | timestamptz | ✓ | now() |  |
| closed_at | timestamptz | ✓ |  |  |
| is_deleted | bool | ✓ | false |  |

### `general_cost_categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| is_system | bool | ✗ | false |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `general_cost_payment_allocations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| payment_id | uuid | ✗ |  | FK → general_costs_payments.id |
| project_id | uuid | ✗ |  | FK → projects.id |
| percentage | numeric | ✗ |  |  |
| created_at | timestamptz | ✗ | now() |  |

### `general_costs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| category_id | uuid | ✓ |  | FK → general_cost_categories.id |
| is_recurring | bool | ✗ | false |  |
| recurrence_interval | text | ✓ |  |  |
| expected_day | int2 | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `general_costs_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✓ |  |  |
| payment_date | date | ✗ | now() |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| wallet_id | uuid | ✗ |  | FK → organization_wallets.id |
| general_cost_id | uuid | ✓ |  | FK → general_costs.id |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

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
| created_by | uuid | ✓ |  | FK → users.id |
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

### `ia_context_snapshots`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✓ |  | FK → users.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| type | text | ✗ |  |  |
| content | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `ia_import_mapping_patterns`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| entity | text | ✗ |  | UNIQUE |
| source_header | text | ✗ |  | UNIQUE |
| target_field | text | ✗ |  | UNIQUE |
| usage_count | int4 | ✗ | 1 |  |
| last_used_at | timestamptz | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |

### `ia_import_value_patterns`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| entity | text | ✗ |  | UNIQUE |
| comp_field | text | ✗ |  | UNIQUE |
| source_value | text | ✗ |  | UNIQUE |
| target_id | text | ✗ |  |  |
| usage_count | int4 | ✗ | 1 |  |
| last_used_at | timestamptz | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |

### `ia_messages`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✓ |  | FK → users.id |
| role | text | ✗ |  |  |
| content | text | ✗ |  |  |
| context_type | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `ia_usage_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✓ |  | FK → users.id |
| provider | text | ✓ | 'openai'::text |  |
| model | text | ✓ | 'gpt-4o'::text |  |
| prompt_tokens | int4 | ✓ |  |  |
| completion_tokens | int4 | ✓ |  |  |
| total_tokens | int4 | ✓ |  |  |
| cost_usd | numeric | ✓ |  |  |
| context_type | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `ia_user_greetings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✓ |  | UNIQUE, FK → users.id |
| period | text | ✗ |  | UNIQUE |
| greeting | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `ia_user_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| user_id | uuid | ✗ |  | PK, FK → users.id |
| display_name | text | ✓ |  |  |
| tone | text | ✓ | 'amistoso'::text |  |
| language | text | ✓ | 'es'::text |  |
| personality | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |

### `ia_user_usage_limits`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| user_id | uuid | ✗ |  | PK, FK → users.id |
| plan | text | ✗ | 'free'::text |  |
| daily_limit | int4 | ✗ | 3 |  |
| prompts_used_today | int4 | ✗ | 0 |  |
| last_prompt_at | timestamptz | ✓ |  |  |
| last_reset_at | date | ✓ | CURRENT_DATE |  |

### `import_batches`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| entity_type | text | ✗ |  |  |
| record_count | int4 | ✗ | 0 |  |
| status | text | ✗ | 'completed'::text |  |
| created_at | timestamptz | ✗ | timezone('utc'::text, now()) |  |
| member_id | uuid | ✓ |  | FK → organization_members.id |

### `indirect_cost_values`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| indirect_cost_id | uuid | ✗ |  | FK → indirect_costs.id |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| valid_from | date | ✗ | CURRENT_DATE |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `indirect_costs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| project_id | uuid | ✓ |  | FK → projects.id |

### `indirect_costs_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| indirect_cost_id | uuid | ✓ |  | FK → indirect_costs.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✗ |  |  |
| payment_date | date | ✗ | now() |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| wallet_id | uuid | ✓ |  | FK → organization_wallets.id |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| file_url | text | ✓ |  |  |

### `kanban_attachments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| card_id | uuid | ✓ |  | FK → kanban_cards.id |
| file_url | text | ✗ |  |  |
| file_name | text | ✓ |  |  |
| uploaded_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `kanban_board_permissions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| board_id | uuid | ✗ |  | FK → kanban_boards.id |
| member_id | uuid | ✓ |  | FK → organization_members.id |
| role_id | uuid | ✓ |  | FK → roles.id |
| permission_level | text | ✗ | 'view'::text |  |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |

### `kanban_boards`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| created_at | timestamptz | ✓ | now() |  |
| project_id | uuid | ✓ |  | FK → projects.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |
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
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `kanban_card_labels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| card_id | uuid | ✗ |  | PK, FK → kanban_cards.id |
| label_id | uuid | ✗ |  | PK, FK → kanban_labels.id |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |

### `kanban_card_watchers`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| card_id | uuid | ✗ |  | PK, FK → kanban_cards.id |
| member_id | uuid | ✗ |  | PK, FK → organization_members.id |
| created_at | timestamptz | ✓ | now() |  |

### `kanban_cards`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| list_id | uuid | ✓ |  | FK → kanban_lists.id |
| title | text | ✗ |  |  |
| description | text | ✓ |  |  |
| due_date | date | ✓ |  |  |
| position | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| is_completed | bool | ✓ | false |  |
| completed_at | timestamptz | ✓ |  |  |
| assigned_to | uuid | ✓ |  | FK → organization_members.id |
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
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| project_id | uuid | ✓ |  | FK → projects.id |

### `kanban_checklist_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| checklist_id | uuid | ✗ |  | FK → kanban_checklists.id |
| content | text | ✗ |  |  |
| is_completed | bool | ✓ | false |  |
| completed_at | timestamptz | ✓ |  |  |
| completed_by | uuid | ✓ |  | FK → organization_members.id |
| position | int4 | ✓ | 0 |  |
| due_date | date | ✓ |  |  |
| assigned_to | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `kanban_checklists`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| card_id | uuid | ✗ |  | FK → kanban_cards.id |
| title | text | ✗ | 'Checklist'::text |  |
| position | int4 | ✓ | 0 |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `kanban_comments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| card_id | uuid | ✓ |  | FK → kanban_cards.id |
| author_id | uuid | ✓ |  | FK → organization_members.id |
| content | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
