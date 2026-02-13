-- ============================================================================
-- PUSH SUBSCRIPTIONS TABLE
-- Almacena las suscripciones Web Push de cada usuario.
-- Un usuario puede tener múltiples dispositivos/browsers suscritos.
-- ============================================================================

-- 1. Crear tabla
CREATE TABLE public.push_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT push_subscriptions_user_endpoint_key UNIQUE (user_id, endpoint),
    CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. Index para búsqueda rápida por user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
    ON public.push_subscriptions USING btree (user_id) TABLESPACE pg_default;

-- 3. RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- SELECT: solo ver propias
CREATE POLICY "push_subscriptions_select_own"
    ON public.push_subscriptions FOR SELECT
    USING (user_id = get_current_user_id());

-- INSERT: solo insertar propias
CREATE POLICY "push_subscriptions_insert_own"
    ON public.push_subscriptions FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

-- DELETE: solo borrar propias
CREATE POLICY "push_subscriptions_delete_own"
    ON public.push_subscriptions FOR DELETE
    USING (user_id = get_current_user_id());

-- Service role bypass (para que la API route pueda leer suscripciones de cualquier user)
-- Supabase service_role ya bypasea RLS por defecto, no se necesita policy extra.
