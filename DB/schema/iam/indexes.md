# Database Schema (Auto-generated)
> Generated: 2026-02-22T22:05:48.801Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Indexes (68, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| dashboard_layouts | idx_dashboard_layouts_user_org | `CREATE INDEX idx_dashboard_layouts_user_org ON iam.dashboard_layouts USING bt...` |
| dashboard_layouts | uq_dashboard_layout | `CREATE UNIQUE INDEX uq_dashboard_layout ON iam.dashboard_layouts USING btree ...` |
| external_actor_scopes | external_actor_scopes_external_actor_id_permission_key_key | `CREATE UNIQUE INDEX external_actor_scopes_external_actor_id_permission_key_ke...` |
| external_actor_scopes | idx_eas_actor_perm | `CREATE INDEX idx_eas_actor_perm ON iam.external_actor_scopes USING btree (ext...` |
| linked_accounts | linked_accounts_auth_id_key | `CREATE UNIQUE INDEX linked_accounts_auth_id_key ON iam.linked_accounts USING ...` |
| organization_clients | idx_iam_org_clients_active | `CREATE INDEX idx_iam_org_clients_active ON iam.organization_clients USING btr...` |
| organization_clients | idx_iam_org_clients_org | `CREATE INDEX idx_iam_org_clients_org ON iam.organization_clients USING btree ...` |
| organization_clients | idx_iam_org_clients_user | `CREATE INDEX idx_iam_org_clients_user ON iam.organization_clients USING btree...` |
| organization_clients | organization_clients_organization_id_user_id_key | `CREATE UNIQUE INDEX organization_clients_organization_id_user_id_key ON iam.o...` |
| organization_data | organization_data_city_idx | `CREATE INDEX organization_data_city_idx ON iam.organization_data USING btree ...` |
| organization_data | organization_data_country_idx | `CREATE INDEX organization_data_country_idx ON iam.organization_data USING btr...` |
| organization_data | organization_data_organization_id_key | `CREATE UNIQUE INDEX organization_data_organization_id_key ON iam.organization...` |
| organization_external_actors | idx_external_actors_org_user | `CREATE INDEX idx_external_actors_org_user ON iam.organization_external_actors...` |
| organization_external_actors | idx_oea_actor_type | `CREATE INDEX idx_oea_actor_type ON iam.organization_external_actors USING btr...` |
| organization_external_actors | idx_oea_organization | `CREATE INDEX idx_oea_organization ON iam.organization_external_actors USING b...` |
| organization_external_actors | idx_oea_user | `CREATE INDEX idx_oea_user ON iam.organization_external_actors USING btree (us...` |
| organization_external_actors | oea_unique_org_user | `CREATE UNIQUE INDEX oea_unique_org_user ON iam.organization_external_actors U...` |
| organization_invitations | organization_invitations_email_idx | `CREATE INDEX organization_invitations_email_idx ON iam.organization_invitatio...` |
| organization_invitations | organization_invitations_email_org_unique | `CREATE UNIQUE INDEX organization_invitations_email_org_unique ON iam.organiza...` |
| organization_invitations | organization_invitations_organization_id_idx | `CREATE INDEX organization_invitations_organization_id_idx ON iam.organization...` |
| organization_members | idx_org_members_created_by | `CREATE INDEX idx_org_members_created_by ON iam.organization_members USING btr...` |
| organization_members | idx_org_members_org_user | `CREATE INDEX idx_org_members_org_user ON iam.organization_members USING btree...` |
| organization_members | idx_org_members_updated_by | `CREATE INDEX idx_org_members_updated_by ON iam.organization_members USING btr...` |
| organization_members | org_members_over_limit_idx | `CREATE INDEX org_members_over_limit_idx ON iam.organization_members USING btr...` |
| organization_members | organization_members_idd_key | `CREATE UNIQUE INDEX organization_members_idd_key ON iam.organization_members ...` |
| organization_members | organization_members_organization_id_idx | `CREATE INDEX organization_members_organization_id_idx ON iam.organization_mem...` |
| organization_members | organization_members_user_id_idx | `CREATE INDEX organization_members_user_id_idx ON iam.organization_members USI...` |
| organization_members | unique_user_per_organization | `CREATE UNIQUE INDEX unique_user_per_organization ON iam.organization_members ...` |
| organization_preferences | unique_organization_preferences | `CREATE UNIQUE INDEX unique_organization_preferences ON iam.organization_prefe...` |
| organization_recipe_preferences | idx_org_recipe_prefs_org | `CREATE INDEX idx_org_recipe_prefs_org ON iam.organization_recipe_preferences ...` |
| organization_recipe_preferences | idx_org_recipe_prefs_recipe | `CREATE INDEX idx_org_recipe_prefs_recipe ON iam.organization_recipe_preferenc...` |
| organization_recipe_preferences | org_recipe_prefs_unique | `CREATE UNIQUE INDEX org_recipe_prefs_unique ON iam.organization_recipe_prefer...` |
| organizations | idx_organizations_active_not_deleted | `CREATE INDEX idx_organizations_active_not_deleted ON iam.organizations USING ...` |
| organizations | idx_organizations_plan | `CREATE INDEX idx_organizations_plan ON iam.organizations USING btree (plan_id)` |
| organizations | idx_organizations_updated_at | `CREATE INDEX idx_organizations_updated_at ON iam.organizations USING btree (u...` |
| organizations | organizations_id_key | `CREATE UNIQUE INDEX organizations_id_key ON iam.organizations USING btree (id)` |
| permissions | permissions_key_key | `CREATE UNIQUE INDEX permissions_key_key ON iam.permissions USING btree (key)` |
| project_access | idx_project_access_lookup | `CREATE INDEX idx_project_access_lookup ON iam.project_access USING btree (pro...` |
| project_access | idx_project_access_user | `CREATE INDEX idx_project_access_user ON iam.project_access USING btree (user_...` |
| project_access | project_access_project_id_user_id_key | `CREATE UNIQUE INDEX project_access_project_id_user_id_key ON iam.project_acce...` |
| role_permissions | idx_role_permissions_organization_id | `CREATE INDEX idx_role_permissions_organization_id ON iam.role_permissions USI...` |
| role_permissions | idx_role_permissions_permission_id | `CREATE INDEX idx_role_permissions_permission_id ON iam.role_permissions USING...` |
| role_permissions | idx_role_permissions_role_id | `CREATE INDEX idx_role_permissions_role_id ON iam.role_permissions USING btree...` |
| role_permissions | role_permissions_role_id_permission_id_key | `CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON iam.role_pe...` |
| roles | idx_roles_organization_id | `CREATE INDEX idx_roles_organization_id ON iam.roles USING btree (organization...` |
| roles | roles_unique_name_per_org | `CREATE UNIQUE INDEX roles_unique_name_per_org ON iam.roles USING btree (organ...` |
| support_messages | idx_support_messages_read_by_admin | `CREATE INDEX idx_support_messages_read_by_admin ON iam.support_messages USING...` |
| support_messages | idx_support_messages_read_by_user | `CREATE INDEX idx_support_messages_read_by_user ON iam.support_messages USING ...` |
| support_messages | idx_support_messages_unread_user | `CREATE INDEX idx_support_messages_unread_user ON iam.support_messages USING b...` |
| user_acquisition | uniq_user_acquisition_user | `CREATE UNIQUE INDEX uniq_user_acquisition_user ON iam.user_acquisition USING ...` |
| user_data | user_data_id_key | `CREATE UNIQUE INDEX user_data_id_key ON iam.user_data USING btree (id)` |
| user_data | user_data_user_id_key | `CREATE UNIQUE INDEX user_data_user_id_key ON iam.user_data USING btree (user_id)` |
| user_organization_preferences | user_organization_preferences_user_id_organization_id_key | `CREATE UNIQUE INDEX user_organization_preferences_user_id_organization_id_key...` |
| user_preferences | user_preferences_user_id_key | `CREATE UNIQUE INDEX user_preferences_user_id_key ON iam.user_preferences USIN...` |
| user_presence | idx_user_presence_organization | `CREATE INDEX idx_user_presence_organization ON iam.user_presence USING btree ...` |
| user_presence | idx_user_presence_session | `CREATE INDEX idx_user_presence_session ON iam.user_presence USING btree (sess...` |
| user_view_history | idx_user_view_history_entered_at | `CREATE INDEX idx_user_view_history_entered_at ON iam.user_view_history USING ...` |
| user_view_history | idx_user_view_history_org | `CREATE INDEX idx_user_view_history_org ON iam.user_view_history USING btree (...` |
| user_view_history | idx_user_view_history_session_id | `CREATE INDEX idx_user_view_history_session_id ON iam.user_view_history USING ...` |
| user_view_history | idx_user_view_history_user_entered | `CREATE INDEX idx_user_view_history_user_entered ON iam.user_view_history USIN...` |
| user_view_history | idx_user_view_history_user_id | `CREATE INDEX idx_user_view_history_user_id ON iam.user_view_history USING btr...` |
| users | idx_users_auth_id | `CREATE INDEX idx_users_auth_id ON iam.users USING btree (auth_id)` |
| users | idx_users_avatar_source | `CREATE INDEX idx_users_avatar_source ON iam.users USING btree (avatar_source)` |
| users | idx_users_role_id | `CREATE INDEX idx_users_role_id ON iam.users USING btree (role_id)` |
| users | idx_users_signup_completed | `CREATE INDEX idx_users_signup_completed ON iam.users USING btree (signup_comp...` |
| users | users_auth_id_key | `CREATE UNIQUE INDEX users_auth_id_key ON iam.users USING btree (auth_id)` |
| users | users_email_lower_uniq | `CREATE UNIQUE INDEX users_email_lower_uniq ON iam.users USING btree (lower(em...` |
| users | users_id_key | `CREATE UNIQUE INDEX users_id_key ON iam.users USING btree (id)` |
