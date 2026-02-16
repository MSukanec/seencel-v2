# Database Schema (Auto-generated)
> Generated: 2026-02-16T18:36:44.978Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Triggers (210)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| bank_transfer_payments | notify_new_transfer | AFTER | INSERT | EXECUTE FUNCTION notify_new_transfer() |
| bank_transfer_payments | trg_btp_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| billing_profiles | trg_billing_profiles_user_id_immutable | BEFORE | UPDATE | EXECUTE FUNCTION forbid_user_id_change() |
| calendar_events | on_calendar_event_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_calendar_event_activity() |
| calendar_events | set_updated_by_calendar_events | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| capital_adjustments | capital_adjustments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| capital_adjustments | trg_update_balance_adjustment | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION update_partner_balance_after_capital_cha... |
| client_commitments | client_commitments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| client_commitments | on_client_commitment_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION log_client_commitment_activity() |
| client_commitments | set_audit_client_commitments | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| client_payment_schedule | client_payment_schedule_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| client_payment_schedule | set_audit_client_schedule | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| client_payments | on_client_payment_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION log_client_payment_activity() |
| client_payments | set_audit_client_payments | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| client_payments | set_client_payments_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| client_portal_settings | set_audit_client_portal | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| client_roles | on_client_role_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_client_role_activity() |
| client_roles | set_audit_client_roles | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| construction_dependencies | set_updated_by_construction_dependencies | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| construction_tasks | on_construction_task_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION log_construction_task_activity() |
| construction_tasks | set_updated_by_construction_tasks | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| construction_tasks | trg_construction_task_material_snapshot | AFTER | INSERT | EXECUTE FUNCTION create_construction_task_material_snapsh... |
| contact_categories | on_contact_category_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION log_contact_category_activity() |
| contact_categories | set_updated_by_contact_categories | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| contact_category_links | trigger_contact_category_links_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_contact_category_links_updated_at() |
| contacts | on_contact_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION log_contact_activity() |
| contacts | on_contact_link_user | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_contact_link_user() |
| contacts | set_updated_by_contacts | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| coupons | trg_coupons_set_updated | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| course_details | course_details_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_enrollments | course_enrollments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_enrollments | notify_course_enrollment | AFTER | INSERT | EXECUTE FUNCTION notify_course_enrollment() |
| course_faqs | course_faqs_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_instructors | course_instructors_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_lesson_notes | course_lesson_notes_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_lesson_progress | trg_progress_fill_user | BEFORE | INSERT | EXECUTE FUNCTION fill_progress_user_id_from_auth() |
| course_lessons | course_lessons_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_modules | course_modules_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| courses | courses_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| external_service_prices | external_service_prices_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| feedback | notify_new_feedback | AFTER | INSERT | EXECUTE FUNCTION notify_new_feedback() |
| financial_operation_movements | on_financial_movement_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION log_financial_movement_activity() |
| financial_operation_movements | set_updated_at_financial_operation_movements | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| financial_operation_movements | set_updated_by_financial_operation_movements | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| financial_operations | on_financial_operation_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION log_financial_operation_activity() |
| financial_operations | set_updated_at_financial_operations | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| financial_operations | set_updated_by_financial_operations | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| forum_posts | trg_update_thread_activity | AFTER | DELETE, INSERT | EXECUTE FUNCTION update_forum_thread_activity() |
| general_cost_categories | on_general_cost_categories_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION log_general_cost_category_activity() |
| general_cost_categories | set_updated_by_general_cost_categories | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| general_cost_categories | trg_set_updated_at_general_cost_categories | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| general_costs | on_general_costs_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION log_general_costs_activity() |
| general_costs | set_updated_by_general_costs | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| general_costs_payments | on_gc_payments_audit | AFTER | UPDATE, INSERT | EXECUTE FUNCTION log_general_costs_payments_activity() |
| general_costs_payments | set_updated_by_gc_payments | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| ia_user_preferences | trg_set_updated_at_ia_user_preferences | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at_ia_user_preferences() |
| import_batches | set_import_batch_member_id | BEFORE | INSERT | EXECUTE FUNCTION handle_import_batch_member_id() |
| import_batches | tr_log_import_activity | AFTER | UPDATE, INSERT | EXECUTE FUNCTION log_import_activity() |
| kanban_attachments | kanban_attachments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_attachments | set_updated_by_kanban_attachments | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_boards | kanban_boards_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_boards | on_kanban_board_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION log_kanban_board_activity() |
| kanban_boards | set_updated_by_kanban_boards | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| kanban_cards | kanban_cards_auto_complete | BEFORE | UPDATE | EXECUTE FUNCTION kanban_auto_complete_card() |
| kanban_cards | kanban_cards_set_board_id | BEFORE | INSERT | EXECUTE FUNCTION kanban_set_card_board_id() |
| kanban_cards | kanban_cards_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_cards | on_kanban_card_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION log_kanban_child_activity() |
| kanban_cards | set_updated_by_kanban_cards | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_cards | trg_notify_kanban_card_assigned | AFTER | UPDATE, INSERT | EXECUTE FUNCTION notify_kanban_card_assigned() |
| kanban_checklist_items | kanban_checklist_items_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_checklist_items | set_updated_by_kanban_checklist_items | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_checklists | kanban_checklists_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_checklists | set_updated_by_kanban_checklists | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_comments | kanban_comments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_comments | on_kanban_comment_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_kanban_comment_activity() |
| kanban_comments | set_updated_by_kanban_comments | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_labels | kanban_labels_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_labels | on_kanban_label_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION log_kanban_label_activity() |
| kanban_labels | set_updated_by_kanban_labels | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_lists | kanban_lists_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_lists | on_kanban_list_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION log_kanban_child_activity() |
| kanban_lists | set_updated_by_kanban_lists | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| labor_categories | on_labor_category_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_labor_category_activity() |
| labor_categories | set_updated_by_labor_categories | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| labor_levels | set_updated_at_labor_levels | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| labor_payments | on_labor_payment_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_labor_payment_activity() |
| labor_payments | set_labor_payments_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| labor_payments | set_updated_by_labor_payments | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| labor_prices | on_labor_price_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION log_labor_price_activity() |
| labor_prices | set_updated_at_labor_prices | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| labor_prices | set_updated_by_labor_prices | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| labor_roles | set_updated_at_labor_roles | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| labor_types | set_updated_at_labor_types | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| material_payments | on_material_payment_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_material_payment_activity() |
| material_payments | set_audit_material_payments | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| material_payments | set_material_payments_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| material_purchase_order_items | trg_recalculate_po_totals | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION recalculate_po_totals() |
| material_purchase_orders | trg_generate_po_number | BEFORE | INSERT | EXECUTE FUNCTION generate_po_order_number() |
| material_types | set_updated_by_material_types | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| material_types | trg_set_updated_at_material_types | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| materials | on_material_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_material_activity() |
| materials | set_updated_at_materials | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| materials | set_updated_by_materials | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| media_file_folders | media_file_folders_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| media_file_folders | on_media_file_folder_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION log_media_file_folder_activity() |
| media_file_folders | set_updated_by_media_file_folders | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| media_files | set_updated_by_media_files | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| media_files | trigger_cleanup_media_file_hard_delete | AFTER | DELETE | EXECUTE FUNCTION cleanup_media_file_storage() |
| media_links | set_updated_by_media_links | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| ops_alerts | ops_alerts_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| organization_data | on_organization_data_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_organization_data_activity() |
| organization_data | set_updated_by_organization_data | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| organization_invitations | trigger_create_contact_on_registered_invitation | AFTER | INSERT | EXECUTE FUNCTION handle_registered_invitation() |
| organization_members | log_member_billable_changes | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION log_member_billable_change() |
| organization_members | set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| organization_members | set_updated_by_organization_members | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| organization_members | trigger_create_contact_on_new_member | AFTER | INSERT | EXECUTE FUNCTION handle_new_org_member_contact() |
| organization_preferences | set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| organization_preferences | update_organization_preferences_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| organization_recipe_preferences | trg_increment_recipe_usage | AFTER | INSERT | EXECUTE FUNCTION increment_recipe_usage() |
| organization_subscriptions | trg_notify_subscription_activated | AFTER | INSERT | EXECUTE FUNCTION notify_subscription_activated() |
| organization_task_prices | trg_lock_org_task | BEFORE | UPDATE | EXECUTE FUNCTION lock_org_task_on_update() |
| organization_wallets | organization_wallets_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| organizations | on_organizations_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION log_organizations_activity() |
| organizations | organizations_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| organizations | set_updated_by_organizations | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by_organizations() |
| partner_contributions | trg_update_balance_contribution | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION update_partner_balance_after_capital_cha... |
| partner_withdrawals | trg_update_balance_withdrawal | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION update_partner_balance_after_capital_cha... |
| payments | notify_payment | AFTER | INSERT, UPDATE | EXECUTE FUNCTION notify_admin_on_payment() |
| payments | notify_user_payment_completed | AFTER | INSERT, UPDATE | EXECUTE FUNCTION notify_user_payment_completed() |
| pdf_templates | update_pdf_templates_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| project_clients | on_project_client_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION log_project_client_activity() |
| project_clients | set_audit_project_clients | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| project_data | on_project_data_audit | AFTER | UPDATE | EXECUTE FUNCTION log_project_data_activity() |
| project_data | project_data_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| project_data | set_updated_by_project_data | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| project_labor | on_project_labor_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_project_labor_activity() |
| project_labor | set_project_labor_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| project_labor | set_updated_by_project_labor | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| project_modalities | on_project_modality_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_project_modality_activity() |
| project_modalities | project_modalities_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| project_modalities | set_updated_by_project_modalities | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| project_settings | set_project_settings_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| project_types | on_project_type_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION log_project_type_activity() |
| project_types | project_types_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| project_types | set_updated_by_project_types | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| projects | on_project_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION log_project_activity() |
| projects | projects_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| projects | set_updated_by_projects | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| quote_items | on_quote_item_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION log_quote_item_activity() |
| quote_items | quote_items_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| quote_items | set_updated_by_quote_items | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| quote_items | trg_quote_item_default_sort | BEFORE | INSERT | EXECUTE FUNCTION quote_item_set_default_sort_key() |
| quotes | notify_quote_status_change | AFTER | UPDATE | EXECUTE FUNCTION notify_quote_status_change() |
| quotes | on_quote_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION log_quote_activity() |
| quotes | quotes_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| quotes | set_updated_by_quotes | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| role_permissions | trg_role_permissions_sync_org | BEFORE | INSERT | EXECUTE FUNCTION sync_role_permission_org_id() |
| site_log_types | on_site_log_types_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION log_site_log_types_activity() |
| site_log_types | set_updated_by_site_log_types | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| site_log_types | update_site_log_types_timestamp | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| site_logs | on_site_logs_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_site_logs_activity() |
| site_logs | set_updated_by_site_logs | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| site_logs | update_site_logs_timestamp | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| subcontract_payments | on_subcontract_payment_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION log_subcontract_payment_activity() |
| subcontract_payments | set_subcontract_payments_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| subcontract_payments | set_updated_by_subcontract_payments | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| subcontracts | on_subcontract_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION log_subcontract_activity() |
| subcontracts | set_subcontracts_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| subcontracts | set_updated_by_subcontracts | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| system_error_logs | trg_notify_system_error | AFTER | INSERT | EXECUTE FUNCTION notify_system_error() |
| task_actions | task_kind_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_construction_systems | task_construction_systems_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_divisions | on_task_division_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_task_division_activity() |
| task_divisions | set_updated_by_task_divisions | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| task_divisions | task_divisions_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_elements | task_elements_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_parameter_options | task_parameter_options_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_parameters | task_parameters_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_recipe_external_services | on_recipe_external_service_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION log_recipe_external_service_activity() |
| task_recipe_external_services | set_updated_by_task_recipe_external_services | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| task_recipe_external_services | task_recipe_external_services_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_recipe_labor | on_recipe_labor_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION log_recipe_labor_activity() |
| task_recipe_labor | set_updated_by_task_recipe_labor | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| task_recipe_labor | task_recipe_labor_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_recipe_materials | on_recipe_material_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION log_recipe_material_activity() |
| task_recipe_materials | set_updated_by_task_recipe_materials | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| task_recipe_materials | task_recipe_materials_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_recipe_ratings | trg_recalculate_recipe_rating | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION recalculate_recipe_rating() |
| task_recipes | on_task_recipe_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION log_task_recipe_activity() |
| task_recipes | set_updated_by_task_recipes | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| task_recipes | task_recipes_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| task_task_parameters | task_task_parameters_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| tasks | on_task_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION log_task_activity() |
| tasks | set_updated_by_tasks | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| testimonials | trigger_testimonials_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_testimonials_updated_at() |
| unit_categories | trg_set_updated_at_unit_categories | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| units | on_unit_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION log_unit_activity() |
| units | set_updated_by_units | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| units | trg_set_updated_at_units | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| user_data | set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| user_data | trg_user_data_fill_user | BEFORE | INSERT | EXECUTE FUNCTION fill_user_data_user_id_from_auth() |
| user_notifications | trg_push_on_notification | AFTER | INSERT | EXECUTE FUNCTION notify_push_on_notification() |
| user_preferences | set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| user_presence | set_user_presence_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| users | notify_new_user | AFTER | INSERT | EXECUTE FUNCTION notify_admin_on_new_user() |
| users | on_user_created_queue_email_welcome | AFTER | INSERT | EXECUTE FUNCTION queue_email_welcome() |
| users | set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| users | trg_users_normalize_email | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION users_normalize_email() |
| users | trigger_sync_contact_on_user_update | AFTER | UPDATE | EXECUTE FUNCTION sync_contact_on_user_update() |
