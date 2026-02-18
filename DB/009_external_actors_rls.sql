-- ============================================================
-- 009: RLS + SECURITY DEFINER para organization_external_actors
-- ============================================================
-- Ejecutar en Supabase SQL Editor

-- ============================================================
-- 1. HABILITAR RLS
-- ============================================================
ALTER TABLE public.organization_external_actors ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. POLÍTICAS RLS
-- ============================================================

-- SELECT: Miembros de la org VEN los actores + el propio actor ve su fila
CREATE POLICY "MIEMBROS Y ACTORES VEN EXTERNAL_ACTORS"
    ON public.organization_external_actors FOR SELECT TO public
    USING (
        can_view_org(organization_id, 'team.view'::text)
        OR is_self(user_id)
    );

-- INSERT: Solo miembros con permiso team.manage (y SECURITY DEFINER functions)
CREATE POLICY "MIEMBROS CREAN EXTERNAL_ACTORS"
    ON public.organization_external_actors FOR INSERT TO public
    WITH CHECK (
        can_mutate_org(organization_id, 'team.manage'::text)
    );

-- UPDATE: Miembros con permiso team.manage (incluye soft delete)
CREATE POLICY "MIEMBROS EDITAN EXTERNAL_ACTORS"
    ON public.organization_external_actors FOR UPDATE TO public
    USING (
        can_mutate_org(organization_id, 'team.manage'::text)
    );

-- ============================================================
-- 3. FUNCIÓN SECURITY DEFINER: accept_external_invitation
-- Permite que un usuario invitado se auto-inserte como actor
-- externo al aceptar una invitación válida. Bypass de RLS.
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_external_invitation(
    p_token text,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_invitation RECORD;
    v_existing_actor RECORD;
BEGIN
    -- 1. Buscar invitación externa por token
    SELECT
        i.id,
        i.organization_id,
        i.email,
        i.status,
        i.expires_at,
        i.invitation_type,
        i.actor_type,
        o.name AS org_name
    INTO v_invitation
    FROM public.organization_invitations i
    JOIN public.organizations o ON o.id = i.organization_id
    WHERE i.token = p_token
      AND i.invitation_type = 'external'
    LIMIT 1;

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_not_found',
            'message', 'Invitación no encontrada o token inválido'
        );
    END IF;

    -- 2. Verificar status
    IF v_invitation.status NOT IN ('pending', 'registered') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_already_used',
            'message', 'Esta invitación ya fue utilizada'
        );
    END IF;

    -- 3. Verificar expiración
    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_expired',
            'message', 'Esta invitación ha expirado'
        );
    END IF;

    -- 4. Verificar si ya es actor externo (activo o inactivo)
    SELECT id, is_active
    INTO v_existing_actor
    FROM public.organization_external_actors
    WHERE organization_id = v_invitation.organization_id
      AND user_id = p_user_id;

    IF v_existing_actor IS NOT NULL AND v_existing_actor.is_active THEN
        -- Ya es actor activo → marcar invitación y retornar
        UPDATE public.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;

        RETURN jsonb_build_object(
            'success', true,
            'already_actor', true,
            'organization_id', v_invitation.organization_id,
            'org_name', v_invitation.org_name
        );
    END IF;

    -- 5. Insertar o reactivar actor externo
    IF v_existing_actor IS NOT NULL AND NOT v_existing_actor.is_active THEN
        -- Reactivar actor soft-deleted
        UPDATE public.organization_external_actors
        SET
            is_active = true,
            actor_type = v_invitation.actor_type,
            is_deleted = false,
            deleted_at = NULL,
            updated_at = NOW()
        WHERE id = v_existing_actor.id;
    ELSE
        -- Insertar nuevo actor externo
        INSERT INTO public.organization_external_actors (
            organization_id,
            user_id,
            actor_type,
            is_active
        ) VALUES (
            v_invitation.organization_id,
            p_user_id,
            v_invitation.actor_type,
            true
        );
    END IF;

    -- 6. Marcar invitación como aceptada
    UPDATE public.organization_invitations
    SET
        status = 'accepted',
        accepted_at = NOW(),
        user_id = p_user_id
    WHERE id = v_invitation.id;

    -- 7. Configurar preferencias del usuario
    UPDATE public.user_preferences
    SET last_organization_id = v_invitation.organization_id
    WHERE user_id = p_user_id;

    INSERT INTO public.user_organization_preferences (
        user_id, organization_id, updated_at
    ) VALUES (
        p_user_id, v_invitation.organization_id, NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE
    SET updated_at = NOW();

    -- 8. Retornar éxito
    RETURN jsonb_build_object(
        'success', true,
        'already_actor', false,
        'organization_id', v_invitation.organization_id,
        'org_name', v_invitation.org_name
    );
END;
$function$;

-- ============================================================
-- 4. AUDIT LOG: function + trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_external_actor_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_external_actor';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_external_actor';
        ELSIF (OLD.is_active = false AND NEW.is_active = true) THEN
            audit_action := 'reactivate_external_actor';
        ELSE
            audit_action := 'update_external_actor';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_external_actor';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'actor_type', target_record.actor_type,
        'user_id', target_record.user_id,
        'is_active', target_record.is_active
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'organization_external_actors', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_external_actor_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.organization_external_actors
    FOR EACH ROW EXECUTE FUNCTION public.log_external_actor_activity();
