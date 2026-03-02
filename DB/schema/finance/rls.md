# Database Schema (Auto-generated)
> Generated: 2026-03-01T21:32:52.143Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [FINANCE] RLS Policies (129)

### `capital_adjustments` (3 policies)

#### MIEMBROS CREAN CAPITAL_ADJUSTMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN CAPITAL_ADJUSTMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN CAPITAL_ADJUSTMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'finance.view'::text)
```

### `capital_participants` (3 policies)

#### MIEMBROS CREAN CAPITAL_PARTICIPANTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN CAPITAL_PARTICIPANTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN CAPITAL_PARTICIPANTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'finance.view'::text)
```

### `client_commitments` (4 policies)

#### ACTORES VEN COMPROMISOS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN CLIENT_COMMITMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS EDITAN CLIENT_COMMITMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS VEN CLIENT_COMMITMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'commercial.view'::text)
```

### `client_payment_schedule` (3 policies)

#### MIEMBROS CREAN CLIENT_PAYMENT_SCHEDULE

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS EDITAN CLIENT_PAYMENT_SCHEDULE

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS VEN CLIENT_PAYMENT_SCHEDULE

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'commercial.view'::text)
```

### `client_payments` (4 policies)

#### ACTORES VEN PAGOS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN CLIENT_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS EDITAN CLIENT_PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS VEN CLIENT_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'commercial.view'::text)
```

### `currencies` (1 policies)

#### TODOS VEN CURRENCIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `economic_index_components` (3 policies)

#### MIEMBROS CREAN ECONOMIC_INDEX_COMPONENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM finance.economic_index_types eit
  WHERE ((eit.id = economic_index_components.index_type_id) AND can_mutate_org(eit.organization_id, 'finance.manage'::text))))
```

#### MIEMBROS EDITAN ECONOMIC_INDEX_COMPONENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.economic_index_types eit
  WHERE ((eit.id = economic_index_components.index_type_id) AND (((eit.is_system = true) AND is_admin()) OR ((eit.is_system = false) AND can_mutate_org(eit.organization_id, 'finance.manage'::text))))))
```

#### MIEMBROS VEN ECONOMIC_INDEX_COMPONENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.economic_index_types eit
  WHERE ((eit.id = economic_index_components.index_type_id) AND ((eit.is_system = true) OR is_org_member(eit.organization_id)))))
```

### `economic_index_types` (3 policies)

#### MIEMBROS CREAN ECONOMIC_INDEX_TYPES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN ECONOMIC_INDEX_TYPES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND can_mutate_org(organization_id, 'finance.manage'::text)))
```

#### MIEMBROS VEN ECONOMIC_INDEX_TYPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = true) OR is_org_member(organization_id))
```

### `economic_index_values` (3 policies)

#### MIEMBROS CREAN ECONOMIC_INDEX_VALUES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM finance.economic_index_types eit
  WHERE ((eit.id = economic_index_values.index_type_id) AND can_mutate_org(eit.organization_id, 'finance.manage'::text))))
```

#### MIEMBROS EDITAN ECONOMIC_INDEX_VALUES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.economic_index_types eit
  WHERE ((eit.id = economic_index_values.index_type_id) AND (((eit.is_system = true) AND is_admin()) OR ((eit.is_system = false) AND can_mutate_org(eit.organization_id, 'finance.manage'::text))))))
```

#### MIEMBROS VEN ECONOMIC_INDEX_VALUES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.economic_index_types eit
  WHERE ((eit.id = economic_index_values.index_type_id) AND ((eit.is_system = true) OR is_org_member(eit.organization_id)))))
```

### `exchange_rates` (2 policies)

#### ADMINS EDITAN EXCHANGE_RATES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN EXCHANGE_RATES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `financial_operation_movements` (3 policies)

#### MIEMBROS CREAN FINANCIAL_OPERATION_MOVEMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN FINANCIAL_OPERATION_MOVEMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN FINANCIAL_OPERATION_MOVEMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'finance.view'::text)
```

### `financial_operations` (3 policies)

#### MIEMBROS CREAN FINANCIAL_OPERATIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN FINANCIAL_OPERATIONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN FINANCIAL_OPERATIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'finance.view'::text)
```

### `general_cost_categories` (3 policies)

#### MIEMBROS ACTUALIZAN GENERAL_COST_CATEGORIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND can_mutate_org(organization_id, 'finance.manage'::text)))
```
- **WITH CHECK**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND can_mutate_org(organization_id, 'finance.manage'::text)))
```

#### MIEMBROS CREAN GENERAL_COST_CATEGORIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((is_system = false) AND can_mutate_org(organization_id, 'finance.manage'::text))
```

#### MIEMBROS VEN GENERAL_COST_CATEGORIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR ((is_deleted = false) AND ((is_system = true) OR can_view_org(organization_id, 'finance.view'::text))))
```

### `general_cost_payment_allocations` (2 policies)

#### MIEMBROS CREAN GENERAL_COST_PAYMENT_ALLOCATIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM finance.general_costs_payments gcp
  WHERE ((gcp.id = general_cost_payment_allocations.payment_id) AND can_mutate_org(gcp.organization_id, 'finance.manage'::text))))
```

#### MIEMBROS VEN GENERAL_COST_PAYMENT_ALLOCATIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.general_costs_payments gcp
  WHERE ((gcp.id = general_cost_payment_allocations.payment_id) AND can_view_org(gcp.organization_id, 'finance.view'::text))))
```

### `general_costs` (3 policies)

#### MIEMBROS ACTUALIZAN GENERAL_COSTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS CREAN GENERAL_COSTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN GENERAL_COSTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_deleted = false) AND can_view_org(organization_id, 'finance.view'::text))
```

### `general_costs_payments` (4 policies)

#### MIEMBROS ACTUALIZAN GENERAL_COSTS_PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS CREAN GENERAL_COSTS_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS ELIMINAN GENERAL_COSTS_PAYMENTS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN GENERAL_COSTS_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_deleted = false) AND can_view_org(organization_id, 'finance.view'::text))
```

### `indirect_costs` (3 policies)

#### MIEMBROS CREAN INDIRECT_COSTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN INDIRECT_COSTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN INDIRECT_COSTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'finance.view'::text)
```

### `indirect_costs_payments` (3 policies)

#### MIEMBROS CREAN INDIRECT_COSTS_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN INDIRECT_COSTS_PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN INDIRECT_COSTS_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'finance.view'::text)
```

### `labor_payments` (3 policies)

#### MIEMBROS CREAN LABOR_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS EDITAN LABOR_PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS VEN LABOR_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'construction.view'::text)
```

### `material_invoice_items` (3 policies)

#### MIEMBROS CREAN MATERIAL_INVOICE_ITEMS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS EDITAN MATERIAL_INVOICE_ITEMS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS VEN MATERIAL_INVOICE_ITEMS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'construction.view'::text)
```

### `material_invoices` (3 policies)

#### MIEMBROS CREAN MATERIAL_INVOICES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS EDITAN MATERIAL_INVOICES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS VEN MATERIAL_INVOICES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'construction.view'::text)
```

### `material_payments` (3 policies)

#### MIEMBROS CREAN MATERIAL_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS EDITAN MATERIAL_PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS VEN MATERIAL_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'construction.view'::text)
```

### `material_purchase_order_items` (3 policies)

#### MIEMBROS CREAN MATERIAL_PURCHASE_ORDER_ITEMS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM finance.material_purchase_orders po
  WHERE ((po.id = material_purchase_order_items.purchase_order_id) AND can_mutate_org(po.organization_id, 'construction.manage'::text))))
```

#### MIEMBROS EDITAN MATERIAL_PURCHASE_ORDER_ITEMS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.material_purchase_orders po
  WHERE ((po.id = material_purchase_order_items.purchase_order_id) AND can_mutate_org(po.organization_id, 'construction.manage'::text))))
```

#### MIEMBROS VEN MATERIAL_PURCHASE_ORDER_ITEMS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.material_purchase_orders po
  WHERE ((po.id = material_purchase_order_items.purchase_order_id) AND can_view_org(po.organization_id, 'construction.view'::text))))
```

### `material_purchase_orders` (3 policies)

#### MIEMBROS CREAN MATERIAL_PURCHASE_ORDERS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS EDITAN MATERIAL_PURCHASE_ORDERS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS VEN MATERIAL_PURCHASE_ORDERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'construction.view'::text)
```

### `movement_concepts` (3 policies)

#### MIEMBROS CREAN MOVEMENT_CONCEPTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'finance.manage'::text))
```

#### MIEMBROS EDITAN MOVEMENT_CONCEPTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND (organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'finance.manage'::text)))
```

#### MIEMBROS VEN MOVEMENT_CONCEPTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = true) OR ((organization_id IS NOT NULL) AND can_view_org(organization_id, 'finance.view'::text)))
```

### `movement_indirects` (2 policies)

#### MIEMBROS CREAN MOVEMENT_INDIRECTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM finance.movements m
  WHERE ((m.id = movement_indirects.movement_id) AND can_mutate_org(m.organization_id, 'finance.manage'::text))))
```

#### MIEMBROS VEN MOVEMENT_INDIRECTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.movements m
  WHERE ((m.id = movement_indirects.movement_id) AND can_view_org(m.organization_id, 'finance.view'::text))))
```

### `movements` (3 policies)

#### MIEMBROS CREAN MOVEMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN MOVEMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN MOVEMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'finance.view'::text)
```

### `organization_currencies` (3 policies)

#### MIEMBROS CREAN ORGANIZATION_CURRENCIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN ORGANIZATION_CURRENCIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN ORGANIZATION_CURRENCIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

### `organization_wallets` (3 policies)

#### MIEMBROS CREAN ORGANIZATION_WALLETS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN ORGANIZATION_WALLETS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN ORGANIZATION_WALLETS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

### `partner_capital_balance` (2 policies)

#### MIEMBROS EDITAN PARTNER_CAPITAL_BALANCE

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN PARTNER_CAPITAL_BALANCE

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'finance.view'::text)
```

### `partner_contributions` (3 policies)

#### MIEMBROS CREAN PARTNER_CONTRIBUTIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN PARTNER_CONTRIBUTIONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN PARTNER_CONTRIBUTIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'finance.view'::text)
```

### `partner_withdrawals` (3 policies)

#### MIEMBROS CREAN PARTNER_WITHDRAWALS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS EDITAN PARTNER_WITHDRAWALS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'finance.manage'::text)
```

#### MIEMBROS VEN PARTNER_WITHDRAWALS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'finance.view'::text)
```

### `pdf` (3 policies)

#### MIEMBROS CREAN PDF

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'finance.manage'::text))
```

#### MIEMBROS EDITAN PDF

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NULL) AND is_admin()) OR ((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'finance.manage'::text)))
```

#### MIEMBROS VEN PDF

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NULL) OR can_view_org(organization_id, 'finance.view'::text))
```

### `pdf_templates` (3 policies)

#### MIEMBROS CREAN PDF_TEMPLATES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'finance.manage'::text))
```

#### MIEMBROS EDITAN PDF_TEMPLATES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NULL) AND is_admin()) OR ((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'finance.manage'::text)))
```

#### MIEMBROS VEN PDF_TEMPLATES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NULL) OR can_view_org(organization_id, 'finance.view'::text))
```

### `personnel_rates` (3 policies)

#### MIEMBROS CREAN PERSONNEL_RATES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS EDITAN PERSONNEL_RATES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS VEN PERSONNEL_RATES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'construction.view'::text)
```

### `quote_items` (4 policies)

#### ACTORES VEN ITEMS PRESUPUESTO DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN QUOTE_ITEMS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS EDITAN QUOTE_ITEMS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS VEN QUOTE_ITEMS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'commercial.view'::text)
```

### `quotes` (4 policies)

#### EXTERNOS VEN QUOTES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS ACTUALIZAN QUOTES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS CREAN QUOTES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS VEN QUOTES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'commercial.view'::text)
```

### `subcontract_bid_tasks` (3 policies)

#### MIEMBROS CREAN SUBCONTRACT_BID_TASKS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM (finance.subcontract_bids sb
     JOIN finance.subcontracts s ON ((s.id = sb.subcontract_id)))
  WHERE ((sb.id = subcontract_bid_tasks.subcontract_bid_id) AND can_mutate_org(s.organization_id, 'construction.manage'::text))))
```

#### MIEMBROS EDITAN SUBCONTRACT_BID_TASKS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM (finance.subcontract_bids sb
     JOIN finance.subcontracts s ON ((s.id = sb.subcontract_id)))
  WHERE ((sb.id = subcontract_bid_tasks.subcontract_bid_id) AND can_mutate_org(s.organization_id, 'construction.manage'::text))))
```

#### MIEMBROS VEN SUBCONTRACT_BID_TASKS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM (finance.subcontract_bids sb
     JOIN finance.subcontracts s ON ((s.id = sb.subcontract_id)))
  WHERE ((sb.id = subcontract_bid_tasks.subcontract_bid_id) AND can_view_org(s.organization_id, 'construction.view'::text))))
```

### `subcontract_bids` (3 policies)

#### MIEMBROS CREAN SUBCONTRACT_BIDS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM finance.subcontracts s
  WHERE ((s.id = subcontract_bids.subcontract_id) AND can_mutate_org(s.organization_id, 'construction.manage'::text))))
```

#### MIEMBROS EDITAN SUBCONTRACT_BIDS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.subcontracts s
  WHERE ((s.id = subcontract_bids.subcontract_id) AND can_mutate_org(s.organization_id, 'construction.manage'::text))))
```

#### MIEMBROS VEN SUBCONTRACT_BIDS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.subcontracts s
  WHERE ((s.id = subcontract_bids.subcontract_id) AND can_view_org(s.organization_id, 'construction.view'::text))))
```

### `subcontract_payments` (3 policies)

#### MIEMBROS CREAN SUBCONTRACT_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS EDITAN SUBCONTRACT_PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS VEN SUBCONTRACT_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'construction.view'::text)
```

### `subcontract_tasks` (3 policies)

#### MIEMBROS CREAN SUBCONTRACT_TASKS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM finance.subcontracts s
  WHERE ((s.id = subcontract_tasks.subcontract_id) AND can_mutate_org(s.organization_id, 'construction.manage'::text))))
```

#### MIEMBROS EDITAN SUBCONTRACT_TASKS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.subcontracts s
  WHERE ((s.id = subcontract_tasks.subcontract_id) AND can_mutate_org(s.organization_id, 'construction.manage'::text))))
```

#### MIEMBROS VEN SUBCONTRACT_TASKS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM finance.subcontracts s
  WHERE ((s.id = subcontract_tasks.subcontract_id) AND can_view_org(s.organization_id, 'construction.view'::text))))
```

### `subcontracts` (3 policies)

#### MIEMBROS CREAN SUBCONTRACTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS EDITAN SUBCONTRACTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'construction.manage'::text)
```

#### MIEMBROS VEN SUBCONTRACTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'construction.view'::text)
```

### `tax_labels` (2 policies)

#### ADMINS GESTIONAN TAX_LABELS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN TAX_LABELS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `wallets` (2 policies)

#### ADMINS GESTIONAN WALLETS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS AUTENTICADOS VEN WALLETS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
true
```
