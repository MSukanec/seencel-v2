-- ============================================================
-- 002: CREATE organization_external_actors
-- ============================================================
-- Tabla unificada para actores externos con acceso a la plataforma.
-- Un "actor externo" es alguien que:
--   - Tiene una cuenta Seencel (users)
--   - NO es miembro interno de la organización (organization_members)
--   - Tiene acceso limitado según su actor_type
--
-- Flujo típico:
--   1. Se crea un contacto (contacts)
--   2. Se lo vincula a un proyecto (project_clients, project_labor, etc.)
--   3. El contacto se registra en Seencel (users + contacts.linked_user_id)
--   4. Se lo invita como actor externo → organization_external_actors
--   5. El sistema le muestra un sidebar dinámico según actor_type
--
-- actor_type valores:
--   - 'client'                    → Cliente con acceso al portal
--   - 'field_worker'              → Albañil / trabajador de campo
--   - 'accountant'                → Contador externo
--   - 'external_site_manager'     → Director de obra externo
--   - 'subcontractor_portal_user' → Usuario de portal de subcontratista
-- ============================================================

CREATE TABLE IF NOT EXISTS public.organization_external_actors (
    id              uuid        NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL,
    user_id         uuid        NOT NULL,
    actor_type      text        NOT NULL,
    is_active       boolean     NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    created_by      uuid        NULL,
    updated_by      uuid        NULL,
    is_deleted      boolean     NOT NULL DEFAULT false,
    deleted_at      timestamptz NULL,

    -- PK
    CONSTRAINT organization_external_actors_pkey PRIMARY KEY (id),

    -- FKs
    CONSTRAINT oea_organization_fk FOREIGN KEY (organization_id) 
        REFERENCES public.organizations(id) ON DELETE CASCADE,
    CONSTRAINT oea_user_fk FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT oea_created_by_fk FOREIGN KEY (created_by) 
        REFERENCES public.organization_members(id),
    CONSTRAINT oea_updated_by_fk FOREIGN KEY (updated_by) 
        REFERENCES public.organization_members(id),

    -- Un usuario solo puede ser actor externo una vez por organización
    CONSTRAINT oea_unique_org_user UNIQUE (organization_id, user_id),

    -- Validar actor_type contra valores conocidos
    CONSTRAINT oea_valid_actor_type CHECK (
        actor_type IN (
            'client',
            'field_worker',
            'accountant',
            'external_site_manager',
            'subcontractor_portal_user'
        )
    )
);

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_oea_organization 
    ON public.organization_external_actors (organization_id);

CREATE INDEX IF NOT EXISTS idx_oea_user 
    ON public.organization_external_actors (user_id);

CREATE INDEX IF NOT EXISTS idx_oea_actor_type 
    ON public.organization_external_actors (organization_id, actor_type);

-- ============================================================
-- Trigger: updated_at automático (usa set_timestamp del sistema)
-- ============================================================
CREATE TRIGGER oea_set_updated_at
    BEFORE UPDATE ON public.organization_external_actors
    FOR EACH ROW
    EXECUTE FUNCTION public.set_timestamp();

-- ============================================================
-- Trigger: handle_updated_by (created_by / updated_by automáticos)
-- ============================================================
CREATE TRIGGER set_updated_by_oea
    BEFORE INSERT OR UPDATE ON public.organization_external_actors
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_by();

-- ============================================================
-- Comentarios
-- ============================================================
COMMENT ON TABLE public.organization_external_actors IS 
    'Actores externos con cuenta Seencel que tienen acceso limitado a la organización según su tipo (client, field_worker, accountant, etc.)';

COMMENT ON COLUMN public.organization_external_actors.actor_type IS 
    'Tipo de actor externo: client, field_worker, accountant, external_site_manager, subcontractor_portal_user';

COMMENT ON COLUMN public.organization_external_actors.is_active IS 
    'Si el acceso del actor está activo. Desactivar para suspender temporalmente sin borrar.';
