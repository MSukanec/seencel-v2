# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 3: general_costs_payments — media_files)

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

### `kanban_labels`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| name | text | ✗ |  | UNIQUE |
| color | text | ✗ | '#6366f1'::text |  |
| description | text | ✓ |  |  |
| position | int4 | ✓ | 0 |  |
| is_default | bool | ✓ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `kanban_lists`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| board_id | uuid | ✓ |  | FK → kanban_boards.id |
| name | text | ✗ |  |  |
| position | int4 | ✗ | 0 |  |
| created_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_at | timestamptz | ✓ | now() |  |
| color | text | ✓ |  |  |
| limit_wip | int4 | ✓ |  |  |
| auto_complete | bool | ✓ | false |  |
| is_collapsed | bool | ✓ | false |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `kanban_mentions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| comment_id | uuid | ✗ |  | FK → kanban_comments.id |
| mentioned_member_id | uuid | ✗ |  | FK → organization_members.id |
| is_read | bool | ✓ | false |  |
| read_at | timestamptz | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `labor_insurances`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| labor_id | uuid | ✗ |  | FK → project_labor.id |
| insurance_type | text | ✗ |  |  |
| policy_number | text | ✓ |  |  |
| provider | text | ✓ |  |  |
| coverage_start | date | ✗ |  |  |
| coverage_end | date | ✗ |  |  |
| reminder_days | _int2 | ✓ | ARRAY[30, 15, 7] |  |
| certificate_attachment_id | uuid | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| coverage_range | daterange | ✓ |  |  |

### `labor_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| labor_id | uuid | ✓ |  | FK → project_labor.id |
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
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |

### `linked_accounts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| auth_id | uuid | ✗ |  | UNIQUE |
| provider_source | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |

### `material_invoice_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| invoice_id | uuid | ✗ |  | FK → material_invoices.id |
| product_id | uuid | ✓ |  | FK → products.id |
| description | text | ✗ |  |  |
| quantity | numeric | ✗ | 1 |  |
| unit_price | numeric | ✗ |  |  |
| total_price | numeric | ✓ |  |  |
| unit_id | uuid | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✗ |  | FK → projects.id |
| material_id | uuid | ✓ |  |  |

### `material_invoices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✗ |  | FK → projects.id |
| provider_id | uuid | ✓ |  | FK → contacts.id |
| invoice_number | text | ✓ |  |  |
| document_type | text | ✗ | 'invoice'::text |  |
| purchase_date | date | ✗ | now() |  |
| subtotal | numeric | ✗ | 0 |  |
| tax_amount | numeric | ✗ | 0 |  |
| total_amount | numeric | ✓ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✓ |  |  |
| status | text | ✗ | 'pending'::text |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| purchase_order_id | uuid | ✓ |  | FK → material_purchase_orders.id |

### `material_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| amount | numeric | ✗ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| exchange_rate | numeric | ✓ |  |  |
| payment_date | date | ✗ | now() |  |
| notes | text | ✓ |  |  |
| reference | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| wallet_id | uuid | ✗ |  | FK → organization_wallets.id |
| status | text | ✗ | 'confirmed'::text |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| purchase_id | uuid | ✓ |  | FK → material_invoices.id |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| material_type_id | uuid | ✓ |  | FK → material_types.id |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |

### `material_purchase_order_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| purchase_order_id | uuid | ✗ |  | FK → material_purchase_orders.id |
| description | text | ✗ |  |  |
| quantity | numeric | ✗ | 1 |  |
| unit_id | uuid | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| material_id | uuid | ✓ |  |  |
| unit_price | numeric | ✓ |  |  |

### `material_purchase_orders`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✗ |  | FK → projects.id |
| requested_by | uuid | ✓ |  | FK → organization_members.id |
| approved_by | uuid | ✓ |  | FK → organization_members.id |
| provider_id | uuid | ✓ |  | FK → contacts.id |
| order_date | date | ✗ | now() |  |
| status | text | ✗ | 'draft'::text |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| order_number | text | ✓ |  |  |
| expected_delivery_date | date | ✓ |  |  |
| currency_id | uuid | ✓ |  | FK → currencies.id |
| subtotal | numeric | ✗ | 0 |  |
| tax_amount | numeric | ✗ | 0 |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `material_types`

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

### `media_file_folders`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| name | text | ✗ |  |  |
| parent_id | uuid | ✓ |  | FK → media_file_folders.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `media_files`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✓ |  | FK → organizations.id |
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
| updated_by | uuid | ✓ |  | FK → organization_members.id |
