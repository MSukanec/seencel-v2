# Database Schema (Auto-generated)
> Generated: 2026-02-19T19:04:24.438Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 6: project_clients — task_element_parameters)

### `project_clients`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| contact_id | uuid | ✓ |  | FK → contacts.id |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| is_primary | bool | ✗ | true |  |
| notes | text | ✓ |  |  |
| status | text | ✗ | 'active'::text |  |
| client_role_id | uuid | ✓ |  | FK → client_roles.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `project_data`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| project_id | uuid | ✗ |  | PK, FK → projects.id |
| surface_total | numeric | ✓ |  |  |
| surface_covered | numeric | ✓ |  |  |
| surface_semi | numeric | ✓ |  |  |
| lat | numeric | ✓ |  |  |
| lng | numeric | ✓ |  |  |
| zip_code | text | ✓ |  |  |
| description | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| country | text | ✓ |  |  |
| state | text | ✓ |  |  |
| address | text | ✓ |  |  |
| city | text | ✓ |  |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| accessibility_notes | text | ✓ |  |  |
| address_full | text | ✓ |  |  |
| location_type | text | ✓ |  |  |
| place_id | text | ✓ |  |  |
| timezone | text | ✓ |  |  |
| is_public | bool | ✗ | false |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |

### `project_labor`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| contact_id | uuid | ✗ |  | FK → contacts.id |
| notes | text | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| labor_type_id | uuid | ✓ |  | FK → labor_categories.id |
| start_date | date | ✓ |  |  |
| end_date | date | ✓ |  |  |
| status | text | ✗ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `project_modalities`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| is_system | bool | ✗ | true |  |
| created_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `project_settings`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | UNIQUE, FK → projects.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| work_days | _int4 | ✗ | '{1,2,3,4,5}'::integer[] |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| use_palette_theme | bool | ✗ | false |  |
| use_custom_color | bool | ✗ | false |  |
| custom_color_h | int4 | ✓ |  |  |
| custom_color_hex | text | ✓ |  |  |

### `project_types`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| is_system | bool | ✗ | false |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `projects`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| created_at | timestamptz | ✗ | now() |  |
| name | text | ✗ |  |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| is_active | bool | ✗ | true |  |
| id | uuid | ✗ | gen_random_uuid() | PK, UNIQUE |
| status | project_status | ✗ | 'active'::project_status |  |
| updated_at | timestamptz | ✗ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| color | text | ✓ |  |  |
| code | text | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| last_active_at | timestamptz | ✓ |  |  |
| is_over_limit | bool | ✓ | false |  |
| image_url | text | ✓ |  |  |
| project_type_id | uuid | ✓ |  | FK → project_types.id |
| project_modality_id | uuid | ✓ |  | FK → project_modalities.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| image_palette | jsonb | ✓ |  |  |

### `provider_products`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | UNIQUE, FK → organizations.id |
| product_id | uuid | ✗ |  | UNIQUE, FK → products.id |
| provider_code | text | ✓ |  |  |
| is_active | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `push_subscriptions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| endpoint | text | ✗ |  | UNIQUE |
| p256dh | text | ✗ |  |  |
| auth | text | ✗ |  |  |
| user_agent | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |

### `role_permissions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| role_id | uuid | ✗ |  | UNIQUE, FK → roles.id |
| permission_id | uuid | ✗ |  | UNIQUE, FK → permissions.id |
| created_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |

### `roles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| type | text | ✓ |  |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| is_system | bool | ✗ | false |  |

### `signatures`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| document_type | text | ✗ |  |  |
| document_id | uuid | ✗ |  |  |
| signer_name | text | ✗ |  |  |
| signer_email | text | ✓ |  |  |
| signer_user_id | uuid | ✓ |  |  |
| signature_url | text | ✗ |  |  |
| signature_method | text | ✗ |  |  |
| ip_address | inet | ✓ |  |  |
| user_agent | text | ✓ |  |  |
| signed_at | timestamptz | ✗ | now() |  |
| created_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✓ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `site_log_types`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| is_system | bool | ✗ | false |  |
| created_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| updated_at | timestamptz | ✓ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |

### `site_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| log_date | date | ✗ |  |  |
| comments | text | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |
| is_public | bool | ✓ | false |  |
| status | site_log_status | ✓ | 'approved'::site_log_status |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_favorite | bool | ✓ | false |  |
| weather | weather_enum | ✓ | 'none'::weather_enum |  |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| entry_type_id | uuid | ✓ |  | FK → site_log_types.id |
| severity | site_log_severity | ✓ | 'low'::site_log_severity |  |
| ai_summary | text | ✓ |  |  |
| ai_tags | _text | ✓ |  |  |
| ai_analyzed | bool | ✗ | false |  |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `subcontract_bid_tasks`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| subcontract_bid_id | uuid | ✓ |  | FK → subcontract_bids.id |
| subcontract_task_id | uuid | ✓ |  | FK → subcontract_tasks.id |
| quantity | numeric | ✓ |  |  |
| unit | text | ✓ |  |  |
| unit_price | numeric | ✓ |  |  |
| amount | numeric | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `subcontract_bids`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| contact_id | uuid | ✗ |  | FK → contacts.id |
| amount | numeric | ✓ |  |  |
| currency_id | uuid | ✓ |  | FK → currencies.id |
| exchange_rate | numeric | ✓ |  |  |
| notes | text | ✓ |  |  |
| submitted_at | date | ✓ |  |  |
| status | text | ✓ | 'pending'::text |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| subcontract_id | uuid | ✓ |  | FK → subcontracts.id |

### `subcontract_payments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | FK → projects.id |
| subcontract_id | uuid | ✓ |  | FK → subcontracts.id |
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
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✓ | false |  |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |

### `subcontract_tasks`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| subcontract_id | uuid | ✗ |  | FK → subcontracts.id |
| task_id | uuid | ✗ |  |  |
| unit | text | ✓ |  |  |
| amount | numeric | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |

### `subcontracts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| code | text | ✓ |  |  |
| title | text | ✗ |  |  |
| amount_total | numeric | ✓ |  |  |
| notes | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| status | text | ✓ | 'draft'::text |  |
| exchange_rate | numeric | ✓ |  |  |
| date | date | ✓ |  |  |
| winner_bid_id | uuid | ✓ |  | FK → subcontract_bids.id |
| contact_id | uuid | ✓ |  | FK → contacts.id |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| is_deleted | bool | ✓ | false |  |
| currency_id | uuid | ✓ |  | FK → currencies.id |
| adjustment_index_type_id | uuid | ✓ |  | FK → economic_index_types.id |
| base_period_year | int4 | ✓ |  |  |
| base_period_month | int4 | ✓ |  |  |
| base_index_value | numeric | ✓ |  |  |

### `subscription_notifications_log`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| subscription_id | uuid | ✗ |  | UNIQUE, FK → organization_subscriptions.id |
| notification_type | text | ✗ |  | UNIQUE |
| sent_at | timestamptz | ✓ | now() |  |

### `support_messages`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| user_id | uuid | ✗ |  | FK → users.id |
| message | text | ✗ |  |  |
| sender | text | ✗ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| read_by_admin | bool | ✗ | false |  |
| read_by_user | bool | ✗ | false |  |

### `system_error_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| domain | text | ✗ |  |  |
| entity | text | ✗ |  |  |
| function_name | text | ✗ |  |  |
| error_message | text | ✗ |  |  |
| context | jsonb | ✓ |  |  |
| severity | text | ✗ | 'error'::text |  |
| created_at | timestamptz | ✗ | now() |  |

### `system_job_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| subscription_id | uuid | ✓ |  |  |
| job_type | text | ✗ |  |  |
| details | jsonb | ✓ |  |  |
| status | text | ✗ |  |  |
| error_message | text | ✓ |  |  |
| processed_at | timestamptz | ✓ | now() |  |

### `task_actions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| name | text | ✓ |  | UNIQUE |
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| description | text | ✓ |  |  |
| short_code | varchar(10) | ✓ |  |  |

### `task_construction_systems`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| name | text | ✗ |  | UNIQUE |
| slug | text | ✗ |  | UNIQUE |
| description | text | ✓ |  |  |
| code | varchar(10) | ✓ |  |  |
| icon | text | ✓ |  |  |
| order | int4 | ✓ |  |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |

### `task_division_actions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| division_id | uuid | ✗ |  | PK, FK → task_divisions.id |
| action_id | uuid | ✗ |  | PK, FK → task_actions.id |
| created_at | timestamptz | ✓ | now() |  |

### `task_division_elements`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| division_id | uuid | ✗ |  | PK, FK → task_divisions.id |
| element_id | uuid | ✗ |  | PK, FK → task_elements.id |
| created_at | timestamptz | ✓ | now() |  |

### `task_divisions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| order | int4 | ✓ |  |  |
| code | text | ✓ |  |  |
| parent_id | uuid | ✓ |  | FK → task_divisions.id |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| is_system | bool | ✗ | true |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| updated_by | uuid | ✓ |  | FK → organization_members.id |
| import_batch_id | uuid | ✓ |  | FK → import_batches.id |

### `task_element_actions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| action_id | uuid | ✗ |  | PK, FK → task_actions.id |
| element_id | uuid | ✗ |  | PK, FK → task_elements.id |
| created_at | timestamptz | ✓ | now() |  |

### `task_element_parameters`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| element_id | uuid | ✗ |  | PK, FK → task_elements.id |
| parameter_id | uuid | ✗ |  | PK, FK → task_parameters.id |
| order | int4 | ✓ | 0 |  |
| is_required | bool | ✓ | true |  |
| created_at | timestamptz | ✓ | now() |  |
