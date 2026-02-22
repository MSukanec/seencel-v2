# Database Schema (Auto-generated)
> Generated: 2026-02-22T20:08:16.861Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [FINANCE] RLS Policies (48)

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
