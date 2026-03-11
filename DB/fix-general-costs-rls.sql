-- ============================================================================
-- Fix: RLS de finance.general_costs — Soft delete bloqueado por SELECT policy
-- ============================================================================
--
-- PROBLEMA:
-- La policy SELECT de general_costs tiene:
--   (is_deleted = false) AND can_view_org(organization_id, 'finance.view')
--
-- Esto es INCONSISTENTE con las demás tablas del schema finance:
-- movements, financial_operations, capital_adjustments, etc. 
-- NINGUNA filtra is_deleted en la policy RLS.
--
-- El is_deleted en la policy SELECT impide que el soft delete funcione
-- porque PostgreSQL evalúa todas las policies durante un UPDATE.
--
-- SOLUCIÓN:
-- Quitar is_deleted de la policy SELECT (como el resto de las tablas).
-- El filtro is_deleted = false se aplica en las queries del frontend.
--
-- También se corrige general_costs_payments por consistencia.
-- ============================================================================

-- 1. Fix general_costs SELECT
DROP POLICY IF EXISTS "MIEMBROS VEN GENERAL_COSTS" ON finance.general_costs;

CREATE POLICY "MIEMBROS VEN GENERAL_COSTS"
ON finance.general_costs
FOR SELECT TO public
USING (
    can_view_org(organization_id, 'finance.view'::text)
);

-- 2. Fix general_costs_payments SELECT (misma inconsistencia)
DROP POLICY IF EXISTS "MIEMBROS VEN GENERAL_COSTS_PAYMENTS" ON finance.general_costs_payments;

CREATE POLICY "MIEMBROS VEN GENERAL_COSTS_PAYMENTS"
ON finance.general_costs_payments
FOR SELECT TO public
USING (
    can_view_org(organization_id, 'finance.view'::text)
);
