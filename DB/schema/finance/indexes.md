# Database Schema (Auto-generated)
> Generated: 2026-03-01T21:32:52.143Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [FINANCE] Indexes (135, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| capital_adjustments | idx_capital_adjustments_not_deleted | `CREATE INDEX idx_capital_adjustments_not_deleted ON finance.capital_adjustmen...` |
| capital_adjustments | idx_capital_adjustments_org_date | `CREATE INDEX idx_capital_adjustments_org_date ON finance.capital_adjustments ...` |
| capital_adjustments | idx_capital_adjustments_partner_date | `CREATE INDEX idx_capital_adjustments_partner_date ON finance.capital_adjustme...` |
| capital_participants | idx_capital_participants_ownership_percentage | `CREATE INDEX idx_capital_participants_ownership_percentage ON finance.capital...` |
| capital_participants | idx_partners_contact | `CREATE INDEX idx_partners_contact ON finance.capital_participants USING btree...` |
| capital_participants | idx_partners_created_at | `CREATE INDEX idx_partners_created_at ON finance.capital_participants USING bt...` |
| capital_participants | idx_partners_organization | `CREATE INDEX idx_partners_organization ON finance.capital_participants USING ...` |
| capital_participants | idx_partners_status | `CREATE INDEX idx_partners_status ON finance.capital_participants USING btree ...` |
| capital_participants | uniq_partner_organization_contact | `CREATE UNIQUE INDEX uniq_partner_organization_contact ON finance.capital_part...` |
| client_commitments | client_commitments_not_deleted_idx | `CREATE INDEX client_commitments_not_deleted_idx ON finance.client_commitments...` |
| client_commitments | idx_client_commitments_client | `CREATE INDEX idx_client_commitments_client ON finance.client_commitments USIN...` |
| client_commitments | idx_client_commitments_created_at | `CREATE INDEX idx_client_commitments_created_at ON finance.client_commitments ...` |
| client_commitments | idx_client_commitments_currency | `CREATE INDEX idx_client_commitments_currency ON finance.client_commitments US...` |
| client_commitments | idx_client_commitments_method | `CREATE INDEX idx_client_commitments_method ON finance.client_commitments USIN...` |
| client_commitments | idx_client_commitments_org | `CREATE INDEX idx_client_commitments_org ON finance.client_commitments USING b...` |
| client_commitments | idx_client_commitments_org_project | `CREATE INDEX idx_client_commitments_org_project ON finance.client_commitments...` |
| client_commitments | idx_client_commitments_quote | `CREATE INDEX idx_client_commitments_quote ON finance.client_commitments USING...` |
| client_commitments | idx_commitments_org_project_client | `CREATE INDEX idx_commitments_org_project_client ON finance.client_commitments...` |
| client_payment_schedule | client_payment_schedule_commitment_idx | `CREATE INDEX client_payment_schedule_commitment_idx ON finance.client_payment...` |
| client_payment_schedule | client_payment_schedule_due_idx | `CREATE INDEX client_payment_schedule_due_idx ON finance.client_payment_schedu...` |
| client_payment_schedule | client_payment_schedule_not_deleted_idx | `CREATE INDEX client_payment_schedule_not_deleted_idx ON finance.client_paymen...` |
| client_payment_schedule | client_payment_schedule_org_commitment_due_idx | `CREATE INDEX client_payment_schedule_org_commitment_due_idx ON finance.client...` |
| client_payment_schedule | client_payment_schedule_org_idx | `CREATE INDEX client_payment_schedule_org_idx ON finance.client_payment_schedu...` |
| client_payments | idx_client_payments_commitment | `CREATE INDEX idx_client_payments_commitment ON finance.client_payments USING ...` |
| client_payments | idx_client_payments_date | `CREATE INDEX idx_client_payments_date ON finance.client_payments USING btree ...` |
| client_payments | idx_client_payments_import_batch | `CREATE INDEX idx_client_payments_import_batch ON finance.client_payments USIN...` |
| client_payments | idx_client_payments_not_deleted | `CREATE INDEX idx_client_payments_not_deleted ON finance.client_payments USING...` |
| client_payments | idx_client_payments_org_project | `CREATE INDEX idx_client_payments_org_project ON finance.client_payments USING...` |
| client_payments | idx_client_payments_schedule | `CREATE INDEX idx_client_payments_schedule ON finance.client_payments USING bt...` |
| client_payments | idx_client_payments_view_org | `CREATE INDEX idx_client_payments_view_org ON finance.client_payments USING bt...` |
| client_payments | idx_client_payments_view_project | `CREATE INDEX idx_client_payments_view_project ON finance.client_payments USIN...` |
| currencies | currencies_code_key | `CREATE UNIQUE INDEX currencies_code_key ON finance.currencies USING btree (code)` |
| currencies | idx_currencies_code | `CREATE INDEX idx_currencies_code ON finance.currencies USING btree (code)` |
| currencies | idx_currencies_name | `CREATE INDEX idx_currencies_name ON finance.currencies USING btree (name)` |
| economic_index_components | economic_index_components_index_type_id_key_key | `CREATE UNIQUE INDEX economic_index_components_index_type_id_key_key ON financ...` |
| economic_index_components | idx_index_components_type | `CREATE INDEX idx_index_components_type ON finance.economic_index_components U...` |
| economic_index_types | economic_index_types_organization_id_name_key | `CREATE UNIQUE INDEX economic_index_types_organization_id_name_key ON finance....` |
| economic_index_types | idx_index_types_org | `CREATE INDEX idx_index_types_org ON finance.economic_index_types USING btree ...` |
| economic_index_values | economic_index_values_index_type_id_period_year_period_mont_key | `CREATE UNIQUE INDEX economic_index_values_index_type_id_period_year_period_mo...` |
| economic_index_values | idx_index_values_jsonb | `CREATE INDEX idx_index_values_jsonb ON finance.economic_index_values USING gi...` |
| economic_index_values | idx_index_values_period | `CREATE INDEX idx_index_values_period ON finance.economic_index_values USING b...` |
| economic_index_values | idx_index_values_type | `CREATE INDEX idx_index_values_type ON finance.economic_index_values USING btr...` |
| exchange_rates | exchange_rates_unique_pair | `CREATE UNIQUE INDEX exchange_rates_unique_pair ON finance.exchange_rates USIN...` |
| exchange_rates | idx_exchange_rates_active | `CREATE INDEX idx_exchange_rates_active ON finance.exchange_rates USING btree ...` |
| general_cost_categories | idx_gc_categories_list | `CREATE INDEX idx_gc_categories_list ON finance.general_cost_categories USING ...` |
| general_cost_categories | uq_gc_categories_org_name | `CREATE UNIQUE INDEX uq_gc_categories_org_name ON finance.general_cost_categor...` |
| general_cost_categories | uq_gc_categories_system_name | `CREATE UNIQUE INDEX uq_gc_categories_system_name ON finance.general_cost_cate...` |
| general_costs | idx_general_costs_org_deleted | `CREATE INDEX idx_general_costs_org_deleted ON finance.general_costs USING btr...` |
| general_costs_payments | idx_gc_payments_general_cost | `CREATE INDEX idx_gc_payments_general_cost ON finance.general_costs_payments U...` |
| general_costs_payments | idx_gc_payments_org_date | `CREATE INDEX idx_gc_payments_org_date ON finance.general_costs_payments USING...` |
| general_costs_payments | idx_gc_payments_status_org | `CREATE INDEX idx_gc_payments_status_org ON finance.general_costs_payments USI...` |
| general_costs_payments | idx_gc_payments_wallet | `CREATE INDEX idx_gc_payments_wallet ON finance.general_costs_payments USING b...` |
| indirect_costs | indirect_costs_id_key | `CREATE UNIQUE INDEX indirect_costs_id_key ON finance.indirect_costs USING btr...` |
| indirect_costs_payments | idx_indirect_costs_payments_date | `CREATE INDEX idx_indirect_costs_payments_date ON finance.indirect_costs_payme...` |
| indirect_costs_payments | idx_indirect_costs_payments_indirect | `CREATE INDEX idx_indirect_costs_payments_indirect ON finance.indirect_costs_p...` |
| indirect_costs_payments | idx_indirect_costs_payments_org_project | `CREATE INDEX idx_indirect_costs_payments_org_project ON finance.indirect_cost...` |
| indirect_costs_payments | idx_indirect_costs_payments_view_org | `CREATE INDEX idx_indirect_costs_payments_view_org ON finance.indirect_costs_p...` |
| indirect_costs_payments | idx_indirect_costs_payments_view_project | `CREATE INDEX idx_indirect_costs_payments_view_project ON finance.indirect_cos...` |
| labor_payments | idx_labor_payments_date | `CREATE INDEX idx_labor_payments_date ON finance.labor_payments USING btree (p...` |
| labor_payments | idx_labor_payments_import_batch_id | `CREATE INDEX idx_labor_payments_import_batch_id ON finance.labor_payments USI...` |
| labor_payments | idx_labor_payments_labor | `CREATE INDEX idx_labor_payments_labor ON finance.labor_payments USING btree (...` |
| labor_payments | idx_labor_payments_not_deleted | `CREATE INDEX idx_labor_payments_not_deleted ON finance.labor_payments USING b...` |
| labor_payments | idx_labor_payments_org_project | `CREATE INDEX idx_labor_payments_org_project ON finance.labor_payments USING b...` |
| labor_payments | idx_labor_payments_view_org | `CREATE INDEX idx_labor_payments_view_org ON finance.labor_payments USING btre...` |
| labor_payments | idx_labor_payments_view_project | `CREATE INDEX idx_labor_payments_view_project ON finance.labor_payments USING ...` |
| material_invoice_items | idx_material_invoice_items_material | `CREATE INDEX idx_material_invoice_items_material ON finance.material_invoice_...` |
| material_invoice_items | material_purchase_items_org_idx | `CREATE INDEX material_purchase_items_org_idx ON finance.material_invoice_item...` |
| material_invoice_items | material_purchase_items_org_project_idx | `CREATE INDEX material_purchase_items_org_project_idx ON finance.material_invo...` |
| material_invoice_items | material_purchase_items_project_idx | `CREATE INDEX material_purchase_items_project_idx ON finance.material_invoice_...` |
| material_invoices | idx_material_invoices_po | `CREATE INDEX idx_material_invoices_po ON finance.material_invoices USING btre...` |
| material_payments | idx_material_payments_import_batch | `CREATE INDEX idx_material_payments_import_batch ON finance.material_payments ...` |
| material_payments | idx_material_payments_material_type | `CREATE INDEX idx_material_payments_material_type ON finance.material_payments...` |
| material_payments | idx_material_payments_not_deleted | `CREATE INDEX idx_material_payments_not_deleted ON finance.material_payments U...` |
| material_payments | idx_material_payments_type | `CREATE INDEX idx_material_payments_type ON finance.material_payments USING bt...` |
| material_payments | material_payments_organization_id_payment_date_idx | `CREATE INDEX material_payments_organization_id_payment_date_idx ON finance.ma...` |
| material_payments | material_payments_organization_id_project_id_idx | `CREATE INDEX material_payments_organization_id_project_id_idx ON finance.mate...` |
| material_payments | material_payments_payment_date_idx | `CREATE INDEX material_payments_payment_date_idx ON finance.material_payments ...` |
| material_payments | material_payments_project_id_payment_date_idx | `CREATE INDEX material_payments_project_id_payment_date_idx ON finance.materia...` |
| material_purchase_order_items | idx_mpo_items_material | `CREATE INDEX idx_mpo_items_material ON finance.material_purchase_order_items ...` |
| movement_indirects | movement_indirects_movement_id_key | `CREATE UNIQUE INDEX movement_indirects_movement_id_key ON finance.movement_in...` |
| movements | movements_id_key | `CREATE UNIQUE INDEX movements_id_key ON finance.movements USING btree (id)` |
| organization_currencies | unique_org_currency | `CREATE UNIQUE INDEX unique_org_currency ON finance.organization_currencies US...` |
| organization_wallets | org_wallets_org_default_uniq | `CREATE UNIQUE INDEX org_wallets_org_default_uniq ON finance.organization_wall...` |
| organization_wallets | org_wallets_org_idx | `CREATE INDEX org_wallets_org_idx ON finance.organization_wallets USING btree ...` |
| organization_wallets | org_wallets_org_wallet_uniq | `CREATE UNIQUE INDEX org_wallets_org_wallet_uniq ON finance.organization_walle...` |
| organization_wallets | org_wallets_wallet_idx | `CREATE INDEX org_wallets_wallet_idx ON finance.organization_wallets USING btr...` |
| partner_capital_balance | partner_capital_balance_unique | `CREATE UNIQUE INDEX partner_capital_balance_unique ON finance.partner_capital...` |
| partner_contributions | idx_partner_contributions_date | `CREATE INDEX idx_partner_contributions_date ON finance.partner_contributions ...` |
| partner_contributions | idx_partner_contributions_not_deleted | `CREATE INDEX idx_partner_contributions_not_deleted ON finance.partner_contrib...` |
| partner_contributions | idx_partner_contributions_org_project | `CREATE INDEX idx_partner_contributions_org_project ON finance.partner_contrib...` |
| partner_contributions | idx_partner_contributions_partner | `CREATE INDEX idx_partner_contributions_partner ON finance.partner_contributio...` |
| partner_contributions | idx_partner_contributions_view_org | `CREATE INDEX idx_partner_contributions_view_org ON finance.partner_contributi...` |
| partner_contributions | idx_partner_contributions_view_project | `CREATE INDEX idx_partner_contributions_view_project ON finance.partner_contri...` |
| partner_withdrawals | idx_partner_withdrawals_date | `CREATE INDEX idx_partner_withdrawals_date ON finance.partner_withdrawals USIN...` |
| partner_withdrawals | idx_partner_withdrawals_not_deleted | `CREATE INDEX idx_partner_withdrawals_not_deleted ON finance.partner_withdrawa...` |
| partner_withdrawals | idx_partner_withdrawals_org_project | `CREATE INDEX idx_partner_withdrawals_org_project ON finance.partner_withdrawa...` |
| partner_withdrawals | idx_partner_withdrawals_partner | `CREATE INDEX idx_partner_withdrawals_partner ON finance.partner_withdrawals U...` |
| partner_withdrawals | idx_partner_withdrawals_view_org | `CREATE INDEX idx_partner_withdrawals_view_org ON finance.partner_withdrawals ...` |
| partner_withdrawals | idx_partner_withdrawals_view_project | `CREATE INDEX idx_partner_withdrawals_view_project ON finance.partner_withdraw...` |
| personnel_rates | idx_personnel_rates_is_active | `CREATE INDEX idx_personnel_rates_is_active ON finance.personnel_rates USING b...` |
| personnel_rates | idx_personnel_rates_labor_type | `CREATE INDEX idx_personnel_rates_labor_type ON finance.personnel_rates USING ...` |
| personnel_rates | idx_personnel_rates_org | `CREATE INDEX idx_personnel_rates_org ON finance.personnel_rates USING btree (...` |
| personnel_rates | idx_personnel_rates_personnel | `CREATE INDEX idx_personnel_rates_personnel ON finance.personnel_rates USING b...` |
| personnel_rates | idx_personnel_rates_validity | `CREATE INDEX idx_personnel_rates_validity ON finance.personnel_rates USING bt...` |
| quote_items | idx_quote_items_not_deleted | `CREATE INDEX idx_quote_items_not_deleted ON finance.quote_items USING btree (...` |
| quote_items | idx_quote_items_recipe_id | `CREATE INDEX idx_quote_items_recipe_id ON finance.quote_items USING btree (re...` |
| quote_items | idx_quote_items_sort | `CREATE INDEX idx_quote_items_sort ON finance.quote_items USING btree (quote_i...` |
| quote_items | idx_quote_items_updated_by | `CREATE INDEX idx_quote_items_updated_by ON finance.quote_items USING btree (u...` |
| quote_items | quote_items_id_key | `CREATE UNIQUE INDEX quote_items_id_key ON finance.quote_items USING btree (id)` |
| quotes | idx_quotes_client | `CREATE INDEX idx_quotes_client ON finance.quotes USING btree (client_id)` |
| quotes | idx_quotes_created | `CREATE INDEX idx_quotes_created ON finance.quotes USING btree (created_by)` |
| quotes | idx_quotes_not_deleted | `CREATE INDEX idx_quotes_not_deleted ON finance.quotes USING btree (is_deleted...` |
| quotes | idx_quotes_org | `CREATE INDEX idx_quotes_org ON finance.quotes USING btree (organization_id)` |
| quotes | idx_quotes_org_active | `CREATE INDEX idx_quotes_org_active ON finance.quotes USING btree (organizatio...` |
| quotes | idx_quotes_parent_quote | `CREATE INDEX idx_quotes_parent_quote ON finance.quotes USING btree (parent_qu...` |
| quotes | idx_quotes_project | `CREATE INDEX idx_quotes_project ON finance.quotes USING btree (project_id)` |
| quotes | idx_quotes_status | `CREATE INDEX idx_quotes_status ON finance.quotes USING btree (status)` |
| quotes | idx_quotes_type | `CREATE INDEX idx_quotes_type ON finance.quotes USING btree (quote_type)` |
| quotes | idx_quotes_updated_by | `CREATE INDEX idx_quotes_updated_by ON finance.quotes USING btree (updated_by)` |
| quotes | ux_quotes_project_name_version | `CREATE UNIQUE INDEX ux_quotes_project_name_version ON finance.quotes USING bt...` |
| subcontract_payments | idx_subcontract_payments_date | `CREATE INDEX idx_subcontract_payments_date ON finance.subcontract_payments US...` |
| subcontract_payments | idx_subcontract_payments_import_batch_id | `CREATE INDEX idx_subcontract_payments_import_batch_id ON finance.subcontract_...` |
| subcontract_payments | idx_subcontract_payments_is_deleted | `CREATE INDEX idx_subcontract_payments_is_deleted ON finance.subcontract_payme...` |
| subcontract_payments | idx_subcontract_payments_org_project | `CREATE INDEX idx_subcontract_payments_org_project ON finance.subcontract_paym...` |
| subcontract_payments | idx_subcontract_payments_subcontract | `CREATE INDEX idx_subcontract_payments_subcontract ON finance.subcontract_paym...` |
| subcontract_payments | idx_subcontract_payments_view_org | `CREATE INDEX idx_subcontract_payments_view_org ON finance.subcontract_payment...` |
| subcontract_payments | idx_subcontract_payments_view_project | `CREATE INDEX idx_subcontract_payments_view_project ON finance.subcontract_pay...` |
| subcontracts | idx_subcontracts_contact | `CREATE INDEX idx_subcontracts_contact ON finance.subcontracts USING btree (co...` |
| subcontracts | idx_subcontracts_currency | `CREATE INDEX idx_subcontracts_currency ON finance.subcontracts USING btree (c...` |
| subcontracts | idx_subcontracts_organization | `CREATE INDEX idx_subcontracts_organization ON finance.subcontracts USING btre...` |
| subcontracts | idx_subcontracts_project | `CREATE INDEX idx_subcontracts_project ON finance.subcontracts USING btree (pr...` |
| subcontracts | idx_subcontracts_status | `CREATE INDEX idx_subcontracts_status ON finance.subcontracts USING btree (sta...` |
| tax_labels | tax_labels_code_key | `CREATE UNIQUE INDEX tax_labels_code_key ON finance.tax_labels USING btree (code)` |
| wallets | wallets_id_key | `CREATE UNIQUE INDEX wallets_id_key ON finance.wallets USING btree (id)` |
| wallets | wallets_name_key | `CREATE UNIQUE INDEX wallets_name_key ON finance.wallets USING btree (name)` |
