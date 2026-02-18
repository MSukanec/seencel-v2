-- ============================================================
-- 010: Mejorar get_invitation_by_token para soportar invitaciones externas
-- ============================================================
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_invitation RECORD;
BEGIN
    SELECT 
        i.id,
        i.email,
        i.status,
        i.expires_at,
        i.invitation_type,
        i.actor_type,
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
        'invitation_type', COALESCE(v_invitation.invitation_type, 'member'),
        'actor_type', v_invitation.actor_type,
        'organization_name', v_invitation.organization_name,
        'role_name', COALESCE(v_invitation.role_name, 'Miembro'),
        'inviter_name', v_invitation.inviter_name
    );
END;
$function$;
