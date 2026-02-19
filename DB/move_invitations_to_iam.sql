-- =============================================================
-- MIGRACIÓN: Mover organization_invitations a schema IAM
-- =============================================================
-- Mismo patrón que organization_clients:
--   1. Mover tabla a iam
--   2. Crear vista writable en public
--   3. Crear INSTEAD OF triggers para INSERT/UPDATE/DELETE
--
-- ⚠️ EJECUTAR EN SUPABASE SQL EDITOR
-- =============================================================

-- ─── PASO 1: Mover la tabla al schema iam ───────────────────
ALTER TABLE public.organization_invitations SET SCHEMA iam;

-- ─── PASO 2: Crear vista writable en public ─────────────────
CREATE OR REPLACE VIEW public.organization_invitations
WITH (security_invoker = true)
AS
SELECT
    id,
    organization_id,
    email,
    status,
    token,
    created_at,
    accepted_at,
    role_id,
    invited_by,
    updated_at,
    user_id,
    expires_at,
    invitation_type,
    actor_type,
    project_id,
    client_id
FROM iam.organization_invitations;

-- ─── PASO 3: INSTEAD OF INSERT ──────────────────────────────
CREATE OR REPLACE FUNCTION iam.organization_invitations_insert_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'iam', 'public'
AS $$
BEGIN
    INSERT INTO iam.organization_invitations (
        id,
        organization_id,
        email,
        status,
        token,
        created_at,
        accepted_at,
        role_id,
        invited_by,
        updated_at,
        user_id,
        expires_at,
        invitation_type,
        actor_type,
        project_id,
        client_id
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.organization_id,
        NEW.email,
        COALESCE(NEW.status, 'pending'),
        NEW.token,
        COALESCE(NEW.created_at, now()),
        NEW.accepted_at,
        NEW.role_id,
        NEW.invited_by,
        COALESCE(NEW.updated_at, now()),
        NEW.user_id,
        COALESCE(NEW.expires_at, now() + interval '7 days'),
        COALESCE(NEW.invitation_type, 'member'),
        NEW.actor_type,
        NEW.project_id,
        NEW.client_id
    )
    RETURNING * INTO NEW;
    RETURN NEW;
END;
$$;

CREATE TRIGGER organization_invitations_insert_trigger
    INSTEAD OF INSERT ON public.organization_invitations
    FOR EACH ROW
    EXECUTE FUNCTION iam.organization_invitations_insert_fn();

-- ─── PASO 4: INSTEAD OF UPDATE ──────────────────────────────
CREATE OR REPLACE FUNCTION iam.organization_invitations_update_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'iam', 'public'
AS $$
BEGIN
    UPDATE iam.organization_invitations SET
        organization_id = NEW.organization_id,
        email           = NEW.email,
        status          = NEW.status,
        token           = NEW.token,
        created_at      = NEW.created_at,
        accepted_at     = NEW.accepted_at,
        role_id         = NEW.role_id,
        invited_by      = NEW.invited_by,
        updated_at      = NEW.updated_at,
        user_id         = NEW.user_id,
        expires_at      = NEW.expires_at,
        invitation_type = NEW.invitation_type,
        actor_type      = NEW.actor_type,
        project_id      = NEW.project_id,
        client_id       = NEW.client_id
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER organization_invitations_update_trigger
    INSTEAD OF UPDATE ON public.organization_invitations
    FOR EACH ROW
    EXECUTE FUNCTION iam.organization_invitations_update_fn();

-- ─── PASO 5: INSTEAD OF DELETE ──────────────────────────────
CREATE OR REPLACE FUNCTION iam.organization_invitations_delete_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'iam', 'public'
AS $$
BEGIN
    DELETE FROM iam.organization_invitations WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER organization_invitations_delete_trigger
    INSTEAD OF DELETE ON public.organization_invitations
    FOR EACH ROW
    EXECUTE FUNCTION iam.organization_invitations_delete_fn();

-- ─── VERIFICACIÓN ───────────────────────────────────────────
-- Verificar que la tabla existe en iam
SELECT schemaname, tablename
FROM pg_tables
WHERE tablename = 'organization_invitations';

-- Verificar que la vista existe en public
SELECT table_schema, table_name, is_insertable_into
FROM information_schema.views
WHERE table_name = 'organization_invitations';

-- Verificar RLS (las policies se mueven con la tabla)
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'organization_invitations';
