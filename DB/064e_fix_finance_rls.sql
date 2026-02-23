-- ==========================================
-- FIX: Agregar RLS policies faltantes en finance schema
-- Problema: 28 tablas con RLS habilitada pero sin policies
-- Con vistas INVOKER, los JOINs a estas tablas devuelven 0 filas
-- ==========================================

-- ==========================================
-- SECCIÓN 0: Asegurar RLS habilitada
-- ==========================================

ALTER TABLE finance.organization_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.organization_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.financial_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.financial_operation_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.capital_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.partner_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.partner_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.capital_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.partner_capital_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.material_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.material_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.material_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.material_purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.movement_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.movement_indirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.indirect_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.indirect_costs_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.general_cost_payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.personnel_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.pdf ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.subcontract_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.subcontract_bid_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.subcontract_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.economic_index_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.economic_index_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.economic_index_values ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- SECCIÓN 1: ORGANIZATION_WALLETS
-- Cross-domain: usado por TODOS los tipos de pagos
-- SELECT amplio para cualquier miembro de la org
-- ==========================================

CREATE POLICY "MIEMBROS VEN ORGANIZATION_WALLETS"
    ON finance.organization_wallets FOR SELECT
    USING (is_org_member(organization_id));

CREATE POLICY "MIEMBROS CREAN ORGANIZATION_WALLETS"
    ON finance.organization_wallets FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN ORGANIZATION_WALLETS"
    ON finance.organization_wallets FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));


-- ==========================================
-- SECCIÓN 2: ORGANIZATION_CURRENCIES
-- Cross-domain: usado por TODOS los módulos financieros
-- ==========================================

CREATE POLICY "MIEMBROS VEN ORGANIZATION_CURRENCIES"
    ON finance.organization_currencies FOR SELECT
    USING (is_org_member(organization_id));

CREATE POLICY "MIEMBROS CREAN ORGANIZATION_CURRENCIES"
    ON finance.organization_currencies FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN ORGANIZATION_CURRENCIES"
    ON finance.organization_currencies FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));


-- ==========================================
-- SECCIÓN 3: FINANCIAL_OPERATIONS + MOVEMENTS
-- Cambios de moneda y transferencias
-- ==========================================

CREATE POLICY "MIEMBROS VEN FINANCIAL_OPERATIONS"
    ON finance.financial_operations FOR SELECT
    USING (can_view_org(organization_id, 'finance.view'::text));

CREATE POLICY "MIEMBROS CREAN FINANCIAL_OPERATIONS"
    ON finance.financial_operations FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN FINANCIAL_OPERATIONS"
    ON finance.financial_operations FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS VEN FINANCIAL_OPERATION_MOVEMENTS"
    ON finance.financial_operation_movements FOR SELECT
    USING (can_view_org(organization_id, 'finance.view'::text));

CREATE POLICY "MIEMBROS CREAN FINANCIAL_OPERATION_MOVEMENTS"
    ON finance.financial_operation_movements FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN FINANCIAL_OPERATION_MOVEMENTS"
    ON finance.financial_operation_movements FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));


-- ==========================================
-- SECCIÓN 4: CAPITAL (participants, contributions, withdrawals, adjustments, balance)
-- ==========================================

CREATE POLICY "MIEMBROS VEN CAPITAL_PARTICIPANTS"
    ON finance.capital_participants FOR SELECT
    USING (can_view_org(organization_id, 'finance.view'::text));

CREATE POLICY "MIEMBROS CREAN CAPITAL_PARTICIPANTS"
    ON finance.capital_participants FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN CAPITAL_PARTICIPANTS"
    ON finance.capital_participants FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS VEN PARTNER_CONTRIBUTIONS"
    ON finance.partner_contributions FOR SELECT
    USING (can_view_org(organization_id, 'finance.view'::text));

CREATE POLICY "MIEMBROS CREAN PARTNER_CONTRIBUTIONS"
    ON finance.partner_contributions FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN PARTNER_CONTRIBUTIONS"
    ON finance.partner_contributions FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS VEN PARTNER_WITHDRAWALS"
    ON finance.partner_withdrawals FOR SELECT
    USING (can_view_org(organization_id, 'finance.view'::text));

CREATE POLICY "MIEMBROS CREAN PARTNER_WITHDRAWALS"
    ON finance.partner_withdrawals FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN PARTNER_WITHDRAWALS"
    ON finance.partner_withdrawals FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS VEN CAPITAL_ADJUSTMENTS"
    ON finance.capital_adjustments FOR SELECT
    USING (can_view_org(organization_id, 'finance.view'::text));

CREATE POLICY "MIEMBROS CREAN CAPITAL_ADJUSTMENTS"
    ON finance.capital_adjustments FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN CAPITAL_ADJUSTMENTS"
    ON finance.capital_adjustments FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS VEN PARTNER_CAPITAL_BALANCE"
    ON finance.partner_capital_balance FOR SELECT
    USING (can_view_org(organization_id, 'finance.view'::text));

CREATE POLICY "MIEMBROS EDITAN PARTNER_CAPITAL_BALANCE"
    ON finance.partner_capital_balance FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));


-- ==========================================
-- SECCIÓN 5: MATERIAL INVOICES + ITEMS
-- Procurement: dominio construction
-- ==========================================

CREATE POLICY "MIEMBROS VEN MATERIAL_INVOICES"
    ON finance.material_invoices FOR SELECT
    USING (can_view_org(organization_id, 'construction.view'::text));

CREATE POLICY "MIEMBROS CREAN MATERIAL_INVOICES"
    ON finance.material_invoices FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS EDITAN MATERIAL_INVOICES"
    ON finance.material_invoices FOR UPDATE
    USING (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS VEN MATERIAL_INVOICE_ITEMS"
    ON finance.material_invoice_items FOR SELECT
    USING (can_view_org(organization_id, 'construction.view'::text));

CREATE POLICY "MIEMBROS CREAN MATERIAL_INVOICE_ITEMS"
    ON finance.material_invoice_items FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS EDITAN MATERIAL_INVOICE_ITEMS"
    ON finance.material_invoice_items FOR UPDATE
    USING (can_mutate_org(organization_id, 'construction.manage'::text));


-- ==========================================
-- SECCIÓN 6: MATERIAL PURCHASE ORDERS + ITEMS
-- ==========================================

CREATE POLICY "MIEMBROS VEN MATERIAL_PURCHASE_ORDERS"
    ON finance.material_purchase_orders FOR SELECT
    USING (can_view_org(organization_id, 'construction.view'::text));

CREATE POLICY "MIEMBROS CREAN MATERIAL_PURCHASE_ORDERS"
    ON finance.material_purchase_orders FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS EDITAN MATERIAL_PURCHASE_ORDERS"
    ON finance.material_purchase_orders FOR UPDATE
    USING (can_mutate_org(organization_id, 'construction.manage'::text));

-- material_purchase_order_items: organization_id es nullable, usar parent
CREATE POLICY "MIEMBROS VEN MATERIAL_PURCHASE_ORDER_ITEMS"
    ON finance.material_purchase_order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM finance.material_purchase_orders po
            WHERE po.id = purchase_order_id
              AND can_view_org(po.organization_id, 'construction.view'::text)
        )
    );

CREATE POLICY "MIEMBROS CREAN MATERIAL_PURCHASE_ORDER_ITEMS"
    ON finance.material_purchase_order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM finance.material_purchase_orders po
            WHERE po.id = purchase_order_id
              AND can_mutate_org(po.organization_id, 'construction.manage'::text)
        )
    );

CREATE POLICY "MIEMBROS EDITAN MATERIAL_PURCHASE_ORDER_ITEMS"
    ON finance.material_purchase_order_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM finance.material_purchase_orders po
            WHERE po.id = purchase_order_id
              AND can_mutate_org(po.organization_id, 'construction.manage'::text)
        )
    );


-- ==========================================
-- SECCIÓN 7: SUBCONTRACT AUXILIARY TABLES
-- Bids, bid_tasks, tasks → dominio construction via parent
-- ==========================================

CREATE POLICY "MIEMBROS VEN SUBCONTRACT_BIDS"
    ON finance.subcontract_bids FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM finance.subcontracts s
            WHERE s.id = subcontract_id
              AND can_view_org(s.organization_id, 'construction.view'::text)
        )
    );

CREATE POLICY "MIEMBROS CREAN SUBCONTRACT_BIDS"
    ON finance.subcontract_bids FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM finance.subcontracts s
            WHERE s.id = subcontract_id
              AND can_mutate_org(s.organization_id, 'construction.manage'::text)
        )
    );

CREATE POLICY "MIEMBROS EDITAN SUBCONTRACT_BIDS"
    ON finance.subcontract_bids FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM finance.subcontracts s
            WHERE s.id = subcontract_id
              AND can_mutate_org(s.organization_id, 'construction.manage'::text)
        )
    );

CREATE POLICY "MIEMBROS VEN SUBCONTRACT_BID_TASKS"
    ON finance.subcontract_bid_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM finance.subcontract_bids sb
            JOIN finance.subcontracts s ON s.id = sb.subcontract_id
            WHERE sb.id = subcontract_bid_id
              AND can_view_org(s.organization_id, 'construction.view'::text)
        )
    );

CREATE POLICY "MIEMBROS CREAN SUBCONTRACT_BID_TASKS"
    ON finance.subcontract_bid_tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM finance.subcontract_bids sb
            JOIN finance.subcontracts s ON s.id = sb.subcontract_id
            WHERE sb.id = subcontract_bid_id
              AND can_mutate_org(s.organization_id, 'construction.manage'::text)
        )
    );

CREATE POLICY "MIEMBROS EDITAN SUBCONTRACT_BID_TASKS"
    ON finance.subcontract_bid_tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM finance.subcontract_bids sb
            JOIN finance.subcontracts s ON s.id = sb.subcontract_id
            WHERE sb.id = subcontract_bid_id
              AND can_mutate_org(s.organization_id, 'construction.manage'::text)
        )
    );

CREATE POLICY "MIEMBROS VEN SUBCONTRACT_TASKS"
    ON finance.subcontract_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM finance.subcontracts s
            WHERE s.id = subcontract_id
              AND can_view_org(s.organization_id, 'construction.view'::text)
        )
    );

CREATE POLICY "MIEMBROS CREAN SUBCONTRACT_TASKS"
    ON finance.subcontract_tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM finance.subcontracts s
            WHERE s.id = subcontract_id
              AND can_mutate_org(s.organization_id, 'construction.manage'::text)
        )
    );

CREATE POLICY "MIEMBROS EDITAN SUBCONTRACT_TASKS"
    ON finance.subcontract_tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM finance.subcontracts s
            WHERE s.id = subcontract_id
              AND can_mutate_org(s.organization_id, 'construction.manage'::text)
        )
    );


-- ==========================================
-- SECCIÓN 8: LEGACY MOVEMENTS
-- ==========================================

CREATE POLICY "MIEMBROS VEN MOVEMENTS"
    ON finance.movements FOR SELECT
    USING (can_view_org(organization_id, 'finance.view'::text));

CREATE POLICY "MIEMBROS CREAN MOVEMENTS"
    ON finance.movements FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN MOVEMENTS"
    ON finance.movements FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));

-- movement_concepts: organization_id nullable (system + org-specific)
CREATE POLICY "MIEMBROS VEN MOVEMENT_CONCEPTS"
    ON finance.movement_concepts FOR SELECT
    USING (
        is_system = true
        OR (organization_id IS NOT NULL AND can_view_org(organization_id, 'finance.view'::text))
    );

CREATE POLICY "MIEMBROS CREAN MOVEMENT_CONCEPTS"
    ON finance.movement_concepts FOR INSERT
    WITH CHECK (
        organization_id IS NOT NULL AND can_mutate_org(organization_id, 'finance.manage'::text)
    );

CREATE POLICY "MIEMBROS EDITAN MOVEMENT_CONCEPTS"
    ON finance.movement_concepts FOR UPDATE
    USING (
        (is_system = true AND is_admin())
        OR (is_system = false AND organization_id IS NOT NULL AND can_mutate_org(organization_id, 'finance.manage'::text))
    );

-- movement_indirects: no org_id, via movement parent
CREATE POLICY "MIEMBROS VEN MOVEMENT_INDIRECTS"
    ON finance.movement_indirects FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM finance.movements m
            WHERE m.id = movement_id
              AND can_view_org(m.organization_id, 'finance.view'::text)
        )
    );

CREATE POLICY "MIEMBROS CREAN MOVEMENT_INDIRECTS"
    ON finance.movement_indirects FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM finance.movements m
            WHERE m.id = movement_id
              AND can_mutate_org(m.organization_id, 'finance.manage'::text)
        )
    );


-- ==========================================
-- SECCIÓN 9: INDIRECT COSTS
-- ==========================================

CREATE POLICY "MIEMBROS VEN INDIRECT_COSTS"
    ON finance.indirect_costs FOR SELECT
    USING (can_view_org(organization_id, 'finance.view'::text));

CREATE POLICY "MIEMBROS CREAN INDIRECT_COSTS"
    ON finance.indirect_costs FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN INDIRECT_COSTS"
    ON finance.indirect_costs FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS VEN INDIRECT_COSTS_PAYMENTS"
    ON finance.indirect_costs_payments FOR SELECT
    USING (can_view_org(organization_id, 'finance.view'::text));

CREATE POLICY "MIEMBROS CREAN INDIRECT_COSTS_PAYMENTS"
    ON finance.indirect_costs_payments FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN INDIRECT_COSTS_PAYMENTS"
    ON finance.indirect_costs_payments FOR UPDATE
    USING (can_mutate_org(organization_id, 'finance.manage'::text));


-- ==========================================
-- SECCIÓN 10: GENERAL COST PAYMENT ALLOCATIONS
-- No tiene organization_id, usa parent payment
-- ==========================================

CREATE POLICY "MIEMBROS VEN GENERAL_COST_PAYMENT_ALLOCATIONS"
    ON finance.general_cost_payment_allocations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM finance.general_costs_payments gcp
            WHERE gcp.id = payment_id
              AND can_view_org(gcp.organization_id, 'finance.view'::text)
        )
    );

CREATE POLICY "MIEMBROS CREAN GENERAL_COST_PAYMENT_ALLOCATIONS"
    ON finance.general_cost_payment_allocations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM finance.general_costs_payments gcp
            WHERE gcp.id = payment_id
              AND can_mutate_org(gcp.organization_id, 'finance.manage'::text)
        )
    );


-- ==========================================
-- SECCIÓN 11: PERSONNEL RATES
-- ==========================================

CREATE POLICY "MIEMBROS VEN PERSONNEL_RATES"
    ON finance.personnel_rates FOR SELECT
    USING (can_view_org(organization_id, 'construction.view'::text));

CREATE POLICY "MIEMBROS CREAN PERSONNEL_RATES"
    ON finance.personnel_rates FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS EDITAN PERSONNEL_RATES"
    ON finance.personnel_rates FOR UPDATE
    USING (can_mutate_org(organization_id, 'construction.manage'::text));


-- ==========================================
-- SECCIÓN 12: PDF + PDF_TEMPLATES
-- organization_id nullable (system templates)
-- ==========================================

CREATE POLICY "MIEMBROS VEN PDF"
    ON finance.pdf FOR SELECT
    USING (
        organization_id IS NULL
        OR can_view_org(organization_id, 'finance.view'::text)
    );

CREATE POLICY "MIEMBROS CREAN PDF"
    ON finance.pdf FOR INSERT
    WITH CHECK (
        organization_id IS NOT NULL AND can_mutate_org(organization_id, 'finance.manage'::text)
    );

CREATE POLICY "MIEMBROS EDITAN PDF"
    ON finance.pdf FOR UPDATE
    USING (
        (organization_id IS NULL AND is_admin())
        OR (organization_id IS NOT NULL AND can_mutate_org(organization_id, 'finance.manage'::text))
    );

CREATE POLICY "MIEMBROS VEN PDF_TEMPLATES"
    ON finance.pdf_templates FOR SELECT
    USING (
        organization_id IS NULL
        OR can_view_org(organization_id, 'finance.view'::text)
    );

CREATE POLICY "MIEMBROS CREAN PDF_TEMPLATES"
    ON finance.pdf_templates FOR INSERT
    WITH CHECK (
        organization_id IS NOT NULL AND can_mutate_org(organization_id, 'finance.manage'::text)
    );

CREATE POLICY "MIEMBROS EDITAN PDF_TEMPLATES"
    ON finance.pdf_templates FOR UPDATE
    USING (
        (organization_id IS NULL AND is_admin())
        OR (organization_id IS NOT NULL AND can_mutate_org(organization_id, 'finance.manage'::text))
    );


-- ==========================================
-- SECCIÓN 13: ECONOMIC INDEX (types, components, values)
-- Cross-domain: usado por subcontracts
-- ==========================================

CREATE POLICY "MIEMBROS VEN ECONOMIC_INDEX_TYPES"
    ON finance.economic_index_types FOR SELECT
    USING (
        is_system = true
        OR is_org_member(organization_id)
    );

CREATE POLICY "MIEMBROS CREAN ECONOMIC_INDEX_TYPES"
    ON finance.economic_index_types FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'finance.manage'::text));

CREATE POLICY "MIEMBROS EDITAN ECONOMIC_INDEX_TYPES"
    ON finance.economic_index_types FOR UPDATE
    USING (
        (is_system = true AND is_admin())
        OR (is_system = false AND can_mutate_org(organization_id, 'finance.manage'::text))
    );

-- economic_index_components: no org_id, via index_type parent
CREATE POLICY "MIEMBROS VEN ECONOMIC_INDEX_COMPONENTS"
    ON finance.economic_index_components FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM finance.economic_index_types eit
            WHERE eit.id = index_type_id
              AND (eit.is_system = true OR is_org_member(eit.organization_id))
        )
    );

CREATE POLICY "MIEMBROS CREAN ECONOMIC_INDEX_COMPONENTS"
    ON finance.economic_index_components FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM finance.economic_index_types eit
            WHERE eit.id = index_type_id
              AND can_mutate_org(eit.organization_id, 'finance.manage'::text)
        )
    );

CREATE POLICY "MIEMBROS EDITAN ECONOMIC_INDEX_COMPONENTS"
    ON finance.economic_index_components FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM finance.economic_index_types eit
            WHERE eit.id = index_type_id
              AND (
                  (eit.is_system = true AND is_admin())
                  OR (eit.is_system = false AND can_mutate_org(eit.organization_id, 'finance.manage'::text))
              )
        )
    );

-- economic_index_values: no org_id, via index_type parent
CREATE POLICY "MIEMBROS VEN ECONOMIC_INDEX_VALUES"
    ON finance.economic_index_values FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM finance.economic_index_types eit
            WHERE eit.id = index_type_id
              AND (eit.is_system = true OR is_org_member(eit.organization_id))
        )
    );

CREATE POLICY "MIEMBROS CREAN ECONOMIC_INDEX_VALUES"
    ON finance.economic_index_values FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM finance.economic_index_types eit
            WHERE eit.id = index_type_id
              AND can_mutate_org(eit.organization_id, 'finance.manage'::text)
        )
    );

CREATE POLICY "MIEMBROS EDITAN ECONOMIC_INDEX_VALUES"
    ON finance.economic_index_values FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM finance.economic_index_types eit
            WHERE eit.id = index_type_id
              AND (
                  (eit.is_system = true AND is_admin())
                  OR (eit.is_system = false AND can_mutate_org(eit.organization_id, 'finance.manage'::text))
              )
        )
    );


-- ==========================================
-- SECCIÓN 14: GRANTS (asegurar permisos de schema)
-- ==========================================

GRANT ALL ON ALL TABLES IN SCHEMA finance TO authenticated, service_role;


-- ==========================================
-- VERIFICACIÓN: Confirmar que todas las tablas tienen policies
-- Ejecutar después del script para validar
-- ==========================================

-- Tablas SIN policies (debería devolver 0 filas):
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'finance' 
  AND tablename NOT IN (
    SELECT DISTINCT tablename 
    FROM pg_policies 
    WHERE schemaname = 'finance'
  )
ORDER BY tablename;
