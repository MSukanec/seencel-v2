# Database Schema (Auto-generated)
> Generated: 2026-03-01T21:32:52.143Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Indexes (27, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| countries | countries_alpha2_uniq | `CREATE UNIQUE INDEX countries_alpha2_uniq ON public.countries USING btree (al...` |
| countries | countries_alpha3_uniq | `CREATE UNIQUE INDEX countries_alpha3_uniq ON public.countries USING btree (al...` |
| countries | countries_name_lower_uniq | `CREATE UNIQUE INDEX countries_name_lower_uniq ON public.countries USING btree...` |
| countries | idx_countries_name | `CREATE INDEX idx_countries_name ON public.countries USING btree (name)` |
| feature_flags | feature_flags_key_key | `CREATE UNIQUE INDEX feature_flags_key_key ON public.feature_flags USING btree...` |
| feature_flags | idx_feature_flags_parent_id | `CREATE INDEX idx_feature_flags_parent_id ON public.feature_flags USING btree ...` |
| hero_sections | idx_hero_sections_is_deleted | `CREATE INDEX idx_hero_sections_is_deleted ON public.hero_sections USING btree...` |
| import_batches | idx_import_batches_member_id | `CREATE INDEX idx_import_batches_member_id ON public.import_batches USING btre...` |
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
