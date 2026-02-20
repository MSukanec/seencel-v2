# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Tables (chunk 5: paypal_preferences — subcontract_payments)

### `paypal_preferences`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | varchar(50) | ✗ |  | PK |
| order_id | varchar(100) | ✓ |  |  |
| user_id | uuid | ✗ |  | FK → users.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| plan_id | uuid | ✓ |  | FK → plans.id |
| plan_slug | text | ✓ |  |  |
| billing_period | text | ✓ |  |  |
| amount | numeric | ✓ |  |  |
| currency | text | ✓ | 'USD'::text |  |
| product_type | text | ✓ |  |  |
| course_id | uuid | ✓ |  | FK → courses.id |
| coupon_id | uuid | ✓ |  | FK → coupons.id |
| coupon_code | text | ✓ |  |  |
| discount_amount | numeric | ✓ | 0 |  |
| is_test | bool | ✓ | false |  |
| is_sandbox | bool | ✓ | false |  |
| status | text | ✓ | 'pending'::text |  |
| created_at | timestamptz | ✓ | now() |  |
| captured_at | timestamptz | ✓ |  |  |
| expires_at | timestamptz | ✓ |  |  |
| seats_quantity | int4 | ✓ |  |  |

### `pdf`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| created_at | timestamptz | ✗ | now() |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| updated_at | timestamptz | ✓ |  |  |
| name | text | ✓ |  |  |
| blocks | jsonb | ✓ |  |  |
| config | jsonb | ✓ |  |  |

### `pdf_templates`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ | 'Plantilla por defecto'::text |  |
| logo_width | int4 | ✓ | 80 |  |
| logo_height | int4 | ✓ | 80 |  |
| company_name_size | int4 | ✓ | 24 |  |
| company_name_color | text | ✓ | '''#000000''::text'::text |  |
| primary_color | text | ✓ | '''#000000''::text'::text |  |
| secondary_color | text | ✓ | '#e5e7eb'::text |  |
| text_color | text | ✓ | '#1f2937'::text |  |
| font_family | text | ✓ | 'Arial'::text |  |
| title_size | int4 | ✓ | 18 |  |
| subtitle_size | int4 | ✓ | 14 |  |
| body_size | int4 | ✓ | 12 |  |
| margin_top | int4 | ✓ | 10 |  |
| margin_bottom | int4 | ✓ | 10 |  |
| margin_left | int4 | ✓ | 10 |  |
| margin_right | int4 | ✓ | 10 |  |
| footer_text | text | ✓ | 'Documento generado por Seencel. SEEN... |  |
| footer_show_page_numbers | bool | ✓ | true |  |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| company_info_size | int4 | ✓ | 10 |  |
| show_footer_info | bool | ✓ | true |  |
| page_size | varchar(10) | ✓ | 'A4'::character varying |  |
| page_orientation | text | ✓ | 'vertical'::text |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| pdf_logo_path | text | ✓ |  |  |
| show_company_name | bool | ✓ | true |  |
| show_company_address | bool | ✓ | true |  |

### `permissions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| key | text | ✗ |  | UNIQUE |
| description | text | ✗ |  |  |
| category | text | ✗ |  |  |
| is_system | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |

### `personnel_attendees`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| site_log_id | uuid | ✓ |  | FK → site_logs.id |
| attendance_type | text | ✓ | 'full'::text |  |
| hours_worked | numeric | ✓ |  |  |
| description | text | ✓ |  |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✓ | now() |  |
| updated_at | timestamptz | ✓ | now() |  |
| project_id | uuid | ✓ |  | FK → projects.id |
| personnel_id | uuid | ✓ |  | FK → project_labor.id |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| work_date | date | ✗ | CURRENT_DATE |  |
| status | text | ✓ |  |  |

### `personnel_rates`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| personnel_id | uuid | ✓ |  | FK → project_labor.id |
| labor_type_id | uuid | ✓ |  |  |
| rate_hour | numeric | ✓ |  |  |
| rate_day | numeric | ✓ |  |  |
| rate_month | numeric | ✓ |  |  |
| currency_id | uuid | ✗ |  | FK → currencies.id |
| valid_from | date | ✗ |  |  |
| valid_to | date | ✓ |  |  |
| is_active | bool | ✗ | true |  |
| created_by | uuid | ✓ |  | FK → organization_members.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| pay_type | text | ✗ | 'hour'::text |  |

### `pin_board_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| board_id | uuid | ✗ |  | UNIQUE, FK → pin_boards.id |
| pin_id | uuid | ✗ |  | UNIQUE, FK → pins.id |
| position | int4 | ✓ |  |  |
| created_at | timestamptz | ✗ | now() |  |

### `pin_boards`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| created_by | uuid | ✗ |  | FK → organization_members.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `pins`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| title | text | ✓ |  |  |
| source_url | text | ✓ |  |  |
| image_url | text | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |
| project_id | uuid | ✓ |  | FK → projects.id |
| media_file_id | uuid | ✓ |  | FK → media_files.id |

### `plans`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| name | text | ✗ |  | UNIQUE |
| features | jsonb | ✓ |  |  |
| is_active | bool | ✓ | true |  |
| billing_type | text | ✓ | 'per_user'::text |  |
| slug | text | ✓ |  |  |
| monthly_amount | numeric | ✓ |  |  |
| annual_amount | numeric | ✓ |  |  |
| paypal_product_id | text | ✓ |  |  |
| paypal_plan_monthly_id | text | ✓ |  |  |
| paypal_plan_annual_id | text | ✓ |  |  |
| mp_plan_monthly_id | text | ✓ |  |  |
| mp_plan_annual_id | text | ✓ |  |  |
| status | text | ✗ | 'available'::text |  |
| paypal_product_id_sandbox | text | ✓ |  |  |
| paypal_plan_monthly_id_sandbox | text | ✓ |  |  |
| paypal_plan_annual_id_sandbox | text | ✓ |  |  |
| annual_discount_percent | numeric | ✓ | 0 |  |

### `product_prices`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| provider_product_id | uuid | ✗ |  | FK → provider_products.id |
| price | numeric | ✓ |  |  |
| currency_id | uuid | ✓ |  | FK → currencies.id |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |

### `products`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| material_id | uuid | ✓ |  |  |
| brand_id | uuid | ✓ |  | FK → brands.id |
| name | text | ✗ |  |  |
| description | text | ✓ |  |  |
| image_url | text | ✓ |  |  |
| specs | jsonb | ✓ |  |  |
| created_at | timestamptz | ✓ | now() |  |
| unit_id | uuid | ✓ |  |  |
| default_price | numeric | ✓ |  |  |
| default_provider | text | ✓ |  |  |
| updated_at | timestamptz | ✓ | now() |  |
| url | text | ✓ |  |  |
| is_system | bool | ✓ | true |  |
| organization_id | uuid | ✓ |  | FK → organizations.id |

### `project_access`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | PK |
| project_id | uuid | ✗ |  | UNIQUE, FK → projects.id |
| organization_id | uuid | ✗ |  | FK → organizations.id |
| user_id | uuid | ✗ |  | UNIQUE, FK → users.id |
| access_type | text | ✗ |  |  |
| access_level | text | ✗ | 'viewer'::text |  |
| granted_by | uuid | ✓ |  | FK → organization_members.id |
| is_active | bool | ✗ | true |  |
| created_at | timestamptz | ✗ | now() |  |
| updated_at | timestamptz | ✗ | now() |  |
| is_deleted | bool | ✗ | false |  |
| deleted_at | timestamptz | ✓ |  |  |
| client_id | uuid | ✓ |  | FK → project_clients.id |

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
| labor_type_id | uuid | ✓ |  |  |
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
