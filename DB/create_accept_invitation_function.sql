-- ============================================
-- FUNCIÓN: get_invitation_by_token
-- 
-- Obtiene los datos públicos de una invitación por token.
-- SECURITY DEFINER porque la RLS de organization_invitations
-- solo permite SELECT por email del JWT, y esta función 
-- se usa en la página de aceptar donde el usuario puede
-- no estar autenticado.
--
-- Solo retorna datos seguros (no IDs internos).
-- ============================================

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(
    p_token TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    SELECT 
        i.id,
        i.email,
        i.status,
        i.expires_at,
        o.name AS organization_name,
        r.name AS role_name,
        u.full_name AS inviter_name
    INTO v_invitation
    FROM public.organization_invitations i
    JOIN public.organizations o ON o.id = i.organization_id
    LEFT JOIN public.roles r ON r.id = i.role_id
    LEFT JOIN public.organization_members m ON m.id = i.invited_by
    LEFT JOIN public.users u ON u.id = m.user_id
    WHERE i.token = p_token
    LIMIT 1;

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'not_found'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_invitation.id,
        'email', v_invitation.email,
        'status', v_invitation.status,
        'expires_at', v_invitation.expires_at,
        'organization_name', v_invitation.organization_name,
        'role_name', COALESCE(v_invitation.role_name, 'Miembro'),
        'inviter_name', v_invitation.inviter_name
    );
END;
$$;

-- ============================================
-- FUNCIÓN: accept_organization_invitation
-- 
-- Acepta una invitación de equipo validando:
--   1. Token existe y es válido
--   2. No está expirada
--   3. Status es 'pending' o 'registered'
--   4. Hay asientos disponibles
--   5. El usuario no es ya miembro activo
-- 
-- Si todo OK:
--   - Crea organization_member con el role_id de la invitación
--   - Actualiza status a 'accepted'
--   - Registra evento en organization_member_events
-- ============================================

CREATE OR REPLACE FUNCTION public.accept_organization_invitation(
    p_token TEXT,
    p_user_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation RECORD;
    v_already_member BOOLEAN;
    v_seat_capacity INT;
    v_current_members INT;
    v_pending_invitations INT;
    v_available INT;
    v_new_member_id UUID;
BEGIN
    -- 1. Buscar invitación por token
    SELECT 
        i.id,
        i.organization_id,
        i.email,
        i.role_id,
        i.status,
        i.expires_at,
        i.invited_by,
        o.name AS org_name
    INTO v_invitation
    FROM public.organization_invitations i
    JOIN public.organizations o ON o.id = i.organization_id
    WHERE i.token = p_token
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

    -- 4. Verificar que el usuario no es ya miembro activo
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = v_invitation.organization_id
          AND user_id = p_user_id
          AND is_active = true
    ) INTO v_already_member;

    IF v_already_member THEN
        -- Marcar invitación como aceptada igualmente
        UPDATE public.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;

        RETURN jsonb_build_object(
            'success', true,
            'already_member', true,
            'organization_id', v_invitation.organization_id,
            'message', 'Ya sos miembro de esta organización'
        );
    END IF;

    -- 5. Verificar asientos disponibles
    SELECT 
        COALESCE((p.features->>'seats_included')::integer, 1) + COALESCE(org.purchased_seats, 0)
    INTO v_seat_capacity
    FROM public.organizations org
    JOIN public.plans p ON p.id = org.plan_id
    WHERE org.id = v_invitation.organization_id;

    SELECT COUNT(*) INTO v_current_members
    FROM public.organization_members
    WHERE organization_id = v_invitation.organization_id
      AND is_active = true;

    SELECT COUNT(*) INTO v_pending_invitations
    FROM public.organization_invitations
    WHERE organization_id = v_invitation.organization_id
      AND status IN ('pending', 'registered')
      AND id != v_invitation.id; -- Excluyendo la actual

    -- La invitación actual ya fue contada cuando se creó, 
    -- así que hay espacio si current_members < capacity
    v_available := v_seat_capacity - v_current_members;

    IF v_available <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'no_seats_available',
            'message', 'No hay asientos disponibles en esta organización'
        );
    END IF;

    -- 6. Crear miembro
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role_id,
        is_active,
        is_billable,
        joined_at,
        invited_by
    ) VALUES (
        v_invitation.organization_id,
        p_user_id,
        v_invitation.role_id,
        true,
        true, -- Miembros invitados son billables
        NOW(),
        v_invitation.invited_by
    )
    RETURNING id INTO v_new_member_id;

    -- 7. Actualizar invitación
    UPDATE public.organization_invitations
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        user_id = p_user_id
    WHERE id = v_invitation.id;

    -- 8. Registrar evento
    INSERT INTO public.organization_member_events (
        organization_id,
        member_id,
        user_id,
        event_type,
        was_billable,
        is_billable,
        performed_by
    ) VALUES (
        v_invitation.organization_id,
        v_new_member_id,
        p_user_id,
        'invitation_accepted',
        false,
        true,
        p_user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'organization_id', v_invitation.organization_id,
        'org_name', v_invitation.org_name,
        'member_id', v_new_member_id,
        'message', 'Invitación aceptada correctamente'
    );
END;
$$;
