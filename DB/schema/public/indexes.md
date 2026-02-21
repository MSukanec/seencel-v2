# Database Schema (Auto-generated)
> Generated: 2026-02-21T16:30:21.519Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Indexes (68, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| brands | brands_name_lower_uniq | `CREATE UNIQUE INDEX brands_name_lower_uniq ON public.brands USING btree (lowe...` |
| capital_adjustments | idx_capital_adjustments_not_deleted | `CREATE INDEX idx_capital_adjustments_not_deleted ON public.capital_adjustment...` |
| capital_adjustments | idx_capital_adjustments_org_date | `CREATE INDEX idx_capital_adjustments_org_date ON public.capital_adjustments U...` |
| capital_adjustments | idx_capital_adjustments_partner_date | `CREATE INDEX idx_capital_adjustments_partner_date ON public.capital_adjustmen...` |
| client_portal_branding | client_portal_branding_project_id_key | `CREATE UNIQUE INDEX client_portal_branding_project_id_key ON public.client_po...` |
| client_portal_settings | idx_client_portal_settings_org | `CREATE INDEX idx_client_portal_settings_org ON public.client_portal_settings ...` |
| countries | countries_alpha2_uniq | `CREATE UNIQUE INDEX countries_alpha2_uniq ON public.countries USING btree (al...` |
| countries | countries_alpha3_uniq | `CREATE UNIQUE INDEX countries_alpha3_uniq ON public.countries USING btree (al...` |
| countries | countries_name_lower_uniq | `CREATE UNIQUE INDEX countries_name_lower_uniq ON public.countries USING btree...` |
| countries | idx_countries_name | `CREATE INDEX idx_countries_name ON public.countries USING btree (name)` |
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
| hero_sections | idx_hero_sections_is_deleted | `CREATE INDEX idx_hero_sections_is_deleted ON public.hero_sections USING btree...` |
| import_batches | idx_import_batches_member_id | `CREATE INDEX idx_import_batches_member_id ON public.import_batches USING btre...` |
| material_types | idx_material_types_list | `CREATE INDEX idx_material_types_list ON public.material_types USING btree (is...` |
| material_types | uq_material_types_org_name | `CREATE UNIQUE INDEX uq_material_types_org_name ON public.material_types USING...` |
| material_types | uq_material_types_system_name | `CREATE UNIQUE INDEX uq_material_types_system_name ON public.material_types US...` |
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
| organization_task_prices | org_task_price_unique | `CREATE UNIQUE INDEX org_task_price_unique ON public.organization_task_prices ...` |
| organization_task_prices | org_task_prices_org_idx | `CREATE INDEX org_task_prices_org_idx ON public.organization_task_prices USING...` |
| organization_task_prices | org_task_prices_task_idx | `CREATE INDEX org_task_prices_task_idx ON public.organization_task_prices USIN...` |
| pin_board_items | idx_pin_board_items_board | `CREATE INDEX idx_pin_board_items_board ON public.pin_board_items USING btree ...` |
| pin_board_items | idx_pin_board_items_pin | `CREATE INDEX idx_pin_board_items_pin ON public.pin_board_items USING btree (p...` |
| pin_board_items | pin_board_items_unique | `CREATE UNIQUE INDEX pin_board_items_unique ON public.pin_board_items USING bt...` |
| pin_boards | idx_pin_boards_organization | `CREATE INDEX idx_pin_boards_organization ON public.pin_boards USING btree (or...` |
| pin_boards | idx_pin_boards_project | `CREATE INDEX idx_pin_boards_project ON public.pin_boards USING btree (project...` |
| pins | idx_pins_media_file | `CREATE INDEX idx_pins_media_file ON public.pins USING btree (media_file_id) W...` |
| pins | idx_pins_organization | `CREATE INDEX idx_pins_organization ON public.pins USING btree (organization_i...` |
| pins | idx_pins_project | `CREATE INDEX idx_pins_project ON public.pins USING btree (project_id) WHERE (...` |
| product_avg_prices | product_avg_prices_product_id_idx | `CREATE UNIQUE INDEX product_avg_prices_product_id_idx ON public.product_avg_p...` |
| provider_products | provider_products_organization_id_product_id_key | `CREATE UNIQUE INDEX provider_products_organization_id_product_id_key ON publi...` |
| testimonials | idx_testimonials_active | `CREATE INDEX idx_testimonials_active ON public.testimonials USING btree (is_a...` |
| testimonials | idx_testimonials_course | `CREATE INDEX idx_testimonials_course ON public.testimonials USING btree (cour...` |
| testimonials | idx_testimonials_course_user | `CREATE INDEX idx_testimonials_course_user ON public.testimonials USING btree ...` |
| testimonials | idx_testimonials_org | `CREATE INDEX idx_testimonials_org ON public.testimonials USING btree (organiz...` |
| testimonials | idx_testimonials_user | `CREATE INDEX idx_testimonials_user ON public.testimonials USING btree (user_i...` |
