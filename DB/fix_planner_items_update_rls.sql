-- ============================================================================
-- FIX: planner.items UPDATE RLS policy
-- ============================================================================
-- Problema: La policy SELECT de planner.items tiene `is_deleted = false`.
-- Cuando el soft-delete hace UPDATE SET is_deleted = true, PostgREST
-- no puede verificar el row post-update contra la SELECT policy,
-- generando un 403.
--
-- Solución: Agregar WITH CHECK explícito a la policy UPDATE que
-- solo valide `is_org_member(organization_id)` — sin filtro de is_deleted.
-- Esto permite que el UPDATE cambie is_deleted sin conflicto.
-- ============================================================================

-- 1. Dropear la policy actual
DROP POLICY IF EXISTS "MIEMBROS EDITAN ITEMS" ON planner.items;

-- 2. Recrearla con WITH CHECK explícito
CREATE POLICY "MIEMBROS EDITAN ITEMS"
    ON planner.items
    FOR UPDATE
    TO authenticated
    USING (is_org_member(organization_id))
    WITH CHECK (is_org_member(organization_id));
