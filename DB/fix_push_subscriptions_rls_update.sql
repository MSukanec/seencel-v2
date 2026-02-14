-- ============================================================================
-- FIX: Agregar política UPDATE a push_subscriptions
-- ============================================================================
-- BUG: El upsert de push_subscriptions falla cuando el endpoint ya existe
-- porque la tabla tiene RLS pero NO tiene política UPDATE.
-- Supabase upsert = INSERT OR UPDATE, y sin política UPDATE el UPDATE falla.
-- ============================================================================

-- UPDATE: solo actualizar propias
CREATE POLICY "push_subscriptions_update_own"
    ON public.push_subscriptions FOR UPDATE
    USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());
