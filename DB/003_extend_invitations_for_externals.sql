-- ============================================================
-- 003: Extend organization_invitations for external collaborators
-- ============================================================
-- Agrega soporte para invitaciones de colaboradores externos.
-- Un colaborador externo es alguien que:
--   - NO es miembro interno (no ocupa asiento del plan)
--   - Tiene acceso limitado según su actor_type
--   - Puede o no tener cuenta Seencel al momento de ser invitado
-- ============================================================

-- Tipo de invitación: member (default existente) o external
ALTER TABLE public.organization_invitations 
    ADD COLUMN IF NOT EXISTS invitation_type text NOT NULL DEFAULT 'member';

-- Tipo de actor externo (solo para invitation_type = 'external')
ALTER TABLE public.organization_invitations 
    ADD COLUMN IF NOT EXISTS actor_type text NULL;

-- Hacer role_id nullable (los externos no necesitan un rol de miembro)
ALTER TABLE public.organization_invitations 
    ALTER COLUMN role_id DROP NOT NULL;

-- Validar: si es external, actor_type es obligatorio
ALTER TABLE public.organization_invitations
    ADD CONSTRAINT chk_external_actor_type CHECK (
        invitation_type = 'member' OR actor_type IS NOT NULL
    );

-- Validar: actor_type debe ser un valor válido si está presente
ALTER TABLE public.organization_invitations
    ADD CONSTRAINT chk_valid_actor_type CHECK (
        actor_type IS NULL OR actor_type IN (
            'client',
            'field_worker',
            'accountant',
            'external_site_manager',
            'subcontractor_portal_user'
        )
    );

-- Comentarios
COMMENT ON COLUMN public.organization_invitations.invitation_type IS 
    'Tipo de invitación: member (miembro interno del equipo) o external (colaborador externo)';

COMMENT ON COLUMN public.organization_invitations.actor_type IS 
    'Tipo de actor externo (solo aplica cuando invitation_type = external): client, field_worker, accountant, etc.';
