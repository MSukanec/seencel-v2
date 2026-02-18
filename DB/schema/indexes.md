# Database Schema (Auto-generated)
> Generated: 2026-02-18T21:46:26.792Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Indexes (538, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| bank_transfer_payments | bank_transfer_payments_order_idx | `CREATE INDEX bank_transfer_payments_order_idx ON public.bank_transfer_payment...` |
| bank_transfer_payments | bank_transfer_payments_org_idx | `CREATE INDEX bank_transfer_payments_org_idx ON public.bank_transfer_payments ...` |
| bank_transfer_payments | bank_transfer_payments_payment_idx | `CREATE INDEX bank_transfer_payments_payment_idx ON public.bank_transfer_payme...` |
| bank_transfer_payments | bank_transfer_payments_plan_idx | `CREATE INDEX bank_transfer_payments_plan_idx ON public.bank_transfer_payments...` |
| bank_transfer_payments | bank_transfer_payments_user_idx | `CREATE INDEX bank_transfer_payments_user_idx ON public.bank_transfer_payments...` |
| billing_profiles | billing_profiles_user_id_uniq | `CREATE UNIQUE INDEX billing_profiles_user_id_uniq ON public.billing_profiles ...` |
| brands | brands_name_lower_uniq | `CREATE UNIQUE INDEX brands_name_lower_uniq ON public.brands USING btree (lowe...` |
| calendar_event_attendees | calendar_event_attendees_event_id_member_id_key | `CREATE UNIQUE INDEX calendar_event_attendees_event_id_member_id_key ON public...` |
| calendar_event_attendees | idx_event_attendees_event_id | `CREATE INDEX idx_event_attendees_event_id ON public.calendar_event_attendees ...` |
| calendar_event_attendees | idx_event_attendees_member_id | `CREATE INDEX idx_event_attendees_member_id ON public.calendar_event_attendees...` |
| calendar_event_reminders | idx_event_reminders_event_id | `CREATE INDEX idx_event_reminders_event_id ON public.calendar_event_reminders ...` |
| calendar_event_reminders | idx_event_reminders_remind_at | `CREATE INDEX idx_event_reminders_remind_at ON public.calendar_event_reminders...` |
| calendar_events | idx_calendar_events_org_id | `CREATE INDEX idx_calendar_events_org_id ON public.calendar_events USING btree...` |
| calendar_events | idx_calendar_events_project_id | `CREATE INDEX idx_calendar_events_project_id ON public.calendar_events USING b...` |
| calendar_events | idx_calendar_events_source | `CREATE INDEX idx_calendar_events_source ON public.calendar_events USING btree...` |
| calendar_events | idx_calendar_events_start_at | `CREATE INDEX idx_calendar_events_start_at ON public.calendar_events USING btr...` |
| calendar_events | idx_calendar_events_status | `CREATE INDEX idx_calendar_events_status ON public.calendar_events USING btree...` |
| capital_adjustments | idx_capital_adjustments_not_deleted | `CREATE INDEX idx_capital_adjustments_not_deleted ON public.capital_adjustment...` |
| capital_adjustments | idx_capital_adjustments_org_date | `CREATE INDEX idx_capital_adjustments_org_date ON public.capital_adjustments U...` |
| capital_adjustments | idx_capital_adjustments_partner_date | `CREATE INDEX idx_capital_adjustments_partner_date ON public.capital_adjustmen...` |
| capital_participants | idx_capital_participants_ownership_percentage | `CREATE INDEX idx_capital_participants_ownership_percentage ON public.capital_...` |
| capital_participants | idx_partners_contact | `CREATE INDEX idx_partners_contact ON public.capital_participants USING btree ...` |
| capital_participants | idx_partners_created_at | `CREATE INDEX idx_partners_created_at ON public.capital_participants USING btr...` |
| capital_participants | idx_partners_organization | `CREATE INDEX idx_partners_organization ON public.capital_participants USING b...` |
| capital_participants | idx_partners_status | `CREATE INDEX idx_partners_status ON public.capital_participants USING btree (...` |
| capital_participants | uniq_partner_organization_contact | `CREATE UNIQUE INDEX uniq_partner_organization_contact ON public.capital_parti...` |
| changelog_entries | changelog_entries_date_idx | `CREATE INDEX changelog_entries_date_idx ON public.changelog_entries USING btr...` |
| client_commitments | client_commitments_not_deleted_idx | `CREATE INDEX client_commitments_not_deleted_idx ON public.client_commitments ...` |
| client_commitments | idx_client_commitments_client | `CREATE INDEX idx_client_commitments_client ON public.client_commitments USING...` |
| client_commitments | idx_client_commitments_created_at | `CREATE INDEX idx_client_commitments_created_at ON public.client_commitments U...` |
| client_commitments | idx_client_commitments_currency | `CREATE INDEX idx_client_commitments_currency ON public.client_commitments USI...` |
| client_commitments | idx_client_commitments_method | `CREATE INDEX idx_client_commitments_method ON public.client_commitments USING...` |
| client_commitments | idx_client_commitments_org | `CREATE INDEX idx_client_commitments_org ON public.client_commitments USING bt...` |
| client_commitments | idx_client_commitments_org_project | `CREATE INDEX idx_client_commitments_org_project ON public.client_commitments ...` |
| client_commitments | idx_client_commitments_quote | `CREATE INDEX idx_client_commitments_quote ON public.client_commitments USING ...` |
| client_commitments | idx_commitments_org_project_client | `CREATE INDEX idx_commitments_org_project_client ON public.client_commitments ...` |
| client_payment_schedule | client_payment_schedule_commitment_idx | `CREATE INDEX client_payment_schedule_commitment_idx ON public.client_payment_...` |
| client_payment_schedule | client_payment_schedule_due_idx | `CREATE INDEX client_payment_schedule_due_idx ON public.client_payment_schedul...` |
| client_payment_schedule | client_payment_schedule_not_deleted_idx | `CREATE INDEX client_payment_schedule_not_deleted_idx ON public.client_payment...` |
| client_payment_schedule | client_payment_schedule_org_commitment_due_idx | `CREATE INDEX client_payment_schedule_org_commitment_due_idx ON public.client_...` |
| client_payment_schedule | client_payment_schedule_org_idx | `CREATE INDEX client_payment_schedule_org_idx ON public.client_payment_schedul...` |
| client_payments | idx_client_payments_commitment | `CREATE INDEX idx_client_payments_commitment ON public.client_payments USING b...` |
| client_payments | idx_client_payments_date | `CREATE INDEX idx_client_payments_date ON public.client_payments USING btree (...` |
| client_payments | idx_client_payments_import_batch | `CREATE INDEX idx_client_payments_import_batch ON public.client_payments USING...` |
| client_payments | idx_client_payments_not_deleted | `CREATE INDEX idx_client_payments_not_deleted ON public.client_payments USING ...` |
| client_payments | idx_client_payments_org_project | `CREATE INDEX idx_client_payments_org_project ON public.client_payments USING ...` |
| client_payments | idx_client_payments_schedule | `CREATE INDEX idx_client_payments_schedule ON public.client_payments USING btr...` |
| client_payments | idx_client_payments_view_org | `CREATE INDEX idx_client_payments_view_org ON public.client_payments USING btr...` |
| client_payments | idx_client_payments_view_project | `CREATE INDEX idx_client_payments_view_project ON public.client_payments USING...` |
| client_portal_branding | client_portal_branding_project_id_key | `CREATE UNIQUE INDEX client_portal_branding_project_id_key ON public.client_po...` |
| client_portal_settings | idx_client_portal_settings_org | `CREATE INDEX idx_client_portal_settings_org ON public.client_portal_settings ...` |
| construction_dependencies | construction_dependencies_unique | `CREATE UNIQUE INDEX construction_dependencies_unique ON public.construction_d...` |
| construction_dependencies | idx_construction_dependencies_organization | `CREATE INDEX idx_construction_dependencies_organization ON public.constructio...` |
| construction_dependencies | idx_construction_dependencies_predecessor | `CREATE INDEX idx_construction_dependencies_predecessor ON public.construction...` |
| construction_dependencies | idx_construction_dependencies_successor | `CREATE INDEX idx_construction_dependencies_successor ON public.construction_d...` |
| construction_phase_tasks | unique_phase_task | `CREATE UNIQUE INDEX unique_phase_task ON public.construction_phase_tasks USIN...` |
| construction_task_material_snapshots | ctms_unique_material | `CREATE UNIQUE INDEX ctms_unique_material ON public.construction_task_material...` |
| construction_task_material_snapshots | idx_ctms_construction_task | `CREATE INDEX idx_ctms_construction_task ON public.construction_task_material_...` |
| construction_task_material_snapshots | idx_ctms_material | `CREATE INDEX idx_ctms_material ON public.construction_task_material_snapshots...` |
| construction_task_material_snapshots | idx_ctms_organization | `CREATE INDEX idx_ctms_organization ON public.construction_task_material_snaps...` |
| construction_task_material_snapshots | idx_ctms_project | `CREATE INDEX idx_ctms_project ON public.construction_task_material_snapshots ...` |
| construction_tasks | construction_tasks_id_key | `CREATE UNIQUE INDEX construction_tasks_id_key ON public.construction_tasks US...` |
| construction_tasks | idx_construction_tasks_not_deleted | `CREATE INDEX idx_construction_tasks_not_deleted ON public.construction_tasks ...` |
| construction_tasks | idx_construction_tasks_organization_id | `CREATE INDEX idx_construction_tasks_organization_id ON public.construction_ta...` |
| construction_tasks | idx_construction_tasks_project_id | `CREATE INDEX idx_construction_tasks_project_id ON public.construction_tasks U...` |
| construction_tasks | idx_construction_tasks_quote_item_id | `CREATE INDEX idx_construction_tasks_quote_item_id ON public.construction_task...` |
| construction_tasks | idx_construction_tasks_recipe_id | `CREATE INDEX idx_construction_tasks_recipe_id ON public.construction_tasks US...` |
| construction_tasks | idx_construction_tasks_status | `CREATE INDEX idx_construction_tasks_status ON public.construction_tasks USING...` |
| contact_categories | idx_contact_categories_global_name_active | `CREATE UNIQUE INDEX idx_contact_categories_global_name_active ON public.conta...` |
| contact_categories | idx_contact_categories_org_name_active | `CREATE UNIQUE INDEX idx_contact_categories_org_name_active ON public.contact_...` |
| contact_category_links | contact_category_links_contact_id_contact_category_id_key | `CREATE UNIQUE INDEX contact_category_links_contact_id_contact_category_id_key...` |
| contacts | contacts_national_id_org_key | `CREATE UNIQUE INDEX contacts_national_id_org_key ON public.contacts USING btr...` |
| contacts | idx_contacts_company_id | `CREATE INDEX idx_contacts_company_id ON public.contacts USING btree (company_...` |
| contacts | idx_contacts_import_batch_id | `CREATE INDEX idx_contacts_import_batch_id ON public.contacts USING btree (imp...` |
| contacts | idx_contacts_is_deleted_org | `CREATE INDEX idx_contacts_is_deleted_org ON public.contacts USING btree (orga...` |
| contacts | idx_contacts_org_email | `CREATE UNIQUE INDEX idx_contacts_org_email ON public.contacts USING btree (or...` |
| contacts | uniq_contacts_org_linked_user | `CREATE UNIQUE INDEX uniq_contacts_org_linked_user ON public.contacts USING bt...` |
| countries | countries_alpha2_uniq | `CREATE UNIQUE INDEX countries_alpha2_uniq ON public.countries USING btree (al...` |
| countries | countries_alpha3_uniq | `CREATE UNIQUE INDEX countries_alpha3_uniq ON public.countries USING btree (al...` |
| countries | countries_name_lower_uniq | `CREATE UNIQUE INDEX countries_name_lower_uniq ON public.countries USING btree...` |
| countries | idx_countries_name | `CREATE INDEX idx_countries_name ON public.countries USING btree (name)` |
| coupon_courses | idx_coupon_courses_coupon | `CREATE INDEX idx_coupon_courses_coupon ON public.coupon_courses USING btree (...` |
| coupon_courses | idx_coupon_courses_course | `CREATE INDEX idx_coupon_courses_course ON public.coupon_courses USING btree (...` |
| coupon_plans | idx_coupon_plans_plan_id | `CREATE INDEX idx_coupon_plans_plan_id ON public.coupon_plans USING btree (pla...` |
| coupon_redemptions | idx_coupon_redemptions_coupon_id | `CREATE INDEX idx_coupon_redemptions_coupon_id ON public.coupon_redemptions US...` |
| coupon_redemptions | idx_coupon_redemptions_subscription_id | `CREATE INDEX idx_coupon_redemptions_subscription_id ON public.coupon_redempti...` |
| coupon_redemptions | idx_coupon_redemptions_user_id | `CREATE INDEX idx_coupon_redemptions_user_id ON public.coupon_redemptions USIN...` |
| coupons | coupons_code_lower_uidx | `CREATE UNIQUE INDEX coupons_code_lower_uidx ON public.coupons USING btree (lo...` |
| course_details | course_details_course_id_uniq | `CREATE UNIQUE INDEX course_details_course_id_uniq ON public.course_details US...` |
| course_enrollments | enroll_unique | `CREATE UNIQUE INDEX enroll_unique ON public.course_enrollments USING btree (u...` |
| course_enrollments | idx_course_enrollments_user | `CREATE INDEX idx_course_enrollments_user ON public.course_enrollments USING b...` |
| course_faqs | course_faqs_course_id_sort_idx | `CREATE INDEX course_faqs_course_id_sort_idx ON public.course_faqs USING btree...` |
| course_instructors | course_instructors_not_deleted_idx | `CREATE INDEX course_instructors_not_deleted_idx ON public.course_instructors ...` |
| course_instructors | idx_course_instructors_user | `CREATE INDEX idx_course_instructors_user ON public.course_instructors USING b...` |
| course_lesson_notes | lesson_markers_idx | `CREATE INDEX lesson_markers_idx ON public.course_lesson_notes USING btree (le...` |
| course_lesson_notes | lesson_notes_by_user_lesson | `CREATE INDEX lesson_notes_by_user_lesson ON public.course_lesson_notes USING ...` |
| course_lesson_notes | uniq_summary_per_user_lesson | `CREATE UNIQUE INDEX uniq_summary_per_user_lesson ON public.course_lesson_note...` |
| course_lesson_progress | idx_course_lesson_progress_user_completed | `CREATE INDEX idx_course_lesson_progress_user_completed ON public.course_lesso...` |
| course_lesson_progress | idx_lesson_progress_favorites | `CREATE INDEX idx_lesson_progress_favorites ON public.course_lesson_progress U...` |
| course_lesson_progress | idx_progress_user_updated_at | `CREATE INDEX idx_progress_user_updated_at ON public.course_lesson_progress US...` |
| course_lesson_progress | lesson_progress_unique | `CREATE UNIQUE INDEX lesson_progress_unique ON public.course_lesson_progress U...` |
| course_lessons | idx_course_lessons_module_active | `CREATE INDEX idx_course_lessons_module_active ON public.course_lessons USING ...` |
| course_lessons | lessons_module_id_sort_index_idx | `CREATE INDEX lessons_module_id_sort_index_idx ON public.course_lessons USING ...` |
| course_modules | course_modules_course_id_sort_index_idx | `CREATE INDEX course_modules_course_id_sort_index_idx ON public.course_modules...` |
| course_modules | course_modules_not_deleted_idx | `CREATE INDEX course_modules_not_deleted_idx ON public.course_modules USING bt...` |
| courses | courses_not_deleted_idx | `CREATE INDEX courses_not_deleted_idx ON public.courses USING btree (is_delete...` |
| courses | courses_slug_key | `CREATE UNIQUE INDEX courses_slug_key ON public.courses USING btree (slug)` |
| currencies | currencies_code_key | `CREATE UNIQUE INDEX currencies_code_key ON public.currencies USING btree (code)` |
| currencies | idx_currencies_code | `CREATE INDEX idx_currencies_code ON public.currencies USING btree (code)` |
| currencies | idx_currencies_name | `CREATE INDEX idx_currencies_name ON public.currencies USING btree (name)` |
| dashboard_layouts | idx_dashboard_layouts_user_org | `CREATE INDEX idx_dashboard_layouts_user_org ON public.dashboard_layouts USING...` |
| dashboard_layouts | uq_dashboard_layout | `CREATE UNIQUE INDEX uq_dashboard_layout ON public.dashboard_layouts USING btr...` |
| economic_index_components | economic_index_components_index_type_id_key_key | `CREATE UNIQUE INDEX economic_index_components_index_type_id_key_key ON public...` |
| economic_index_components | idx_index_components_type | `CREATE INDEX idx_index_components_type ON public.economic_index_components US...` |
| economic_index_types | economic_index_types_organization_id_name_key | `CREATE UNIQUE INDEX economic_index_types_organization_id_name_key ON public.e...` |
| economic_index_types | idx_index_types_org | `CREATE INDEX idx_index_types_org ON public.economic_index_types USING btree (...` |
| economic_index_values | economic_index_values_index_type_id_period_year_period_mont_key | `CREATE UNIQUE INDEX economic_index_values_index_type_id_period_year_period_mo...` |
| economic_index_values | idx_index_values_jsonb | `CREATE INDEX idx_index_values_jsonb ON public.economic_index_values USING gin...` |
| economic_index_values | idx_index_values_period | `CREATE INDEX idx_index_values_period ON public.economic_index_values USING bt...` |
| economic_index_values | idx_index_values_type | `CREATE INDEX idx_index_values_type ON public.economic_index_values USING btre...` |
| email_queue | idx_email_queue_pending | `CREATE INDEX idx_email_queue_pending ON public.email_queue USING btree (statu...` |
| exchange_rates | exchange_rates_unique_pair | `CREATE UNIQUE INDEX exchange_rates_unique_pair ON public.exchange_rates USING...` |
| exchange_rates | idx_exchange_rates_active | `CREATE INDEX idx_exchange_rates_active ON public.exchange_rates USING btree (...` |
| external_actor_scopes | external_actor_scopes_external_actor_id_permission_key_key | `CREATE UNIQUE INDEX external_actor_scopes_external_actor_id_permission_key_ke...` |
| external_actor_scopes | idx_eas_actor_perm | `CREATE INDEX idx_eas_actor_perm ON public.external_actor_scopes USING btree (...` |
| external_service_prices | idx_ext_service_prices_service | `CREATE INDEX idx_ext_service_prices_service ON public.external_service_prices...` |
| feature_flags | feature_flags_key_key | `CREATE UNIQUE INDEX feature_flags_key_key ON public.feature_flags USING btree...` |
| feature_flags | idx_feature_flags_parent_id | `CREATE INDEX idx_feature_flags_parent_id ON public.feature_flags USING btree ...` |
| forum_categories | forum_categories_slug_unique | `CREATE UNIQUE INDEX forum_categories_slug_unique ON public.forum_categories U...` |
| forum_categories | idx_forum_categories_course | `CREATE INDEX idx_forum_categories_course ON public.forum_categories USING btr...` |
| forum_posts | idx_forum_posts_thread | `CREATE INDEX idx_forum_posts_thread ON public.forum_posts USING btree (thread...` |
| forum_reactions | forum_reactions_user_id_item_type_item_id_key | `CREATE UNIQUE INDEX forum_reactions_user_id_item_type_item_id_key ON public.f...` |
| forum_threads | forum_threads_slug_key | `CREATE UNIQUE INDEX forum_threads_slug_key ON public.forum_threads USING btre...` |
| forum_threads | idx_forum_last_activity | `CREATE INDEX idx_forum_last_activity ON public.forum_threads USING btree (las...` |
| forum_threads | idx_forum_threads_category | `CREATE INDEX idx_forum_threads_category ON public.forum_threads USING btree (...` |
| founder_event_registrations | founder_event_registrations_event_id_organization_id_user_i_key | `CREATE UNIQUE INDEX founder_event_registrations_event_id_organization_id_user...` |
| founder_event_registrations | idx_founder_registrations_event | `CREATE INDEX idx_founder_registrations_event ON public.founder_event_registra...` |
| founder_portal_events | idx_founder_events_date | `CREATE INDEX idx_founder_events_date ON public.founder_portal_events USING bt...` |
| founder_vote_ballots | founder_vote_ballots_topic_id_organization_id_user_id_key | `CREATE UNIQUE INDEX founder_vote_ballots_topic_id_organization_id_user_id_key...` |
| founder_vote_ballots | idx_founder_ballots_topic | `CREATE INDEX idx_founder_ballots_topic ON public.founder_vote_ballots USING b...` |
| founder_vote_topics | idx_founder_vote_topics_status | `CREATE INDEX idx_founder_vote_topics_status ON public.founder_vote_topics USI...` |
| general_cost_categories | idx_gc_categories_list | `CREATE INDEX idx_gc_categories_list ON public.general_cost_categories USING b...` |
| general_cost_categories | uq_gc_categories_org_name | `CREATE UNIQUE INDEX uq_gc_categories_org_name ON public.general_cost_categori...` |
| general_cost_categories | uq_gc_categories_system_name | `CREATE UNIQUE INDEX uq_gc_categories_system_name ON public.general_cost_categ...` |
| general_costs | idx_general_costs_org_deleted | `CREATE INDEX idx_general_costs_org_deleted ON public.general_costs USING btre...` |
| general_costs_payments | idx_gc_payments_general_cost | `CREATE INDEX idx_gc_payments_general_cost ON public.general_costs_payments US...` |
| general_costs_payments | idx_gc_payments_org_date | `CREATE INDEX idx_gc_payments_org_date ON public.general_costs_payments USING ...` |
| general_costs_payments | idx_gc_payments_status_org | `CREATE INDEX idx_gc_payments_status_org ON public.general_costs_payments USIN...` |
| general_costs_payments | idx_gc_payments_wallet | `CREATE INDEX idx_gc_payments_wallet ON public.general_costs_payments USING bt...` |
| hero_sections | idx_hero_sections_is_deleted | `CREATE INDEX idx_hero_sections_is_deleted ON public.hero_sections USING btree...` |
| ia_context_snapshots | idx_ia_context_snapshots_type | `CREATE INDEX idx_ia_context_snapshots_type ON public.ia_context_snapshots USI...` |
| ia_context_snapshots | idx_ia_context_snapshots_user_org | `CREATE INDEX idx_ia_context_snapshots_user_org ON public.ia_context_snapshots...` |
| ia_import_mapping_patterns | ia_import_mapping_patterns_unique_mapping | `CREATE UNIQUE INDEX ia_import_mapping_patterns_unique_mapping ON public.ia_im...` |
| ia_import_value_patterns | ia_import_value_patterns_unique_source | `CREATE UNIQUE INDEX ia_import_value_patterns_unique_source ON public.ia_impor...` |
| ia_messages | idx_ia_messages_context_type | `CREATE INDEX idx_ia_messages_context_type ON public.ia_messages USING btree (...` |
| ia_messages | idx_ia_messages_user_id | `CREATE INDEX idx_ia_messages_user_id ON public.ia_messages USING btree (user_id)` |
| ia_usage_logs | idx_ia_usage_logs_context_type | `CREATE INDEX idx_ia_usage_logs_context_type ON public.ia_usage_logs USING btr...` |
| ia_usage_logs | idx_ia_usage_logs_user_id | `CREATE INDEX idx_ia_usage_logs_user_id ON public.ia_usage_logs USING btree (u...` |
| ia_user_greetings | ia_user_greetings_unique | `CREATE UNIQUE INDEX ia_user_greetings_unique ON public.ia_user_greetings USIN...` |
| ia_user_preferences | idx_ia_user_preferences_language | `CREATE INDEX idx_ia_user_preferences_language ON public.ia_user_preferences U...` |
| ia_user_usage_limits | idx_ia_user_usage_limits_last_reset | `CREATE INDEX idx_ia_user_usage_limits_last_reset ON public.ia_user_usage_limi...` |
| ia_user_usage_limits | idx_ia_user_usage_limits_plan | `CREATE INDEX idx_ia_user_usage_limits_plan ON public.ia_user_usage_limits USI...` |
| import_batches | idx_import_batches_member_id | `CREATE INDEX idx_import_batches_member_id ON public.import_batches USING btre...` |
| indirect_costs | indirect_costs_id_key | `CREATE UNIQUE INDEX indirect_costs_id_key ON public.indirect_costs USING btre...` |
| indirect_costs_payments | idx_indirect_costs_payments_date | `CREATE INDEX idx_indirect_costs_payments_date ON public.indirect_costs_paymen...` |
| indirect_costs_payments | idx_indirect_costs_payments_indirect | `CREATE INDEX idx_indirect_costs_payments_indirect ON public.indirect_costs_pa...` |
| indirect_costs_payments | idx_indirect_costs_payments_org_project | `CREATE INDEX idx_indirect_costs_payments_org_project ON public.indirect_costs...` |
| indirect_costs_payments | idx_indirect_costs_payments_view_org | `CREATE INDEX idx_indirect_costs_payments_view_org ON public.indirect_costs_pa...` |
| indirect_costs_payments | idx_indirect_costs_payments_view_project | `CREATE INDEX idx_indirect_costs_payments_view_project ON public.indirect_cost...` |
| kanban_boards | idx_kanban_boards_active | `CREATE INDEX idx_kanban_boards_active ON public.kanban_boards USING btree (or...` |
| kanban_boards | idx_kanban_boards_org | `CREATE INDEX idx_kanban_boards_org ON public.kanban_boards USING btree (organ...` |
| kanban_boards | idx_kanban_boards_org_project | `CREATE INDEX idx_kanban_boards_org_project ON public.kanban_boards USING btre...` |
| kanban_boards | idx_kanban_boards_project | `CREATE INDEX idx_kanban_boards_project ON public.kanban_boards USING btree (p...` |
| kanban_boards | idx_kanban_boards_template | `CREATE INDEX idx_kanban_boards_template ON public.kanban_boards USING btree (...` |
| kanban_card_labels | idx_kanban_card_labels_card | `CREATE INDEX idx_kanban_card_labels_card ON public.kanban_card_labels USING b...` |
| kanban_card_labels | idx_kanban_card_labels_label | `CREATE INDEX idx_kanban_card_labels_label ON public.kanban_card_labels USING ...` |
| kanban_cards | idx_kanban_cards_assigned | `CREATE INDEX idx_kanban_cards_assigned ON public.kanban_cards USING btree (as...` |
| kanban_cards | idx_kanban_cards_board | `CREATE INDEX idx_kanban_cards_board ON public.kanban_cards USING btree (board...` |
| kanban_cards | idx_kanban_cards_completed | `CREATE INDEX idx_kanban_cards_completed ON public.kanban_cards USING btree (i...` |
| kanban_cards | idx_kanban_cards_due | `CREATE INDEX idx_kanban_cards_due ON public.kanban_cards USING btree (due_dat...` |
| kanban_cards | idx_kanban_cards_list | `CREATE INDEX idx_kanban_cards_list ON public.kanban_cards USING btree (list_id)` |
| kanban_cards | idx_kanban_cards_org | `CREATE INDEX idx_kanban_cards_org ON public.kanban_cards USING btree (organiz...` |
| kanban_cards | idx_kanban_cards_priority | `CREATE INDEX idx_kanban_cards_priority ON public.kanban_cards USING btree (pr...` |
| kanban_cards | idx_kanban_cards_project | `CREATE INDEX idx_kanban_cards_project ON public.kanban_cards USING btree (pro...` |
| kanban_checklist_items | idx_kanban_checklist_items_checklist | `CREATE INDEX idx_kanban_checklist_items_checklist ON public.kanban_checklist_...` |
| kanban_checklist_items | idx_kanban_checklist_items_incomplete | `CREATE INDEX idx_kanban_checklist_items_incomplete ON public.kanban_checklist...` |
| kanban_checklists | idx_kanban_checklists_card | `CREATE INDEX idx_kanban_checklists_card ON public.kanban_checklists USING btr...` |
| kanban_labels | idx_kanban_labels_org | `CREATE INDEX idx_kanban_labels_org ON public.kanban_labels USING btree (organ...` |
| kanban_labels | kanban_labels_name_org_unique | `CREATE UNIQUE INDEX kanban_labels_name_org_unique ON public.kanban_labels USI...` |
| kanban_lists | idx_kanban_lists_active | `CREATE INDEX idx_kanban_lists_active ON public.kanban_lists USING btree (boar...` |
| kanban_lists | idx_kanban_lists_org | `CREATE INDEX idx_kanban_lists_org ON public.kanban_lists USING btree (organiz...` |
| labor_categories | labor_categories_id_key | `CREATE UNIQUE INDEX labor_categories_id_key ON public.labor_categories USING ...` |
| labor_categories | labor_categories_system_name_unique | `CREATE UNIQUE INDEX labor_categories_system_name_unique ON public.labor_categ...` |
| labor_payments | idx_labor_payments_date | `CREATE INDEX idx_labor_payments_date ON public.labor_payments USING btree (pa...` |
| labor_payments | idx_labor_payments_import_batch_id | `CREATE INDEX idx_labor_payments_import_batch_id ON public.labor_payments USIN...` |
| labor_payments | idx_labor_payments_labor | `CREATE INDEX idx_labor_payments_labor ON public.labor_payments USING btree (l...` |
| labor_payments | idx_labor_payments_not_deleted | `CREATE INDEX idx_labor_payments_not_deleted ON public.labor_payments USING bt...` |
| labor_payments | idx_labor_payments_org_project | `CREATE INDEX idx_labor_payments_org_project ON public.labor_payments USING bt...` |
| labor_payments | idx_labor_payments_view_org | `CREATE INDEX idx_labor_payments_view_org ON public.labor_payments USING btree...` |
| labor_payments | idx_labor_payments_view_project | `CREATE INDEX idx_labor_payments_view_project ON public.labor_payments USING b...` |
| labor_prices | labor_prices_type_org_idx | `CREATE INDEX labor_prices_type_org_idx ON public.labor_prices USING btree (la...` |
| linked_accounts | linked_accounts_auth_id_key | `CREATE UNIQUE INDEX linked_accounts_auth_id_key ON public.linked_accounts USI...` |
| material_categories | material_categories_unique_name | `CREATE UNIQUE INDEX material_categories_unique_name ON public.material_catego...` |
| material_invoice_items | idx_material_invoice_items_material | `CREATE INDEX idx_material_invoice_items_material ON public.material_invoice_i...` |
| material_invoice_items | material_purchase_items_org_idx | `CREATE INDEX material_purchase_items_org_idx ON public.material_invoice_items...` |
| material_invoice_items | material_purchase_items_org_project_idx | `CREATE INDEX material_purchase_items_org_project_idx ON public.material_invoi...` |
| material_invoice_items | material_purchase_items_project_idx | `CREATE INDEX material_purchase_items_project_idx ON public.material_invoice_i...` |
| material_invoices | idx_material_invoices_po | `CREATE INDEX idx_material_invoices_po ON public.material_invoices USING btree...` |
| material_payments | idx_material_payments_import_batch | `CREATE INDEX idx_material_payments_import_batch ON public.material_payments U...` |
| material_payments | idx_material_payments_material_type | `CREATE INDEX idx_material_payments_material_type ON public.material_payments ...` |
| material_payments | idx_material_payments_not_deleted | `CREATE INDEX idx_material_payments_not_deleted ON public.material_payments US...` |
| material_payments | idx_material_payments_type | `CREATE INDEX idx_material_payments_type ON public.material_payments USING btr...` |
| material_payments | material_payments_organization_id_payment_date_idx | `CREATE INDEX material_payments_organization_id_payment_date_idx ON public.mat...` |
| material_payments | material_payments_organization_id_project_id_idx | `CREATE INDEX material_payments_organization_id_project_id_idx ON public.mater...` |
| material_payments | material_payments_payment_date_idx | `CREATE INDEX material_payments_payment_date_idx ON public.material_payments U...` |
| material_payments | material_payments_project_id_payment_date_idx | `CREATE INDEX material_payments_project_id_payment_date_idx ON public.material...` |
| material_prices | material_prices_material_org_idx | `CREATE INDEX material_prices_material_org_idx ON public.material_prices USING...` |
| material_purchase_order_items | idx_mpo_items_material | `CREATE INDEX idx_mpo_items_material ON public.material_purchase_order_items U...` |
| material_types | idx_material_types_list | `CREATE INDEX idx_material_types_list ON public.material_types USING btree (is...` |
| material_types | uq_material_types_org_name | `CREATE UNIQUE INDEX uq_material_types_org_name ON public.material_types USING...` |
| material_types | uq_material_types_system_name | `CREATE UNIQUE INDEX uq_material_types_system_name ON public.material_types US...` |
| materials | idx_materials_code_org | `CREATE INDEX idx_materials_code_org ON public.materials USING btree (code, or...` |
| materials | idx_materials_default_provider | `CREATE INDEX idx_materials_default_provider ON public.materials USING btree (...` |
| materials | idx_materials_import_batch | `CREATE INDEX idx_materials_import_batch ON public.materials USING btree (impo...` |
| materials | idx_materials_is_deleted | `CREATE INDEX idx_materials_is_deleted ON public.materials USING btree (is_del...` |
| materials | idx_materials_org_deleted | `CREATE INDEX idx_materials_org_deleted ON public.materials USING btree (organ...` |
| materials | materials_id_key | `CREATE UNIQUE INDEX materials_id_key ON public.materials USING btree (id)` |
| materials | materials_name_org_unique | `CREATE UNIQUE INDEX materials_name_org_unique ON public.materials USING btree...` |
| materials | materials_name_system_unique | `CREATE UNIQUE INDEX materials_name_system_unique ON public.materials USING bt...` |
| media_file_folders | idx_media_file_folders_organization_id | `CREATE INDEX idx_media_file_folders_organization_id ON public.media_file_fold...` |
| media_file_folders | idx_media_file_folders_parent_id | `CREATE INDEX idx_media_file_folders_parent_id ON public.media_file_folders US...` |
| media_file_folders | idx_media_file_folders_project_id | `CREATE INDEX idx_media_file_folders_project_id ON public.media_file_folders U...` |
| media_links | idx_media_links_client_payment | `CREATE INDEX idx_media_links_client_payment ON public.media_links USING btree...` |
| media_links | idx_media_links_contact | `CREATE INDEX idx_media_links_contact ON public.media_links USING btree (conta...` |
| media_links | idx_media_links_course | `CREATE INDEX idx_media_links_course ON public.media_links USING btree (course...` |
| media_links | idx_media_links_created_by | `CREATE INDEX idx_media_links_created_by ON public.media_links USING btree (cr...` |
| media_links | idx_media_links_folder | `CREATE INDEX idx_media_links_folder ON public.media_links USING btree (folder...` |
| media_links | idx_media_links_forum_thread | `CREATE INDEX idx_media_links_forum_thread ON public.media_links USING btree (...` |
| media_links | idx_media_links_is_public | `CREATE INDEX idx_media_links_is_public ON public.media_links USING btree (is_...` |
| media_links | idx_media_links_media_file | `CREATE INDEX idx_media_links_media_file ON public.media_links USING btree (me...` |
| media_links | idx_media_links_partner_contribution | `CREATE INDEX idx_media_links_partner_contribution ON public.media_links USING...` |
| media_links | idx_media_links_partner_withdrawal | `CREATE INDEX idx_media_links_partner_withdrawal ON public.media_links USING b...` |
| media_links | idx_media_links_personnel_payment | `CREATE INDEX idx_media_links_personnel_payment ON public.media_links USING bt...` |
| media_links | idx_media_links_pin | `CREATE INDEX idx_media_links_pin ON public.media_links USING btree (pin_id) W...` |
| media_links | idx_media_links_project | `CREATE INDEX idx_media_links_project ON public.media_links USING btree (proje...` |
| media_links | idx_media_links_sitelog | `CREATE INDEX idx_media_links_sitelog ON public.media_links USING btree (site_...` |
| media_links | idx_media_links_subcontract_payment | `CREATE INDEX idx_media_links_subcontract_payment ON public.media_links USING ...` |
| media_links | idx_media_links_testimonial | `CREATE INDEX idx_media_links_testimonial ON public.media_links USING btree (t...` |
| movement_indirects | movement_indirects_movement_id_key | `CREATE UNIQUE INDEX movement_indirects_movement_id_key ON public.movement_ind...` |
| movements | movements_id_key | `CREATE UNIQUE INDEX movements_id_key ON public.movements USING btree (id)` |
| mp_preferences | idx_mp_preferences_org | `CREATE INDEX idx_mp_preferences_org ON public.mp_preferences USING btree (org...` |
| mp_preferences | idx_mp_preferences_status | `CREATE INDEX idx_mp_preferences_status ON public.mp_preferences USING btree (...` |
| mp_preferences | idx_mp_preferences_user | `CREATE INDEX idx_mp_preferences_user ON public.mp_preferences USING btree (us...` |
| notifications | notifications_audience_idx | `CREATE INDEX notifications_audience_idx ON public.notifications USING btree (...` |
| notifications | notifications_created_at_idx | `CREATE INDEX notifications_created_at_idx ON public.notifications USING btree...` |
| notifications | notifications_org_id_idx | `CREATE INDEX notifications_org_id_idx ON public.notifications USING btree (or...` |
| ops_alerts | idx_ops_alerts_org | `CREATE INDEX idx_ops_alerts_org ON public.ops_alerts USING btree (organizatio...` |
| ops_alerts | idx_ops_alerts_status | `CREATE INDEX idx_ops_alerts_status ON public.ops_alerts USING btree (status, ...` |
| ops_alerts | ux_ops_alerts_fingerprint_open | `CREATE UNIQUE INDEX ux_ops_alerts_fingerprint_open ON public.ops_alerts USING...` |
| ops_check_runs | idx_ops_check_runs_created_at | `CREATE INDEX idx_ops_check_runs_created_at ON public.ops_check_runs USING btr...` |
| ops_repair_actions | idx_ops_repair_actions_alert_type | `CREATE INDEX idx_ops_repair_actions_alert_type ON public.ops_repair_actions U...` |
| ops_repair_logs | idx_ops_repair_logs_alert_id | `CREATE INDEX idx_ops_repair_logs_alert_id ON public.ops_repair_logs USING btr...` |
| ops_repair_logs | idx_ops_repair_logs_created_at | `CREATE INDEX idx_ops_repair_logs_created_at ON public.ops_repair_logs USING b...` |
| organization_activity_logs | idx_org_activity_logs_created_at | `CREATE INDEX idx_org_activity_logs_created_at ON public.organization_activity...` |
| organization_activity_logs | idx_org_activity_logs_member_id | `CREATE INDEX idx_org_activity_logs_member_id ON public.organization_activity_...` |
| organization_activity_logs | idx_org_activity_logs_org_id | `CREATE INDEX idx_org_activity_logs_org_id ON public.organization_activity_log...` |
| organization_activity_logs | idx_org_activity_logs_target | `CREATE INDEX idx_org_activity_logs_target ON public.organization_activity_log...` |
| organization_billing_cycles | idx_billing_cycles_org | `CREATE INDEX idx_billing_cycles_org ON public.organization_billing_cycles USI...` |
| organization_billing_cycles | idx_billing_cycles_period | `CREATE INDEX idx_billing_cycles_period ON public.organization_billing_cycles ...` |
| organization_billing_cycles | idx_billing_cycles_status | `CREATE INDEX idx_billing_cycles_status ON public.organization_billing_cycles ...` |
| organization_billing_cycles | idx_billing_cycles_subscription | `CREATE INDEX idx_billing_cycles_subscription ON public.organization_billing_c...` |
| organization_currencies | unique_org_currency | `CREATE UNIQUE INDEX unique_org_currency ON public.organization_currencies USI...` |
| organization_data | organization_data_city_idx | `CREATE INDEX organization_data_city_idx ON public.organization_data USING btr...` |
| organization_data | organization_data_country_idx | `CREATE INDEX organization_data_country_idx ON public.organization_data USING ...` |
| organization_data | organization_data_organization_id_key | `CREATE UNIQUE INDEX organization_data_organization_id_key ON public.organizat...` |
| organization_external_actors | idx_external_actors_org_user | `CREATE INDEX idx_external_actors_org_user ON public.organization_external_act...` |
| organization_external_actors | idx_oea_actor_type | `CREATE INDEX idx_oea_actor_type ON public.organization_external_actors USING ...` |
| organization_external_actors | idx_oea_organization | `CREATE INDEX idx_oea_organization ON public.organization_external_actors USIN...` |
| organization_external_actors | idx_oea_user | `CREATE INDEX idx_oea_user ON public.organization_external_actors USING btree ...` |
| organization_external_actors | oea_unique_org_user | `CREATE UNIQUE INDEX oea_unique_org_user ON public.organization_external_actor...` |
| organization_invitations | organization_invitations_email_idx | `CREATE INDEX organization_invitations_email_idx ON public.organization_invita...` |
| organization_invitations | organization_invitations_email_org_unique | `CREATE UNIQUE INDEX organization_invitations_email_org_unique ON public.organ...` |
| organization_invitations | organization_invitations_organization_id_idx | `CREATE INDEX organization_invitations_organization_id_idx ON public.organizat...` |
| organization_material_prices | unique_org_material | `CREATE UNIQUE INDEX unique_org_material ON public.organization_material_price...` |
| organization_member_events | idx_member_events_date | `CREATE INDEX idx_member_events_date ON public.organization_member_events USIN...` |
| organization_member_events | idx_member_events_member | `CREATE INDEX idx_member_events_member ON public.organization_member_events US...` |
| organization_member_events | idx_member_events_org | `CREATE INDEX idx_member_events_org ON public.organization_member_events USING...` |
| organization_member_events | idx_member_events_subscription | `CREATE INDEX idx_member_events_subscription ON public.organization_member_eve...` |
| organization_member_events | idx_member_events_type | `CREATE INDEX idx_member_events_type ON public.organization_member_events USIN...` |
| organization_members | idx_org_members_created_by | `CREATE INDEX idx_org_members_created_by ON public.organization_members USING ...` |
| organization_members | idx_org_members_org_user | `CREATE INDEX idx_org_members_org_user ON public.organization_members USING bt...` |
| organization_members | idx_org_members_updated_by | `CREATE INDEX idx_org_members_updated_by ON public.organization_members USING ...` |
| organization_members | org_members_over_limit_idx | `CREATE INDEX org_members_over_limit_idx ON public.organization_members USING ...` |
| organization_members | organization_members_idd_key | `CREATE UNIQUE INDEX organization_members_idd_key ON public.organization_membe...` |
| organization_members | organization_members_organization_id_idx | `CREATE INDEX organization_members_organization_id_idx ON public.organization_...` |
| organization_members | organization_members_user_id_idx | `CREATE INDEX organization_members_user_id_idx ON public.organization_members ...` |
| organization_members | unique_user_per_organization | `CREATE UNIQUE INDEX unique_user_per_organization ON public.organization_membe...` |
| organization_preferences | unique_organization_preferences | `CREATE UNIQUE INDEX unique_organization_preferences ON public.organization_pr...` |
| organization_recipe_preferences | idx_org_recipe_prefs_org | `CREATE INDEX idx_org_recipe_prefs_org ON public.organization_recipe_preferenc...` |
| organization_recipe_preferences | idx_org_recipe_prefs_recipe | `CREATE INDEX idx_org_recipe_prefs_recipe ON public.organization_recipe_prefer...` |
| organization_recipe_preferences | org_recipe_prefs_unique | `CREATE UNIQUE INDEX org_recipe_prefs_unique ON public.organization_recipe_pre...` |
| organization_subscriptions | idx_org_subs_scheduled_downgrade | `CREATE INDEX idx_org_subs_scheduled_downgrade ON public.organization_subscrip...` |
| organization_subscriptions | idx_org_subscriptions_coupon | `CREATE INDEX idx_org_subscriptions_coupon ON public.organization_subscription...` |
| organization_subscriptions | org_subscriptions_unique_active | `CREATE UNIQUE INDEX org_subscriptions_unique_active ON public.organization_su...` |
| organization_task_prices | org_task_price_unique | `CREATE UNIQUE INDEX org_task_price_unique ON public.organization_task_prices ...` |
| organization_task_prices | org_task_prices_org_idx | `CREATE INDEX org_task_prices_org_idx ON public.organization_task_prices USING...` |
| organization_task_prices | org_task_prices_task_idx | `CREATE INDEX org_task_prices_task_idx ON public.organization_task_prices USIN...` |
| organization_wallets | org_wallets_org_default_uniq | `CREATE UNIQUE INDEX org_wallets_org_default_uniq ON public.organization_walle...` |
| organization_wallets | org_wallets_org_idx | `CREATE INDEX org_wallets_org_idx ON public.organization_wallets USING btree (...` |
| organization_wallets | org_wallets_org_wallet_uniq | `CREATE UNIQUE INDEX org_wallets_org_wallet_uniq ON public.organization_wallet...` |
| organization_wallets | org_wallets_wallet_idx | `CREATE INDEX org_wallets_wallet_idx ON public.organization_wallets USING btre...` |
| organizations | idx_organizations_active_not_deleted | `CREATE INDEX idx_organizations_active_not_deleted ON public.organizations USI...` |
| organizations | idx_organizations_plan | `CREATE INDEX idx_organizations_plan ON public.organizations USING btree (plan...` |
| organizations | idx_organizations_updated_at | `CREATE INDEX idx_organizations_updated_at ON public.organizations USING btree...` |
| organizations | organizations_id_key | `CREATE UNIQUE INDEX organizations_id_key ON public.organizations USING btree ...` |
| partner_capital_balance | partner_capital_balance_unique | `CREATE UNIQUE INDEX partner_capital_balance_unique ON public.partner_capital_...` |
| partner_contributions | idx_partner_contributions_date | `CREATE INDEX idx_partner_contributions_date ON public.partner_contributions U...` |
| partner_contributions | idx_partner_contributions_not_deleted | `CREATE INDEX idx_partner_contributions_not_deleted ON public.partner_contribu...` |
| partner_contributions | idx_partner_contributions_org_project | `CREATE INDEX idx_partner_contributions_org_project ON public.partner_contribu...` |
| partner_contributions | idx_partner_contributions_partner | `CREATE INDEX idx_partner_contributions_partner ON public.partner_contribution...` |
| partner_contributions | idx_partner_contributions_view_org | `CREATE INDEX idx_partner_contributions_view_org ON public.partner_contributio...` |
| partner_contributions | idx_partner_contributions_view_project | `CREATE INDEX idx_partner_contributions_view_project ON public.partner_contrib...` |
| partner_withdrawals | idx_partner_withdrawals_date | `CREATE INDEX idx_partner_withdrawals_date ON public.partner_withdrawals USING...` |
| partner_withdrawals | idx_partner_withdrawals_not_deleted | `CREATE INDEX idx_partner_withdrawals_not_deleted ON public.partner_withdrawal...` |
| partner_withdrawals | idx_partner_withdrawals_org_project | `CREATE INDEX idx_partner_withdrawals_org_project ON public.partner_withdrawal...` |
| partner_withdrawals | idx_partner_withdrawals_partner | `CREATE INDEX idx_partner_withdrawals_partner ON public.partner_withdrawals US...` |
| partner_withdrawals | idx_partner_withdrawals_view_org | `CREATE INDEX idx_partner_withdrawals_view_org ON public.partner_withdrawals U...` |
| partner_withdrawals | idx_partner_withdrawals_view_project | `CREATE INDEX idx_partner_withdrawals_view_project ON public.partner_withdrawa...` |
| payment_events | idx_payment_events_custom_id | `CREATE INDEX idx_payment_events_custom_id ON public.payment_events USING btre...` |
| payment_events | idx_payment_events_order_id | `CREATE INDEX idx_payment_events_order_id ON public.payment_events USING btree...` |
| payment_events | idx_payment_events_provider | `CREATE INDEX idx_payment_events_provider ON public.payment_events USING btree...` |
| payments | idx_payments_course | `CREATE INDEX idx_payments_course ON public.payments USING btree (course_id)` |
| payments | idx_payments_user | `CREATE INDEX idx_payments_user ON public.payments USING btree (user_id)` |
| payments | payments_provider_payment_unique | `CREATE UNIQUE INDEX payments_provider_payment_unique ON public.payments USING...` |
| paypal_preferences | idx_paypal_preferences_order | `CREATE INDEX idx_paypal_preferences_order ON public.paypal_preferences USING ...` |
| paypal_preferences | idx_paypal_preferences_org | `CREATE INDEX idx_paypal_preferences_org ON public.paypal_preferences USING bt...` |
| paypal_preferences | idx_paypal_preferences_status | `CREATE INDEX idx_paypal_preferences_status ON public.paypal_preferences USING...` |
| paypal_preferences | idx_paypal_preferences_user | `CREATE INDEX idx_paypal_preferences_user ON public.paypal_preferences USING b...` |
| permissions | permissions_key_key | `CREATE UNIQUE INDEX permissions_key_key ON public.permissions USING btree (key)` |
| personnel_rates | idx_personnel_rates_is_active | `CREATE INDEX idx_personnel_rates_is_active ON public.personnel_rates USING bt...` |
| personnel_rates | idx_personnel_rates_labor_type | `CREATE INDEX idx_personnel_rates_labor_type ON public.personnel_rates USING b...` |
| personnel_rates | idx_personnel_rates_org | `CREATE INDEX idx_personnel_rates_org ON public.personnel_rates USING btree (o...` |
| personnel_rates | idx_personnel_rates_personnel | `CREATE INDEX idx_personnel_rates_personnel ON public.personnel_rates USING bt...` |
| personnel_rates | idx_personnel_rates_validity | `CREATE INDEX idx_personnel_rates_validity ON public.personnel_rates USING btr...` |
| pin_board_items | idx_pin_board_items_board | `CREATE INDEX idx_pin_board_items_board ON public.pin_board_items USING btree ...` |
| pin_board_items | idx_pin_board_items_pin | `CREATE INDEX idx_pin_board_items_pin ON public.pin_board_items USING btree (p...` |
| pin_board_items | pin_board_items_unique | `CREATE UNIQUE INDEX pin_board_items_unique ON public.pin_board_items USING bt...` |
| pin_boards | idx_pin_boards_organization | `CREATE INDEX idx_pin_boards_organization ON public.pin_boards USING btree (or...` |
| pin_boards | idx_pin_boards_project | `CREATE INDEX idx_pin_boards_project ON public.pin_boards USING btree (project...` |
| pins | idx_pins_media_file | `CREATE INDEX idx_pins_media_file ON public.pins USING btree (media_file_id) W...` |
| pins | idx_pins_organization | `CREATE INDEX idx_pins_organization ON public.pins USING btree (organization_i...` |
| pins | idx_pins_project | `CREATE INDEX idx_pins_project ON public.pins USING btree (project_id) WHERE (...` |
| plans | plans_name_key | `CREATE UNIQUE INDEX plans_name_key ON public.plans USING btree (name)` |
| product_avg_prices | product_avg_prices_product_id_idx | `CREATE UNIQUE INDEX product_avg_prices_product_id_idx ON public.product_avg_p...` |
| project_access | idx_project_access_lookup | `CREATE INDEX idx_project_access_lookup ON public.project_access USING btree (...` |
| project_access | idx_project_access_user | `CREATE INDEX idx_project_access_user ON public.project_access USING btree (us...` |
| project_access | project_access_project_id_user_id_key | `CREATE UNIQUE INDEX project_access_project_id_user_id_key ON public.project_a...` |
| project_clients | idx_project_clients_client | `CREATE INDEX idx_project_clients_client ON public.project_clients USING btree...` |
| project_clients | idx_project_clients_created_at | `CREATE INDEX idx_project_clients_created_at ON public.project_clients USING b...` |
| project_clients | idx_project_clients_is_primary | `CREATE INDEX idx_project_clients_is_primary ON public.project_clients USING b...` |
| project_clients | idx_project_clients_org_project | `CREATE INDEX idx_project_clients_org_project ON public.project_clients USING ...` |
| project_clients | idx_project_clients_project | `CREATE INDEX idx_project_clients_project ON public.project_clients USING btre...` |
| project_clients | uniq_project_client | `CREATE UNIQUE INDEX uniq_project_client ON public.project_clients USING btree...` |
| project_data | project_data_city_idx | `CREATE INDEX project_data_city_idx ON public.project_data USING btree (city)` |
| project_data | project_data_org_idx | `CREATE INDEX project_data_org_idx ON public.project_data USING btree (organiz...` |
| project_data | project_data_org_project_idx | `CREATE INDEX project_data_org_project_idx ON public.project_data USING btree ...` |
| project_data | project_data_zip_idx | `CREATE INDEX project_data_zip_idx ON public.project_data USING btree (zip_code)` |
| project_labor | idx_project_labor_contact_id | `CREATE INDEX idx_project_labor_contact_id ON public.project_labor USING btree...` |
| project_labor | idx_project_labor_is_deleted | `CREATE INDEX idx_project_labor_is_deleted ON public.project_labor USING btree...` |
| project_labor | idx_project_labor_labor_type_id | `CREATE INDEX idx_project_labor_labor_type_id ON public.project_labor USING bt...` |
| project_labor | idx_project_labor_organization_id | `CREATE INDEX idx_project_labor_organization_id ON public.project_labor USING ...` |
| project_labor | idx_project_labor_project_id | `CREATE INDEX idx_project_labor_project_id ON public.project_labor USING btree...` |
| project_labor | idx_project_labor_status | `CREATE INDEX idx_project_labor_status ON public.project_labor USING btree (st...` |
| project_modalities | project_modalities_not_deleted_idx | `CREATE INDEX project_modalities_not_deleted_idx ON public.project_modalities ...` |
| project_modalities | project_modalities_org_idx | `CREATE INDEX project_modalities_org_idx ON public.project_modalities USING bt...` |
| project_modalities | project_modalities_org_name_active_uniq | `CREATE UNIQUE INDEX project_modalities_org_name_active_uniq ON public.project...` |
| project_modalities | project_modalities_system_name_active_uniq | `CREATE UNIQUE INDEX project_modalities_system_name_active_uniq ON public.proj...` |
| project_settings | idx_project_settings_organization_id | `CREATE INDEX idx_project_settings_organization_id ON public.project_settings ...` |
| project_settings | idx_project_settings_project_id | `CREATE INDEX idx_project_settings_project_id ON public.project_settings USING...` |
| project_settings | project_settings_project_id_unique | `CREATE UNIQUE INDEX project_settings_project_id_unique ON public.project_sett...` |
| project_types | project_types_not_deleted_idx | `CREATE INDEX project_types_not_deleted_idx ON public.project_types USING btre...` |
| project_types | project_types_org_idx | `CREATE INDEX project_types_org_idx ON public.project_types USING btree (organ...` |
| project_types | project_types_org_name_active_uniq | `CREATE UNIQUE INDEX project_types_org_name_active_uniq ON public.project_type...` |
| project_types | project_types_system_name_active_uniq | `CREATE UNIQUE INDEX project_types_system_name_active_uniq ON public.project_t...` |
| projects | idx_projects_code | `CREATE INDEX idx_projects_code ON public.projects USING btree (code)` |
| projects | idx_projects_org_status_active | `CREATE INDEX idx_projects_org_status_active ON public.projects USING btree (o...` |
| projects | projects_created_at_idx | `CREATE INDEX projects_created_at_idx ON public.projects USING btree (created_at)` |
| projects | projects_created_by_idx | `CREATE INDEX projects_created_by_idx ON public.projects USING btree (created_by)` |
| projects | projects_id_key | `CREATE UNIQUE INDEX projects_id_key ON public.projects USING btree (id)` |
| projects | projects_modality_idx | `CREATE INDEX projects_modality_idx ON public.projects USING btree (project_mo...` |
| projects | projects_org_active_idx | `CREATE INDEX projects_org_active_idx ON public.projects USING btree (organiza...` |
| projects | projects_org_code_uniq | `CREATE UNIQUE INDEX projects_org_code_uniq ON public.projects USING btree (or...` |
| projects | projects_org_idx | `CREATE INDEX projects_org_idx ON public.projects USING btree (organization_id)` |
| projects | projects_org_name_lower_uniq | `CREATE UNIQUE INDEX projects_org_name_lower_uniq ON public.projects USING btr...` |
| projects | projects_over_limit_idx | `CREATE INDEX projects_over_limit_idx ON public.projects USING btree (organiza...` |
| projects | projects_type_idx | `CREATE INDEX projects_type_idx ON public.projects USING btree (project_type_id)` |
| provider_products | provider_products_organization_id_product_id_key | `CREATE UNIQUE INDEX provider_products_organization_id_product_id_key ON publi...` |
| push_subscriptions | idx_push_subscriptions_user_id | `CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions USIN...` |
| push_subscriptions | push_subscriptions_user_endpoint_key | `CREATE UNIQUE INDEX push_subscriptions_user_endpoint_key ON public.push_subsc...` |
| quote_items | idx_quote_items_not_deleted | `CREATE INDEX idx_quote_items_not_deleted ON public.quote_items USING btree (i...` |
| quote_items | idx_quote_items_sort | `CREATE INDEX idx_quote_items_sort ON public.quote_items USING btree (quote_id...` |
| quote_items | idx_quote_items_updated_by | `CREATE INDEX idx_quote_items_updated_by ON public.quote_items USING btree (up...` |
| quote_items | quote_items_id_key | `CREATE UNIQUE INDEX quote_items_id_key ON public.quote_items USING btree (id)` |
| quotes | idx_quotes_client | `CREATE INDEX idx_quotes_client ON public.quotes USING btree (client_id)` |
| quotes | idx_quotes_created | `CREATE INDEX idx_quotes_created ON public.quotes USING btree (created_by)` |
| quotes | idx_quotes_not_deleted | `CREATE INDEX idx_quotes_not_deleted ON public.quotes USING btree (is_deleted)...` |
| quotes | idx_quotes_org | `CREATE INDEX idx_quotes_org ON public.quotes USING btree (organization_id)` |
| quotes | idx_quotes_org_active | `CREATE INDEX idx_quotes_org_active ON public.quotes USING btree (organization...` |
| quotes | idx_quotes_parent_quote | `CREATE INDEX idx_quotes_parent_quote ON public.quotes USING btree (parent_quo...` |
| quotes | idx_quotes_project | `CREATE INDEX idx_quotes_project ON public.quotes USING btree (project_id)` |
| quotes | idx_quotes_status | `CREATE INDEX idx_quotes_status ON public.quotes USING btree (status)` |
| quotes | idx_quotes_type | `CREATE INDEX idx_quotes_type ON public.quotes USING btree (quote_type)` |
| quotes | idx_quotes_updated_by | `CREATE INDEX idx_quotes_updated_by ON public.quotes USING btree (updated_by)` |
| quotes | ux_quotes_project_name_version | `CREATE UNIQUE INDEX ux_quotes_project_name_version ON public.quotes USING btr...` |
| role_permissions | idx_role_permissions_organization_id | `CREATE INDEX idx_role_permissions_organization_id ON public.role_permissions ...` |
| role_permissions | idx_role_permissions_permission_id | `CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions US...` |
| role_permissions | idx_role_permissions_role_id | `CREATE INDEX idx_role_permissions_role_id ON public.role_permissions USING bt...` |
| role_permissions | role_permissions_role_id_permission_id_key | `CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON public.role...` |
| roles | idx_roles_organization_id | `CREATE INDEX idx_roles_organization_id ON public.roles USING btree (organizat...` |
| roles | roles_unique_name_per_org | `CREATE UNIQUE INDEX roles_unique_name_per_org ON public.roles USING btree (or...` |
| signatures | idx_signatures_document | `CREATE INDEX idx_signatures_document ON public.signatures USING btree (docume...` |
| signatures | idx_signatures_org | `CREATE INDEX idx_signatures_org ON public.signatures USING btree (organizatio...` |
| site_log_types | site_log_types_not_deleted_idx | `CREATE INDEX site_log_types_not_deleted_idx ON public.site_log_types USING bt...` |
| site_log_types | site_log_types_org_idx | `CREATE INDEX site_log_types_org_idx ON public.site_log_types USING btree (org...` |
| site_log_types | site_log_types_org_name_uniq | `CREATE UNIQUE INDEX site_log_types_org_name_uniq ON public.site_log_types USI...` |
| site_log_types | site_log_types_org_not_deleted_idx | `CREATE INDEX site_log_types_org_not_deleted_idx ON public.site_log_types USIN...` |
| site_log_types | site_log_types_system_idx | `CREATE INDEX site_log_types_system_idx ON public.site_log_types USING btree (...` |
| site_log_types | site_log_types_system_name_uniq | `CREATE UNIQUE INDEX site_log_types_system_name_uniq ON public.site_log_types ...` |
| site_logs | site_logs_ai_analyzed_idx | `CREATE INDEX site_logs_ai_analyzed_idx ON public.site_logs USING btree (ai_an...` |
| site_logs | site_logs_ai_full_idx | `CREATE INDEX site_logs_ai_full_idx ON public.site_logs USING btree (organizat...` |
| site_logs | site_logs_created_by_idx | `CREATE INDEX site_logs_created_by_idx ON public.site_logs USING btree (create...` |
| site_logs | site_logs_date_idx | `CREATE INDEX site_logs_date_idx ON public.site_logs USING btree (log_date DESC)` |
| site_logs | site_logs_favorite_idx | `CREATE INDEX site_logs_favorite_idx ON public.site_logs USING btree (is_favor...` |
| site_logs | site_logs_not_deleted_date_idx | `CREATE INDEX site_logs_not_deleted_date_idx ON public.site_logs USING btree (...` |
| site_logs | site_logs_not_deleted_pub_idx | `CREATE INDEX site_logs_not_deleted_pub_idx ON public.site_logs USING btree (i...` |
| site_logs | site_logs_org_idx | `CREATE INDEX site_logs_org_idx ON public.site_logs USING btree (organization_id)` |
| site_logs | site_logs_org_project_date_idx | `CREATE INDEX site_logs_org_project_date_idx ON public.site_logs USING btree (...` |
| site_logs | site_logs_project_idx | `CREATE INDEX site_logs_project_idx ON public.site_logs USING btree (project_id)` |
| site_logs | site_logs_public_idx | `CREATE INDEX site_logs_public_idx ON public.site_logs USING btree (is_public)` |
| site_logs | site_logs_status_idx | `CREATE INDEX site_logs_status_idx ON public.site_logs USING btree (status)` |
| subcontract_payments | idx_subcontract_payments_date | `CREATE INDEX idx_subcontract_payments_date ON public.subcontract_payments USI...` |
| subcontract_payments | idx_subcontract_payments_import_batch_id | `CREATE INDEX idx_subcontract_payments_import_batch_id ON public.subcontract_p...` |
| subcontract_payments | idx_subcontract_payments_is_deleted | `CREATE INDEX idx_subcontract_payments_is_deleted ON public.subcontract_paymen...` |
| subcontract_payments | idx_subcontract_payments_org_project | `CREATE INDEX idx_subcontract_payments_org_project ON public.subcontract_payme...` |
| subcontract_payments | idx_subcontract_payments_subcontract | `CREATE INDEX idx_subcontract_payments_subcontract ON public.subcontract_payme...` |
| subcontract_payments | idx_subcontract_payments_view_org | `CREATE INDEX idx_subcontract_payments_view_org ON public.subcontract_payments...` |
| subcontract_payments | idx_subcontract_payments_view_project | `CREATE INDEX idx_subcontract_payments_view_project ON public.subcontract_paym...` |
| subcontracts | idx_subcontracts_contact | `CREATE INDEX idx_subcontracts_contact ON public.subcontracts USING btree (con...` |
| subcontracts | idx_subcontracts_currency | `CREATE INDEX idx_subcontracts_currency ON public.subcontracts USING btree (cu...` |
| subcontracts | idx_subcontracts_organization | `CREATE INDEX idx_subcontracts_organization ON public.subcontracts USING btree...` |
| subcontracts | idx_subcontracts_project | `CREATE INDEX idx_subcontracts_project ON public.subcontracts USING btree (pro...` |
| subcontracts | idx_subcontracts_status | `CREATE INDEX idx_subcontracts_status ON public.subcontracts USING btree (status)` |
| subscription_notifications_log | subscription_notifications_lo_subscription_id_notification__key | `CREATE UNIQUE INDEX subscription_notifications_lo_subscription_id_notificatio...` |
| support_messages | idx_support_messages_read_by_admin | `CREATE INDEX idx_support_messages_read_by_admin ON public.support_messages US...` |
| support_messages | idx_support_messages_read_by_user | `CREATE INDEX idx_support_messages_read_by_user ON public.support_messages USI...` |
| support_messages | idx_support_messages_unread_user | `CREATE INDEX idx_support_messages_unread_user ON public.support_messages USIN...` |
| system_error_logs | idx_system_error_logs_created | `CREATE INDEX idx_system_error_logs_created ON public.system_error_logs USING ...` |
| system_error_logs | idx_system_error_logs_domain | `CREATE INDEX idx_system_error_logs_domain ON public.system_error_logs USING b...` |
| system_error_logs | idx_system_error_logs_severity | `CREATE INDEX idx_system_error_logs_severity ON public.system_error_logs USING...` |
| task_actions | task_kind_name_key | `CREATE UNIQUE INDEX task_kind_name_key ON public.task_actions USING btree (name)` |
| task_construction_systems | task_construction_systems_name_key | `CREATE UNIQUE INDEX task_construction_systems_name_key ON public.task_constru...` |
| task_construction_systems | task_construction_systems_slug_key | `CREATE UNIQUE INDEX task_construction_systems_slug_key ON public.task_constru...` |
| task_divisions | idx_task_divisions_import_batch_id | `CREATE INDEX idx_task_divisions_import_batch_id ON public.task_divisions USIN...` |
| task_divisions | idx_task_divisions_not_deleted | `CREATE INDEX idx_task_divisions_not_deleted ON public.task_divisions USING bt...` |
| task_divisions | idx_task_divisions_org | `CREATE INDEX idx_task_divisions_org ON public.task_divisions USING btree (org...` |
| task_elements | idx_task_elements_not_deleted | `CREATE INDEX idx_task_elements_not_deleted ON public.task_elements USING btre...` |
| task_elements | task_elements_slug_uniq | `CREATE UNIQUE INDEX task_elements_slug_uniq ON public.task_elements USING btr...` |
| task_parameter_options | idx_task_parameter_options_not_deleted | `CREATE INDEX idx_task_parameter_options_not_deleted ON public.task_parameter_...` |
| task_parameter_options | idx_task_parameter_options_parameter_id | `CREATE INDEX idx_task_parameter_options_parameter_id ON public.task_parameter...` |
| task_parameters | idx_task_parameters_not_deleted | `CREATE INDEX idx_task_parameters_not_deleted ON public.task_parameters USING ...` |
| task_parameters | idx_task_parameters_slug_unique | `CREATE UNIQUE INDEX idx_task_parameters_slug_unique ON public.task_parameters...` |
| task_recipe_external_services | idx_task_recipe_ext_services_org | `CREATE INDEX idx_task_recipe_ext_services_org ON public.task_recipe_external_...` |
| task_recipe_external_services | idx_task_recipe_ext_services_recipe | `CREATE INDEX idx_task_recipe_ext_services_recipe ON public.task_recipe_extern...` |
| task_recipe_labor | idx_trl_import_batch_id | `CREATE INDEX idx_trl_import_batch_id ON public.task_recipe_labor USING btree ...` |
| task_recipe_labor | idx_trl_labor_type | `CREATE INDEX idx_trl_labor_type ON public.task_recipe_labor USING btree (labo...` |
| task_recipe_labor | idx_trl_org | `CREATE INDEX idx_trl_org ON public.task_recipe_labor USING btree (organizatio...` |
| task_recipe_labor | idx_trl_recipe | `CREATE INDEX idx_trl_recipe ON public.task_recipe_labor USING btree (recipe_i...` |
| task_recipe_materials | idx_trm_import_batch_id | `CREATE INDEX idx_trm_import_batch_id ON public.task_recipe_materials USING bt...` |
| task_recipe_materials | idx_trm_material | `CREATE INDEX idx_trm_material ON public.task_recipe_materials USING btree (ma...` |
| task_recipe_materials | idx_trm_org | `CREATE INDEX idx_trm_org ON public.task_recipe_materials USING btree (organiz...` |
| task_recipe_materials | idx_trm_recipe | `CREATE INDEX idx_trm_recipe ON public.task_recipe_materials USING btree (reci...` |
| task_recipe_ratings | idx_task_recipe_ratings_org | `CREATE INDEX idx_task_recipe_ratings_org ON public.task_recipe_ratings USING ...` |
| task_recipe_ratings | idx_task_recipe_ratings_recipe | `CREATE INDEX idx_task_recipe_ratings_recipe ON public.task_recipe_ratings USI...` |
| task_recipe_ratings | task_recipe_ratings_unique | `CREATE UNIQUE INDEX task_recipe_ratings_unique ON public.task_recipe_ratings ...` |
| task_recipes | idx_task_recipes_import_batch_id | `CREATE INDEX idx_task_recipes_import_batch_id ON public.task_recipes USING bt...` |
| task_recipes | idx_task_recipes_org | `CREATE INDEX idx_task_recipes_org ON public.task_recipes USING btree (organiz...` |
| task_recipes | idx_task_recipes_public | `CREATE INDEX idx_task_recipes_public ON public.task_recipes USING btree (is_p...` |
| task_recipes | idx_task_recipes_task | `CREATE INDEX idx_task_recipes_task ON public.task_recipes USING btree (task_i...` |
| task_task_parameters | idx_task_task_parameters_not_deleted | `CREATE INDEX idx_task_task_parameters_not_deleted ON public.task_task_paramet...` |
| task_task_parameters | idx_task_task_parameters_parameter_id | `CREATE INDEX idx_task_task_parameters_parameter_id ON public.task_task_parame...` |
| task_task_parameters | idx_task_task_parameters_task_id | `CREATE INDEX idx_task_task_parameters_task_id ON public.task_task_parameters ...` |
| task_task_parameters | task_task_parameters_unique | `CREATE UNIQUE INDEX task_task_parameters_unique ON public.task_task_parameter...` |
| tasks | idx_tasks_import_batch_id | `CREATE INDEX idx_tasks_import_batch_id ON public.tasks USING btree (import_ba...` |
| tasks | tasks_active_idx | `CREATE INDEX tasks_active_idx ON public.tasks USING btree (organization_id, i...` |
| tasks | tasks_code_lower_uniq | `CREATE UNIQUE INDEX tasks_code_lower_uniq ON public.tasks USING btree (organi...` |
| tasks | tasks_custom_name_org_uniq | `CREATE UNIQUE INDEX tasks_custom_name_org_uniq ON public.tasks USING btree (o...` |
| tasks | tasks_custom_name_system_uniq | `CREATE UNIQUE INDEX tasks_custom_name_system_uniq ON public.tasks USING btree...` |
| tasks | tasks_division_idx | `CREATE INDEX tasks_division_idx ON public.tasks USING btree (task_division_id)` |
| tasks | tasks_org_idx | `CREATE INDEX tasks_org_idx ON public.tasks USING btree (organization_id)` |
| tasks | tasks_parametric_signature_uniq | `CREATE UNIQUE INDEX tasks_parametric_signature_uniq ON public.tasks USING btr...` |
| tasks | tasks_unit_idx | `CREATE INDEX tasks_unit_idx ON public.tasks USING btree (unit_id)` |
| tax_labels | tax_labels_code_key | `CREATE UNIQUE INDEX tax_labels_code_key ON public.tax_labels USING btree (code)` |
| testimonials | idx_testimonials_active | `CREATE INDEX idx_testimonials_active ON public.testimonials USING btree (is_a...` |
| testimonials | idx_testimonials_course | `CREATE INDEX idx_testimonials_course ON public.testimonials USING btree (cour...` |
| testimonials | idx_testimonials_course_user | `CREATE INDEX idx_testimonials_course_user ON public.testimonials USING btree ...` |
| testimonials | idx_testimonials_org | `CREATE INDEX idx_testimonials_org ON public.testimonials USING btree (organiz...` |
| testimonials | idx_testimonials_user | `CREATE INDEX idx_testimonials_user ON public.testimonials USING btree (user_i...` |
| unit_categories | idx_unit_categories_name | `CREATE INDEX idx_unit_categories_name ON public.unit_categories USING btree (...` |
| unit_categories | unit_categories_code_unique | `CREATE UNIQUE INDEX unit_categories_code_unique ON public.unit_categories USI...` |
| units | idx_units_category | `CREATE INDEX idx_units_category ON public.units USING btree (unit_category_id)` |
| units | idx_units_list | `CREATE INDEX idx_units_list ON public.units USING btree (is_system, organizat...` |
| units | idx_units_organization | `CREATE INDEX idx_units_organization ON public.units USING btree (organization...` |
| units | units_id_key1 | `CREATE UNIQUE INDEX units_id_key1 ON public.units USING btree (id)` |
| units | uq_units_org_name | `CREATE UNIQUE INDEX uq_units_org_name ON public.units USING btree (organizati...` |
| units | uq_units_system_name | `CREATE UNIQUE INDEX uq_units_system_name ON public.units USING btree (lower(n...` |
| user_acquisition | uniq_user_acquisition_user | `CREATE UNIQUE INDEX uniq_user_acquisition_user ON public.user_acquisition USI...` |
| user_data | user_data_id_key | `CREATE UNIQUE INDEX user_data_id_key ON public.user_data USING btree (id)` |
| user_data | user_data_user_id_key | `CREATE UNIQUE INDEX user_data_user_id_key ON public.user_data USING btree (us...` |
| user_notifications | user_notifications_user_id_notification_id_key | `CREATE UNIQUE INDEX user_notifications_user_id_notification_id_key ON public....` |
| user_notifications | user_notifications_user_idx | `CREATE INDEX user_notifications_user_idx ON public.user_notifications USING b...` |
| user_organization_preferences | user_organization_preferences_user_id_organization_id_key | `CREATE UNIQUE INDEX user_organization_preferences_user_id_organization_id_key...` |
| user_preferences | user_preferences_user_id_key | `CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences U...` |
| user_presence | idx_user_presence_organization | `CREATE INDEX idx_user_presence_organization ON public.user_presence USING btr...` |
| user_presence | idx_user_presence_session | `CREATE INDEX idx_user_presence_session ON public.user_presence USING btree (s...` |
| user_view_history | idx_user_view_history_entered_at | `CREATE INDEX idx_user_view_history_entered_at ON public.user_view_history USI...` |
| user_view_history | idx_user_view_history_org | `CREATE INDEX idx_user_view_history_org ON public.user_view_history USING btre...` |
| user_view_history | idx_user_view_history_session_id | `CREATE INDEX idx_user_view_history_session_id ON public.user_view_history USI...` |
| user_view_history | idx_user_view_history_user_entered | `CREATE INDEX idx_user_view_history_user_entered ON public.user_view_history U...` |
| user_view_history | idx_user_view_history_user_id | `CREATE INDEX idx_user_view_history_user_id ON public.user_view_history USING ...` |
| users | idx_users_auth_id | `CREATE INDEX idx_users_auth_id ON public.users USING btree (auth_id)` |
| users | idx_users_avatar_source | `CREATE INDEX idx_users_avatar_source ON public.users USING btree (avatar_source)` |
| users | idx_users_role_id | `CREATE INDEX idx_users_role_id ON public.users USING btree (role_id)` |
| users | idx_users_signup_completed | `CREATE INDEX idx_users_signup_completed ON public.users USING btree (signup_c...` |
| users | users_auth_id_key | `CREATE UNIQUE INDEX users_auth_id_key ON public.users USING btree (auth_id)` |
| users | users_email_lower_uniq | `CREATE UNIQUE INDEX users_email_lower_uniq ON public.users USING btree (lower...` |
| users | users_id_key | `CREATE UNIQUE INDEX users_id_key ON public.users USING btree (id)` |
| wallets | wallets_id_key | `CREATE UNIQUE INDEX wallets_id_key ON public.wallets USING btree (id)` |
| wallets | wallets_name_key | `CREATE UNIQUE INDEX wallets_name_key ON public.wallets USING btree (name)` |
