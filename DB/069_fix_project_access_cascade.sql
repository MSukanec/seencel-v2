-- ============================================================
-- 069: Fix ALL FKs to iam.users(id) — add ON DELETE CASCADE
-- ============================================================
-- Problema: DELETE auth.users → CASCADE → DELETE iam.users
--           → BLOCKED por múltiples FKs sin CASCADE
--
-- Tablas afectadas (todas en schema iam):
--   dashboard_layouts, feedback, linked_accounts,
--   organization_clients, organization_external_actors,
--   organization_invitations (x2: user_id, invited_by),
--   organizations (x2: created_by, owner_id),
--   project_access, support_messages,
--   user_acquisition, user_data,
--   user_organization_preferences, user_preferences,
--   user_presence, user_view_history
-- ============================================================

BEGIN;

-- 1. dashboard_layouts
ALTER TABLE iam.dashboard_layouts
  DROP CONSTRAINT dashboard_layouts_user_id_fkey,
  ADD CONSTRAINT dashboard_layouts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 2. feedback
ALTER TABLE iam.feedback
  DROP CONSTRAINT feedback_user_id_fkey,
  ADD CONSTRAINT feedback_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 3. linked_accounts
ALTER TABLE iam.linked_accounts
  DROP CONSTRAINT linked_accounts_user_id_fkey,
  ADD CONSTRAINT linked_accounts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 4. organization_clients
ALTER TABLE iam.organization_clients
  DROP CONSTRAINT organization_clients_user_id_fkey,
  ADD CONSTRAINT organization_clients_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 5. organization_external_actors
ALTER TABLE iam.organization_external_actors
  DROP CONSTRAINT organization_external_actors_user_id_fkey,
  ADD CONSTRAINT organization_external_actors_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 6. organization_invitations (user_id)
ALTER TABLE iam.organization_invitations
  DROP CONSTRAINT IF EXISTS organization_invitations_user_id_fkey,
  ADD CONSTRAINT organization_invitations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE SET NULL;

-- 7. organization_invitations (invited_by)
ALTER TABLE iam.organization_invitations
  DROP CONSTRAINT IF EXISTS organization_invitations_invited_by_fkey,
  ADD CONSTRAINT organization_invitations_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES iam.users(id) ON DELETE SET NULL;

-- 8. organizations (created_by) — SET NULL para no borrar la org
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_created_by_fkey,
  ADD CONSTRAINT organizations_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.users(id) ON DELETE SET NULL;

-- 9. organizations (owner_id) — SET NULL para no borrar la org
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_owner_id_fkey,
  ADD CONSTRAINT organizations_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES iam.users(id) ON DELETE SET NULL;

-- 10. project_access
ALTER TABLE iam.project_access
  DROP CONSTRAINT project_access_user_id_fkey,
  ADD CONSTRAINT project_access_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 11. support_messages
ALTER TABLE iam.support_messages
  DROP CONSTRAINT support_messages_user_id_fkey,
  ADD CONSTRAINT support_messages_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 12. user_acquisition
ALTER TABLE iam.user_acquisition
  DROP CONSTRAINT user_acquisition_user_id_fkey,
  ADD CONSTRAINT user_acquisition_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 13. user_data
ALTER TABLE iam.user_data
  DROP CONSTRAINT user_data_user_id_fkey,
  ADD CONSTRAINT user_data_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 14. user_organization_preferences
ALTER TABLE iam.user_organization_preferences
  DROP CONSTRAINT user_organization_preferences_user_id_fkey,
  ADD CONSTRAINT user_organization_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 15. user_preferences
ALTER TABLE iam.user_preferences
  DROP CONSTRAINT user_preferences_user_id_fkey,
  ADD CONSTRAINT user_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 16. user_presence
ALTER TABLE iam.user_presence
  DROP CONSTRAINT user_presence_user_id_fkey,
  ADD CONSTRAINT user_presence_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- 17. user_view_history
ALTER TABLE iam.user_view_history
  DROP CONSTRAINT user_view_history_user_id_fkey,
  ADD CONSTRAINT user_view_history_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

-- ============================================================
-- También: organization_members (si existe FK sin cascade)
-- ============================================================
ALTER TABLE iam.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey,
  ADD CONSTRAINT organization_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;

COMMIT;
