# Database Schema (Auto-generated)
> Generated: 2026-02-22T22:05:48.801Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Schema: `public`

### Tables (10)

- **`app_settings`** (4 cols)
- **`countries`** (7 cols)
- **`feature_flag_categories`** (5 cols | FK: parent_id → feature_flag_categories)
- **`feature_flags`** (12 cols | FK: parent_id → feature_flags, category_id → feature_flag_categories)
- **`global_announcements`** (16 cols)
- **`hero_sections`** (17 cols)
- **`import_batches`** (7 cols)
- **`media_file_folders`** (11 cols | FK: parent_id → media_file_folders)
- **`media_files`** (14 cols)
- **`media_links`** (29 cols | FK: folder_id → media_file_folders, media_file_id → media_files)

### Functions (24)

- `can_mutate_org(p_organization_id uuid, p_permission_key text)` → boolean 🔐 *(public/functions_1.md)*
- `can_mutate_project(p_project_id uuid, p_permission_key text)` → boolean 🔐 *(public/functions_1.md)*
- `can_view_client_data(p_project_id uuid, p_client_id uuid)` → boolean 🔐 *(public/functions_1.md)*
- `can_view_org(p_organization_id uuid, p_permission_key text)` → boolean 🔐 *(public/functions_1.md)*
- `can_view_org(p_organization_id uuid)` → boolean 🔐 *(public/functions_1.md)*
- `can_view_project(p_project_id uuid)` → boolean 🔐 *(public/functions_1.md)*
- `cleanup_media_file_storage()` → trigger 🔐 *(public/functions_1.md)*
- `current_user_id()` → uuid 🔐 *(public/functions_1.md)*
- `external_has_scope(p_organization_id uuid, p_permission_key text)` → boolean 🔐 *(public/functions_1.md)*
- `get_user()` → json 🔐 *(public/functions_1.md)*
- `handle_import_batch_member_id()` → trigger 🔐 *(public/functions_1.md)*
- `handle_updated_by()` → trigger 🔐 *(public/functions_1.md)*
- `has_permission(p_organization_id uuid, p_permission_key text)` → boolean 🔐 *(public/functions_1.md)*
- `is_admin()` → boolean 🔐 *(public/functions_1.md)*
- `is_demo_org(p_organization_id uuid)` → boolean 🔐 *(public/functions_1.md)*
- `is_external_actor(p_organization_id uuid)` → boolean 🔐 *(public/functions_1.md)*
- `is_org_member(p_organization_id uuid)` → boolean 🔐 *(public/functions_1.md)*
- `is_self(p_user_id uuid)` → boolean 🔐 *(public/functions_1.md)*
- `is_system_row(p_is_system boolean)` → boolean 🔐 *(public/functions_1.md)*
- `set_timestamp()` → trigger 🔐 *(public/functions_1.md)*
- `unaccent(regdictionary, text)` → text *(public/functions_2.md)*
- `unaccent(text)` → text *(public/functions_2.md)*
- `unaccent_init(internal)` → internal *(public/functions_2.md)*
- `unaccent_lexize(internal, internal, internal, internal)` → internal *(public/functions_2.md)*

---

## Schema: `iam`

### Tables (25)

- **`iam.dashboard_layouts`** (7 cols | FK: user_id → users, organization_id → organizations)
- **`iam.debug_signup_log`** (4 cols)
- **`iam.external_actor_scopes`** (4 cols | FK: external_actor_id → organization_external_actors)
- **`iam.feedback`** (5 cols | FK: user_id → users)
- **`iam.linked_accounts`** (5 cols | FK: user_id → users)
- **`iam.organization_clients`** (10 cols | FK: updated_by → organization_members, user_id → users, created_by → organization_members, organization_id → organizations)
- **`iam.organization_data`** (22 cols | FK: updated_by → organization_members, created_by → organization_members, organization_id → organizations)
- **`iam.organization_external_actors`** (11 cols | FK: created_by → organization_members, organization_id → organizations, updated_by → organization_members, user_id → users)
- **`iam.organization_invitations`** (16 cols | FK: organization_id → organizations, invited_by → organization_members, user_id → users, role_id → roles)
- **`iam.organization_members`** (14 cols | FK: user_id → users, created_by → organization_members, invited_by → organization_members, organization_id → organizations, updated_by → organization_members, role_id → roles)
- **`iam.organization_preferences`** (13 cols | FK: organization_id → organizations)
- **`iam.organization_recipe_preferences`** (5 cols | FK: organization_id → organizations)
- **`iam.organizations`** (16 cols | FK: created_by → users, owner_id → users, updated_by → organization_members)
- **`iam.permissions`** (6 cols)
- **`iam.project_access`** (13 cols | FK: organization_id → organizations, user_id → users, granted_by → organization_members)
- **`iam.role_permissions`** (5 cols | FK: permission_id → permissions, organization_id → organizations, role_id → roles)
- **`iam.roles`** (6 cols | FK: organization_id → organizations)
- **`iam.support_messages`** (7 cols | FK: user_id → users)
- **`iam.user_acquisition`** (9 cols | FK: user_id → users)
- **`iam.user_data`** (9 cols | FK: user_id → users)
- **`iam.user_organization_preferences`** (6 cols | FK: user_id → users, organization_id → organizations)
- **`iam.user_preferences`** (12 cols | FK: user_id → users, last_organization_id → organizations)
- **`iam.user_presence`** (10 cols | FK: user_id → users)
- **`iam.user_view_history`** (9 cols | FK: user_id → users, organization_id → organizations)
- **`iam.users`** (11 cols | FK: role_id → roles)

### Functions (41)

- `iam.accept_client_invitation(p_token text, p_user_id uuid)` → jsonb 🔐 *(iam/functions_1.md)*
- `iam.accept_external_invitation(p_token text, p_user_id uuid)` → jsonb 🔐 *(iam/functions_1.md)*
- `iam.accept_organization_invitation(p_token text, p_user_id uuid)` → jsonb 🔐 *(iam/functions_1.md)*
- `iam.analytics_track_navigation(p_org_id uuid, p_view_name text, p_session_id uuid)` → void 🔐 *(iam/functions_1.md)*
- `iam.assign_default_permissions_to_org_roles(p_organization_id uuid)` → void 🔐 *(iam/functions_1.md)*
- `iam.can_mutate_org(p_organization_id uuid, p_permission_key text)` → boolean 🔐 *(iam/functions_1.md)*
- `iam.can_mutate_project(p_project_id uuid, p_permission_key text)` → boolean 🔐 *(iam/functions_1.md)*
- `iam.can_view_client_data(p_project_id uuid, p_client_id uuid)` → boolean 🔐 *(iam/functions_1.md)*
- `iam.can_view_org(p_organization_id uuid, p_permission_key text)` → boolean 🔐 *(iam/functions_1.md)*
- `iam.can_view_org(p_organization_id uuid)` → boolean 🔐 *(iam/functions_1.md)*
- `iam.can_view_project(p_project_id uuid)` → boolean 🔐 *(iam/functions_1.md)*
- `iam.current_user_id()` → uuid 🔐 *(iam/functions_1.md)*
- `iam.dismiss_home_banner()` → boolean 🔐 *(iam/functions_1.md)*
- `iam.ensure_contact_for_user(p_organization_id uuid, p_user_id uuid)` → uuid 🔐 *(iam/functions_1.md)*
- `iam.external_has_scope(p_organization_id uuid, p_permission_key text)` → boolean 🔐 *(iam/functions_1.md)*
- `iam.fill_user_data_user_id_from_auth()` → trigger 🔐 *(iam/functions_1.md)*
- `iam.forbid_user_id_change()` → trigger 🔐 *(iam/functions_1.md)*
- `iam.get_invitation_by_token(p_token text)` → jsonb 🔐 *(iam/functions_1.md)*
- `iam.get_user()` → json 🔐 *(iam/functions_1.md)*
- `iam.handle_new_external_actor_contact()` → trigger 🔐 *(iam/functions_1.md)*
- `iam.handle_new_org_member_contact()` → trigger 🔐 *(iam/functions_2.md)*
- `iam.handle_new_organization(p_user_id uuid, p_organization_name text, p_business_mode text DEFAULT 'professional'::text)` → uuid 🔐 *(iam/functions_2.md)*
- `iam.handle_new_organization(p_user_id uuid, p_organization_name text, p_business_mode text DEFAULT 'professional'::text, p_default_currency_id uuid DEFAULT NULL::uuid)` → uuid 🔐 *(iam/functions_2.md)*
- `iam.handle_new_user()` → trigger 🔐 *(iam/functions_2.md)*
- `iam.handle_registered_invitation()` → trigger 🔐 *(iam/functions_2.md)*
- `iam.handle_updated_by_organizations()` → trigger 🔐 *(iam/functions_2.md)*
- `iam.has_permission(p_organization_id uuid, p_permission_key text)` → boolean 🔐 *(iam/functions_2.md)*
- `iam.heartbeat(p_org_id uuid DEFAULT NULL::uuid, p_status text DEFAULT 'online'::text, p_session_id uuid DEFAULT NULL::uuid)` → void 🔐 *(iam/functions_2.md)*
- `iam.is_admin()` → boolean 🔐 *(iam/functions_2.md)*
- `iam.is_demo_org(p_organization_id uuid)` → boolean 🔐 *(iam/functions_2.md)*
- `iam.is_external_actor(p_organization_id uuid)` → boolean 🔐 *(iam/functions_2.md)*
- `iam.is_org_member(p_organization_id uuid)` → boolean 🔐 *(iam/functions_2.md)*
- `iam.is_organization_client(p_organization_id uuid)` → boolean 🔐 *(iam/functions_2.md)*
- `iam.is_self(p_user_id uuid)` → boolean 🔐 *(iam/functions_2.md)*
- `iam.is_system_row(p_is_system boolean)` → boolean 🔐 *(iam/functions_2.md)*
- `iam.merge_contacts(p_source_contact_id uuid, p_target_contact_id uuid, p_organization_id uuid)` → jsonb 🔐 *(iam/functions_2.md)*
- `iam.step_organization_increment_seats(p_organization_id uuid, p_seats_to_add integer)` → void 🔐 *(iam/functions_2.md)*
- `iam.sync_contact_on_user_update()` → trigger 🔐 *(iam/functions_2.md)*
- `iam.sync_role_permission_org_id()` → trigger *(iam/functions_2.md)*
- `iam.tick_home_checklist(p_key text, p_value boolean)` → boolean 🔐 *(iam/functions_2.md)*
- `iam.users_normalize_email()` → trigger 🔐 *(iam/functions_3.md)*

### Views (6)

- **`iam.admin_organizations_view`**
- **`iam.admin_users_view`**
- **`iam.organization_member_details`**
- **`iam.organization_members_full_view`**
- **`iam.organization_online_users`**
- **`iam.users_public_profile_view`**

---

## Schema: `construction`

### Tables (10)

- **`construction.construction_dependencies`** (10 cols | FK: successor_task_id → construction_tasks, predecessor_task_id → construction_tasks)
- **`construction.construction_phase_tasks`** (6 cols | FK: project_phase_id → construction_project_phases, construction_task_id → construction_tasks)
- **`construction.construction_phases`** (7 cols)
- **`construction.construction_project_phases`** (9 cols | FK: phase_id → construction_phases)
- **`construction.construction_task_material_snapshots`** (11 cols | FK: construction_task_id → construction_tasks)
- **`construction.construction_tasks`** (26 cols)
- **`construction.labor_insurances`** (16 cols)
- **`construction.personnel_attendees`** (13 cols | FK: site_log_id → site_logs)
- **`construction.site_log_types`** (11 cols)
- **`construction.site_logs`** (20 cols | FK: entry_type_id → site_log_types)

### Functions (4)

- `construction.approve_quote_and_create_tasks(p_quote_id uuid, p_member_id uuid DEFAULT NULL::uuid)` → jsonb 🔐 *(construction/functions_1.md)*
- `construction.create_construction_task_material_snapshot()` → trigger *(construction/functions_1.md)*
- `construction.get_next_change_order_number(p_contract_id uuid)` → integer *(construction/functions_1.md)*
- `construction.sync_task_status_progress()` → trigger *(construction/functions_1.md)*

### Views (5)

- **`construction.construction_tasks_view`**
- **`construction.contract_summary_view`**
- **`construction.labor_insurance_view`**
- **`construction.project_material_requirements_view`**
- **`construction.quotes_view`**

---

## Schema: `projects`

### Tables (10)

- **`projects.client_portal_branding`** (14 cols | FK: project_id → projects)
- **`projects.client_portal_settings`** (14 cols | FK: project_id → projects)
- **`projects.client_roles`** (11 cols)
- **`projects.project_clients`** (14 cols | FK: project_id → projects, client_role_id → client_roles)
- **`projects.project_data`** (23 cols | FK: project_id → projects)
- **`projects.project_labor`** (15 cols | FK: project_id → projects)
- **`projects.project_modalities`** (10 cols)
- **`projects.project_settings`** (10 cols | FK: project_id → projects)
- **`projects.project_types`** (10 cols)
- **`projects.projects`** (19 cols | FK: project_type_id → project_types, project_modality_id → project_modalities)

### Views (4)

- **`projects.project_access_view`**
- **`projects.project_clients_view`**
- **`projects.project_labor_view`**
- **`projects.projects_view`**

---

## Schema: `contacts`

### Tables (3)

- **`contacts.contact_categories`** (9 cols)
- **`contacts.contact_category_links`** (6 cols | FK: contact_id → contacts, contact_category_id → contact_categories)
- **`contacts.contacts`** (27 cols | FK: company_id → contacts)

### Functions (1)

- `contacts.protect_linked_contact_delete()` → trigger 🔐 *(contacts/functions_1.md)*

### Views (1)

- **`contacts.contacts_view`**

---

## Schema: `finance`

### Tables (44)

- **`finance.capital_adjustments`** (17 cols | FK: partner_id → capital_participants, currency_id → currencies)
- **`finance.capital_participants`** (11 cols)
- **`finance.client_commitments`** (18 cols | FK: currency_id → currencies, quote_id → quotes)
- **`finance.client_payment_schedule`** (16 cols | FK: commitment_id → client_commitments, currency_id → currencies)
- **`finance.client_payments`** (21 cols | FK: wallet_id → organization_wallets, commitment_id → client_commitments, currency_id → currencies, schedule_id → client_payment_schedule)
- **`finance.currencies`** (8 cols)
- **`finance.economic_index_components`** (8 cols | FK: index_type_id → economic_index_types)
- **`finance.economic_index_types`** (11 cols)
- **`finance.economic_index_values`** (10 cols | FK: index_type_id → economic_index_types)
- **`finance.exchange_rates`** (7 cols)
- **`finance.financial_operation_movements`** (15 cols | FK: financial_operation_id → financial_operations, wallet_id → organization_wallets, currency_id → currencies)
- **`finance.financial_operations`** (12 cols)
- **`finance.general_cost_categories`** (11 cols)
- **`finance.general_cost_payment_allocations`** (5 cols | FK: payment_id → general_costs_payments)
- **`finance.general_costs`** (14 cols | FK: category_id → general_cost_categories)
- **`finance.general_costs_payments`** (17 cols | FK: currency_id → currencies, general_cost_id → general_costs, wallet_id → organization_wallets)
- **`finance.indirect_costs`** (7 cols)
- **`finance.indirect_costs_payments`** (16 cols | FK: wallet_id → organization_wallets, currency_id → currencies, indirect_cost_id → indirect_costs)
- **`finance.labor_payments`** (19 cols | FK: currency_id → currencies, wallet_id → organization_wallets)
- **`finance.material_invoice_items`** (13 cols | FK: invoice_id → material_invoices)
- **`finance.material_invoices`** (18 cols | FK: currency_id → currencies, purchase_order_id → material_purchase_orders)
- **`finance.material_payments`** (20 cols | FK: purchase_id → material_invoices, wallet_id → organization_wallets, currency_id → currencies)
- **`finance.material_purchase_order_items`** (12 cols | FK: purchase_order_id → material_purchase_orders)
- **`finance.material_purchase_orders`** (18 cols | FK: currency_id → currencies)
- **`finance.movement_concepts`** (10 cols | FK: parent_id → movement_concepts)
- **`finance.movement_indirects`** (4 cols | FK: movement_id → movements, indirect_id → indirect_costs)
- **`finance.movements`** (22 cols | FK: category_id → movement_concepts, type_id → movement_concepts, subcategory_id → movement_concepts, currency_id → currencies, wallet_id → organization_wallets)
- **`finance.organization_currencies`** (9 cols | FK: currency_id → currencies)
- **`finance.organization_wallets`** (10 cols | FK: wallet_id → wallets)
- **`finance.partner_capital_balance`** (9 cols | FK: partner_id → capital_participants)
- **`finance.partner_contributions`** (17 cols | FK: partner_id → capital_participants, currency_id → currencies, wallet_id → organization_wallets)
- **`finance.partner_withdrawals`** (17 cols | FK: wallet_id → organization_wallets, currency_id → currencies, partner_id → capital_participants)
- **`finance.pdf`** (7 cols)
- **`finance.pdf_templates`** (29 cols)
- **`finance.personnel_rates`** (15 cols | FK: currency_id → currencies)
- **`finance.quote_items`** (19 cols | FK: currency_id → currencies, quote_id → quotes)
- **`finance.quotes`** (27 cols | FK: parent_quote_id → quotes, currency_id → currencies)
- **`finance.subcontract_bid_tasks`** (10 cols | FK: subcontract_task_id → subcontract_tasks, subcontract_bid_id → subcontract_bids)
- **`finance.subcontract_bids`** (12 cols | FK: currency_id → currencies, subcontract_id → subcontracts)
- **`finance.subcontract_payments`** (18 cols | FK: currency_id → currencies, wallet_id → organization_wallets, subcontract_id → subcontracts)
- **`finance.subcontract_tasks`** (8 cols | FK: subcontract_id → subcontracts)
- **`finance.subcontracts`** (22 cols | FK: currency_id → currencies, winner_bid_id → subcontract_bids, adjustment_index_type_id → economic_index_types)
- **`finance.tax_labels`** (5 cols)
- **`finance.wallets`** (5 cols)

### Functions (7)

- `finance.budget_item_move(p_budget_id uuid, p_item_id uuid, p_prev_item_id uuid, p_next_item_id uuid)` → void 🔐 *(finance/functions_1.md)*
- `finance.budget_item_set_default_sort_key()` → trigger 🔐 *(finance/functions_1.md)*
- `finance.fn_financial_kpi_summary(p_org_id uuid, p_project_id uuid DEFAULT NULL::uuid)` → TABLE(income numeric, expenses numeric, balance numeric, currency_symbol text, currency_code text) 🔐 *(finance/functions_1.md)*
- `finance.generate_po_order_number()` → trigger *(finance/functions_1.md)*
- `finance.quote_item_set_default_sort_key()` → trigger *(finance/functions_1.md)*
- `finance.recalculate_po_totals()` → trigger 🔐 *(finance/functions_1.md)*
- `finance.update_partner_balance_after_capital_change()` → trigger *(finance/functions_1.md)*

### Views (22)

- **`finance.capital_ledger_view`**
- **`finance.capital_organization_totals_view`**
- **`finance.capital_participants_summary_view`**
- **`finance.capital_partner_balances_view`**
- **`finance.capital_partner_kpi_view`**
- **`finance.client_financial_summary_view`**
- **`finance.client_payments_view`**
- **`finance.general_costs_by_category_view`**
- **`finance.general_costs_monthly_summary_view`**
- **`finance.general_costs_payments_view`**
- **`finance.labor_by_type_view`**
- **`finance.labor_monthly_summary_view`**
- **`finance.labor_payments_view`**
- **`finance.material_invoices_view`**
- **`finance.material_payments_view`**
- **`finance.material_purchase_orders_view`**
- **`finance.organization_currencies_view`**
- **`finance.organization_wallets_view`**
- **`finance.quotes_items_view`**
- **`finance.subcontract_payments_view`**
- **`finance.subcontracts_view`**
- **`finance.unified_financial_movements_view`**

---

## Schema: `ai`

### Tables (8)

- **`ai.ai_context_snapshots`** (6 cols)
- **`ai.ai_import_mapping_patterns`** (8 cols)
- **`ai.ai_import_value_patterns`** (9 cols)
- **`ai.ai_messages`** (6 cols)
- **`ai.ai_usage_logs`** (10 cols)
- **`ai.ai_user_greetings`** (5 cols)
- **`ai.ai_user_preferences`** (6 cols)
- **`ai.ai_user_usage_limits`** (6 cols)

---

## Schema: `catalog`

### Tables (33)

- **`catalog.external_service_prices`** (11 cols | FK: recipe_external_service_id → task_recipe_external_services)
- **`catalog.indirect_cost_values`** (7 cols)
- **`catalog.labor_categories`** (11 cols)
- **`catalog.labor_levels`** (6 cols)
- **`catalog.labor_prices`** (11 cols | FK: labor_type_id → labor_types)
- **`catalog.labor_roles`** (10 cols)
- **`catalog.labor_types`** (9 cols | FK: labor_category_id → labor_categories, labor_role_id → labor_roles, labor_level_id → labor_levels, unit_id → units)
- **`catalog.material_categories`** (5 cols | FK: parent_id → material_categories)
- **`catalog.material_prices`** (12 cols | FK: material_id → materials)
- **`catalog.material_types`** (11 cols)
- **`catalog.materials`** (20 cols | FK: unit_id → units, default_sale_unit_id → units, category_id → material_categories)
- **`catalog.organization_material_prices`** (9 cols | FK: material_id → materials)
- **`catalog.organization_task_prices`** (11 cols | FK: task_id → tasks)
- **`catalog.task_action_categories`** (8 cols)
- **`catalog.task_actions`** (8 cols | FK: action_category_id → task_action_categories)
- **`catalog.task_construction_systems`** (11 cols)
- **`catalog.task_divisions`** (15 cols | FK: parent_id → task_divisions)
- **`catalog.task_element_actions`** (3 cols | FK: action_id → task_actions, element_id → task_elements)
- **`catalog.task_element_systems`** (3 cols | FK: system_id → task_construction_systems, element_id → task_elements)
- **`catalog.task_elements`** (12 cols)
- **`catalog.task_parameter_options`** (14 cols | FK: parameter_id → task_parameters, material_id → materials, unit_id → units)
- **`catalog.task_parameters`** (14 cols)
- **`catalog.task_recipe_external_services`** (17 cols | FK: recipe_id → task_recipes, unit_id → units)
- **`catalog.task_recipe_labor`** (14 cols | FK: labor_type_id → labor_types, unit_id → units, recipe_id → task_recipes)
- **`catalog.task_recipe_materials`** (16 cols | FK: recipe_id → task_recipes, material_id → materials, unit_id → units)
- **`catalog.task_recipe_ratings`** (10 cols | FK: recipe_id → task_recipes)
- **`catalog.task_recipes`** (18 cols | FK: task_id → tasks)
- **`catalog.task_system_parameters`** (5 cols | FK: system_id → task_construction_systems, parameter_id → task_parameters)
- **`catalog.task_template_parameters`** (6 cols | FK: parameter_id → task_parameters, template_id → task_templates)
- **`catalog.task_templates`** (17 cols | FK: task_element_id → task_elements, task_division_id → task_divisions, task_construction_system_id → task_construction_systems, task_action_id → task_actions, unit_id → units)
- **`catalog.tasks`** (24 cols | FK: task_action_id → task_actions, task_division_id → task_divisions, task_element_id → task_elements, task_construction_system_id → task_construction_systems, template_id → task_templates, unit_id → units)
- **`catalog.unit_categories`** (6 cols)
- **`catalog.units`** (13 cols | FK: unit_category_id → unit_categories)

### Functions (8)

- `catalog.increment_recipe_usage()` → trigger *(catalog/functions_1.md)*
- `catalog.lock_org_task_on_update()` → trigger 🔐 *(catalog/functions_1.md)*
- `catalog.recalculate_recipe_rating()` → trigger *(catalog/functions_1.md)*
- `catalog.refresh_labor_avg_prices()` → void 🔐 *(catalog/functions_1.md)*
- `catalog.refresh_material_avg_prices()` → void 🔐 *(catalog/functions_1.md)*
- `catalog.set_budget_task_organization()` → trigger 🔐 *(catalog/functions_1.md)*
- `catalog.set_task_labor_organization()` → trigger *(catalog/functions_1.md)*
- `catalog.set_task_material_organization()` → trigger 🔐 *(catalog/functions_1.md)*

### Views (6)

- **`catalog.labor_view`**
- **`catalog.materials_view`**
- **`catalog.organization_task_prices_view`**
- **`catalog.task_costs_view`**
- **`catalog.task_recipes_view`**
- **`catalog.tasks_view`**

---

## Schema: `academy`

### Tables (10)

- **`academy.course_details`** (13 cols | FK: instructor_id → course_instructors, course_id → courses)
- **`academy.course_enrollments`** (8 cols | FK: course_id → courses)
- **`academy.course_faqs`** (7 cols | FK: course_id → courses)
- **`academy.course_instructors`** (16 cols)
- **`academy.course_lesson_notes`** (9 cols | FK: lesson_id → course_lessons)
- **`academy.course_lesson_progress`** (10 cols | FK: lesson_id → course_lessons)
- **`academy.course_lessons`** (11 cols | FK: module_id → course_modules)
- **`academy.course_modules`** (10 cols | FK: course_id → courses)
- **`academy.courses`** (14 cols)
- **`academy.testimonials`** (16 cols | FK: course_id → courses)

### Functions (2)

- `academy.fill_progress_user_id_from_auth()` → trigger 🔐 *(academy/functions_1.md)*
- `academy.step_course_enrollment_annual(p_user_id uuid, p_course_id uuid)` → void *(academy/functions_1.md)*

### Views (7)

- **`academy.course_lesson_completions_view`**
- **`academy.course_lessons_total_view`**
- **`academy.course_progress_view`**
- **`academy.course_user_active_days_view`**
- **`academy.course_user_course_done_view`**
- **`academy.course_user_global_progress_view`**
- **`academy.course_user_study_time_view`**

---

## Schema: `billing`

### Tables (16)

- **`billing.bank_transfer_payments`** (22 cols | FK: payment_id → payments, plan_id → plans)
- **`billing.billing_profiles`** (12 cols)
- **`billing.coupon_courses`** (2 cols | FK: coupon_id → coupons)
- **`billing.coupon_plans`** (2 cols | FK: coupon_id → coupons, plan_id → plans)
- **`billing.coupon_redemptions`** (10 cols | FK: coupon_id → coupons, plan_id → plans, subscription_id → organization_subscriptions)
- **`billing.coupons`** (16 cols)
- **`billing.mp_preferences`** (31 cols | FK: coupon_id → coupons, plan_id → plans)
- **`billing.organization_billing_cycles`** (22 cols | FK: subscription_id → organization_subscriptions, payment_uuid → payments, plan_id → plans)
- **`billing.organization_member_events`** (11 cols | FK: subscription_id → organization_subscriptions)
- **`billing.organization_subscriptions`** (18 cols | FK: scheduled_downgrade_plan_id → plans, plan_id → plans, payment_id → payments, coupon_id → coupons)
- **`billing.payment_events`** (16 cols)
- **`billing.payment_plans`** (5 cols)
- **`billing.payments`** (16 cols)
- **`billing.paypal_preferences`** (21 cols | FK: coupon_id → coupons, plan_id → plans)
- **`billing.plans`** (18 cols)
- **`billing.subscription_notifications_log`** (4 cols | FK: subscription_id → organization_subscriptions)

### Functions (14)

- `billing.check_active_project_limit(p_organization_id uuid, p_excluded_project_id uuid DEFAULT NULL::uuid)` → json 🔐 *(billing/functions_1.md)*
- `billing.get_organization_seat_status(p_organization_id uuid)` → jsonb 🔐 *(billing/functions_1.md)*
- `billing.get_upgrade_proration(p_organization_id uuid, p_target_plan_id uuid)` → jsonb 🔐 *(billing/functions_1.md)*
- `billing.handle_payment_course_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` → jsonb 🔐 *(billing/functions_1.md)*
- `billing.handle_payment_seat_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_seats_purchased integer, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` → jsonb 🔐 *(billing/functions_1.md)*
- `billing.handle_payment_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb, p_is_upgrade boolean DEFAULT false)` → jsonb 🔐 *(billing/functions_1.md)*
- `billing.handle_payment_upgrade_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` → jsonb 🔐 *(billing/functions_1.md)*
- `billing.redeem_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text, p_order_id uuid DEFAULT NULL::uuid, p_subscription_id uuid DEFAULT NULL::uuid)` → jsonb 🔐 *(billing/functions_1.md)*
- `billing.step_apply_founders_program(p_user_id uuid, p_organization_id uuid)` → void *(billing/functions_1.md)*
- `billing.step_organization_set_plan(p_organization_id uuid, p_plan_id uuid)` → void *(billing/functions_1.md)*
- `billing.step_payment_insert_idempotent(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_product_type text, p_plan_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb)` → uuid *(billing/functions_1.md)*
- `billing.step_subscription_create_active(p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_payment_id uuid, p_amount numeric, p_currency text)` → uuid *(billing/functions_1.md)*
- `billing.step_subscription_expire_previous(p_organization_id uuid)` → void *(billing/functions_1.md)*
- `billing.validate_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text)` → jsonb 🔐 *(billing/functions_1.md)*

---

## Schema: `ops`

### Tables (6)

- **`ops.ops_alerts`** (20 cols)
- **`ops.ops_check_runs`** (7 cols)
- **`ops.ops_repair_actions`** (9 cols)
- **`ops.ops_repair_logs`** (7 cols | FK: alert_id → ops_alerts)
- **`ops.system_error_logs`** (8 cols)
- **`ops.system_job_logs`** (8 cols)

### Functions (11)

- `ops.admin_cleanup_test_purchase(p_user_email text, p_org_id uuid)` → jsonb 🔐 *(ops/functions_1.md)*
- `ops.fn_storage_overview(p_org_id uuid)` → TABLE(total_bytes bigint, file_count bigint, folder_count bigint, max_storage_mb integer, by_type jsonb) 🔐 *(ops/functions_1.md)*
- `ops.log_system_error(p_domain text, p_entity text, p_function_name text, p_error_message text, p_context jsonb DEFAULT NULL::jsonb, p_severity text DEFAULT 'error'::text)` → void 🔐 *(ops/functions_1.md)*
- `ops.ops_apply_plan_to_org(p_alert_id uuid, p_executed_by uuid)` → void *(ops/functions_1.md)*
- `ops.ops_detect_orgs_without_currency()` → void 🔐 *(ops/functions_1.md)*
- `ops.ops_detect_payment_entitlement_missing()` → void 🔐 *(ops/functions_1.md)*
- `ops.ops_detect_payment_not_applied()` → void 🔐 *(ops/functions_1.md)*
- `ops.ops_detect_subscription_missing_course()` → void *(ops/functions_1.md)*
- `ops.ops_execute_repair_action(p_alert_id uuid, p_action_id text, p_executed_by uuid)` → void *(ops/functions_1.md)*
- `ops.ops_retry_user_creation(p_alert_id uuid, p_executed_by uuid)` → void *(ops/functions_1.md)*
- `ops.ops_run_all_checks()` → void 🔐 *(ops/functions_1.md)*

### Views (14)

- **`ops.analytics_at_risk_users_view`**
- **`ops.analytics_bounce_rate_view`**
- **`ops.analytics_general_kpis_view`**
- **`ops.analytics_hourly_activity_view`**
- **`ops.analytics_page_engagement_view`**
- **`ops.analytics_realtime_overview_view`**
- **`ops.analytics_session_duration_view`**
- **`ops.analytics_top_users_view`**
- **`ops.analytics_user_growth_view`**
- **`ops.analytics_user_journeys_view`**
- **`ops.analytics_user_session_summary_view`**
- **`ops.analytics_users_by_country_view`**
- **`ops.ops_alerts_enriched_view`**
- **`ops.system_errors_enriched_view`**

---

## Schema: `notifications`

### Tables (5)

- **`notifications.email_queue`** (11 cols)
- **`notifications.notification_settings`** (6 cols)
- **`notifications.notifications`** (12 cols)
- **`notifications.push_subscriptions`** (7 cols)
- **`notifications.user_notifications`** (6 cols | FK: notification_id → notifications)

### Functions (17)

- `notifications.notify_admin_on_new_user()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.notify_admin_on_payment()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.notify_broadcast_all(p_type text, p_title text, p_body text, p_data jsonb, p_created_by uuid)` → uuid 🔐 *(notifications/functions_1.md)*
- `notifications.notify_course_enrollment()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.notify_new_feedback()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.notify_new_transfer()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.notify_new_user()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.notify_push_on_notification()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.notify_quote_status_change()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.notify_subscription_activated()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.notify_system_error()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.notify_user_direct(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb, p_created_by uuid)` → uuid 🔐 *(notifications/functions_1.md)*
- `notifications.notify_user_payment_completed()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.queue_email_bank_transfer(p_user_id uuid, p_transfer_id uuid, p_product_name text, p_amount numeric, p_currency text, p_payer_name text, p_receipt_url text, p_user_email text DEFAULT NULL::text, p_user_first_name text DEFAULT NULL::text)` → jsonb 🔐 *(notifications/functions_1.md)*
- `notifications.queue_email_welcome()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.queue_purchase_email()` → trigger 🔐 *(notifications/functions_1.md)*
- `notifications.send_notification(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb DEFAULT '{}'::jsonb, p_audience text DEFAULT 'direct'::text)` → uuid 🔐 *(notifications/functions_1.md)*

---

## Schema: `audit`

### Tables (3)

- **`audit.changelog_entries`** (9 cols)
- **`audit.organization_activity_logs`** (8 cols)
- **`audit.signatures`** (15 cols)

### Functions (46)

- `audit.audit_subcontract_payments()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_activity(p_organization_id uuid, p_user_id uuid, p_action text, p_target_table text, p_target_id uuid, p_metadata jsonb)` → void 🔐 *(audit/functions_1.md)*
- `audit.log_client_commitment_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_client_payment_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_client_role_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_construction_task_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_contact_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_contact_category_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_external_actor_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_financial_movement_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_financial_operation_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_general_cost_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_general_cost_category_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_general_costs_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_general_costs_payments_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_import_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_import_batch_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_labor_category_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_labor_payment_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_labor_price_activity()` → trigger 🔐 *(audit/functions_1.md)*
- `audit.log_material_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_material_payment_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_media_file_folder_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_member_billable_change()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_organization_data_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_organizations_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_payment_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_project_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_project_client_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_project_data_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_project_labor_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_project_modality_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_project_type_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_quote_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_quote_item_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_recipe_external_service_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_recipe_labor_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_recipe_material_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_site_log_types_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_site_logs_activity()` → trigger 🔐 *(audit/functions_2.md)*
- `audit.log_subcontract_activity()` → trigger 🔐 *(audit/functions_3.md)*
- `audit.log_subcontract_payment_activity()` → trigger 🔐 *(audit/functions_3.md)*
- `audit.log_task_activity()` → trigger 🔐 *(audit/functions_3.md)*
- `audit.log_task_division_activity()` → trigger 🔐 *(audit/functions_3.md)*
- `audit.log_task_recipe_activity()` → trigger 🔐 *(audit/functions_3.md)*
- `audit.log_unit_activity()` → trigger 🔐 *(audit/functions_3.md)*

### Views (1)

- **`audit.organization_activity_logs_view`**

---

## Schema: `planner`

### Tables (14)

- **`planner.attachments`** (12 cols | FK: item_id → items)
- **`planner.attendees`** (11 cols | FK: item_id → items)
- **`planner.board_permissions`** (12 cols | FK: board_id → boards)
- **`planner.boards`** (18 cols | FK: template_id → boards)
- **`planner.checklist_items`** (16 cols | FK: checklist_id → checklists)
- **`planner.checklists`** (11 cols | FK: item_id → items)
- **`planner.comments`** (10 cols | FK: item_id → items)
- **`planner.item_labels`** (5 cols | FK: item_id → items, label_id → labels)
- **`planner.item_watchers`** (6 cols | FK: item_id → items)
- **`planner.items`** (38 cols | FK: parent_item_id → items, list_id → lists, board_id → boards)
- **`planner.labels`** (11 cols)
- **`planner.lists`** (15 cols | FK: board_id → boards)
- **`planner.mentions`** (9 cols | FK: comment_id → comments)
- **`planner.reminders`** (12 cols | FK: item_id → items)

### Functions (5)

- `planner.auto_complete_item()` → trigger *(planner/functions_1.md)*
- `planner.log_board_activity()` → trigger 🔐 *(planner/functions_1.md)*
- `planner.log_comment_activity()` → trigger 🔐 *(planner/functions_1.md)*
- `planner.log_item_activity()` → trigger 🔐 *(planner/functions_1.md)*
- `planner.set_item_board_id()` → trigger *(planner/functions_1.md)*

### Views (2)

- **`planner.boards_view`**
- **`planner.items_view`**

---

## Schema: `community`

### Tables (9)

- **`community.forum_categories`** (12 cols)
- **`community.forum_posts`** (10 cols | FK: thread_id → forum_threads, parent_id → forum_posts)
- **`community.forum_reactions`** (6 cols)
- **`community.forum_threads`** (15 cols | FK: category_id → forum_categories)
- **`community.founder_event_registrations`** (6 cols | FK: event_id → founder_portal_events)
- **`community.founder_portal_events`** (13 cols)
- **`community.founder_vote_ballots`** (6 cols | FK: option_id → founder_vote_options, topic_id → founder_vote_topics)
- **`community.founder_vote_options`** (4 cols | FK: topic_id → founder_vote_topics)
- **`community.founder_vote_topics`** (10 cols)

### Functions (1)

- `community.update_forum_thread_activity()` → trigger 🔐 *(community/functions_1.md)*

---

## Schema: `design`

### Tables (3)

- **`design.pin_board_items`** (5 cols | FK: pin_id → pins, board_id → pin_boards)
- **`design.pin_boards`** (8 cols)
- **`design.pins`** (8 cols)

### Functions (1)

- `design.generate_next_document_group_name(p_folder_id uuid)` → text 🔐 *(design/functions_1.md)*

---

## Schema: `providers`

### Tables (4)

- **`providers.brands`** (4 cols)
- **`providers.product_prices`** (6 cols | FK: provider_product_id → provider_products)
- **`providers.products`** (15 cols | FK: brand_id → brands)
- **`providers.provider_products`** (7 cols | FK: product_id → products)

### Functions (1)

- `providers.refresh_product_avg_prices()` → void 🔐 *(providers/functions_1.md)*

---
