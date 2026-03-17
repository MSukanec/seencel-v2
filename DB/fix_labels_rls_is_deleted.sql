-- =============================================
-- Fix: Labels SELECT RLS sin is_deleted filter
-- Fecha: 2026-03-16
-- Contexto: La política "MIEMBROS VEN LABELS" no filtra is_deleted,
--           permitiendo que labels borradas sean visibles.
-- =============================================

-- DROP la política actual
DROP POLICY IF EXISTS "MIEMBROS VEN LABELS" ON planner.labels;

-- Recrear con filtro is_deleted = false
CREATE POLICY "MIEMBROS VEN LABELS"
    ON planner.labels
    FOR SELECT
    TO authenticated
    USING (
        (is_deleted = false) AND is_org_member(organization_id)
    );
