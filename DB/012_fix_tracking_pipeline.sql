-- ============================================================================
-- 012: Fix Pipeline de Tracking de Actividad
-- Fecha: 2026-02-17
-- Descripción:
--   Corrige bugs críticos en el sistema de tracking:
--   1. Hace org_id nullable para soportar usuarios sin organización
--   2. Renombra org_id → organization_id para consistencia
--   3. Elimina constraint UNIQUE redundante
--   4. Recrea funciones SQL para aceptar organization_id nullable
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: Corregir tabla user_presence
-- ─────────────────────────────────────────────────────────────────────────────

-- 1a. Hacer org_id nullable (permite usuarios sin organización)
ALTER TABLE user_presence ALTER COLUMN org_id DROP NOT NULL;

-- 1b. Renombrar a organization_id para consistencia con user_view_history
ALTER TABLE user_presence RENAME COLUMN org_id TO organization_id;

-- 1c. Eliminar constraint UNIQUE redundante (PK ya implica UNIQUE)
ALTER TABLE user_presence DROP CONSTRAINT IF EXISTS user_presence_user_id_key;

-- 1d. Recrear índice con nombre consistente
DROP INDEX IF EXISTS user_presence_org_idx;
CREATE INDEX IF NOT EXISTS idx_user_presence_organization 
    ON user_presence (organization_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: Recrear heartbeat() — ahora acepta org null + usa organization_id
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.heartbeat(
    p_org_id uuid DEFAULT NULL,
    p_status text DEFAULT 'online',
    p_session_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_auth_id uuid;
    v_user_id uuid;
BEGIN
    -- Auth check
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN RAISE EXCEPTION 'Unauthenticated'; END IF;

    SELECT u.id INTO v_user_id FROM public.users u WHERE u.auth_id = v_auth_id LIMIT 1;
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not provisioned'; END IF;

    -- Upsert presencia
    INSERT INTO public.user_presence (
        user_id, organization_id, session_id, last_seen_at, status, updated_from, updated_at
    ) VALUES (
        v_user_id, p_org_id, p_session_id, now(), COALESCE(p_status, 'online'), 'heartbeat', now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        organization_id = COALESCE(EXCLUDED.organization_id, user_presence.organization_id),
        session_id = EXCLUDED.session_id,
        last_seen_at = EXCLUDED.last_seen_at,
        status = EXCLUDED.status,
        updated_at = now();

    -- Actualizar duración de la sesión actual (si existe)
    IF p_session_id IS NOT NULL THEN
        UPDATE public.user_view_history
        SET
            exited_at = now(),
            duration_seconds = EXTRACT(EPOCH FROM (now() - entered_at))::integer
        WHERE user_id = v_user_id
          AND session_id = p_session_id
          AND exited_at IS NULL;
    END IF;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: Recrear analytics_track_navigation() — acepta org null
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.analytics_track_navigation(
    p_org_id uuid,
    p_view_name text,
    p_session_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT u.id INTO v_user_id FROM public.users u WHERE u.auth_id = auth.uid() LIMIT 1;
    IF v_user_id IS NULL THEN RETURN; END IF;

    -- A. Cerrar vista anterior de ESTA sesión
    UPDATE public.user_view_history
    SET
        exited_at = now(),
        duration_seconds = EXTRACT(EPOCH FROM (now() - entered_at))::integer
    WHERE user_id = v_user_id
      AND session_id = p_session_id
      AND exited_at IS NULL;

    -- B. Abrir nueva vista
    INSERT INTO public.user_view_history (
        user_id, organization_id, session_id, view_name, entered_at
    ) VALUES (
        v_user_id, p_org_id, p_session_id, p_view_name, now()
    );

    -- C. Actualizar Presencia en tiempo real
    INSERT INTO public.user_presence (
        user_id, organization_id, session_id, last_seen_at, current_view, status, updated_from, updated_at
    ) VALUES (
        v_user_id, p_org_id, p_session_id, now(), p_view_name, 'online', 'navigation', now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        organization_id = COALESCE(EXCLUDED.organization_id, user_presence.organization_id),
        session_id = EXCLUDED.session_id,
        last_seen_at = EXCLUDED.last_seen_at,
        current_view = EXCLUDED.current_view,
        status = 'online',
        updated_at = now();
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4: Recrear vistas afectadas por el renombre org_id → organization_id
-- ─────────────────────────────────────────────────────────────────────────────

-- analytics_hourly_activity_view (ya fue recreada en 011, no usa org_id)
-- analytics_realtime_overview_view usa user_presence pero la columna que lee es status y last_seen_at, no org_id

-- Verificar si alguna vista referencia user_presence.org_id:
-- analytics_realtime_overview_view: usa up.last_seen_at y up.status → ✅ no afectada
-- La vista que listaba user_presence.org_id no existe más (las user_* muertas ya fueron eliminadas)
