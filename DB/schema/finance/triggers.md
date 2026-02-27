# Database Schema (Auto-generated)
> Generated: 2026-02-27T17:03:38.530Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [FINANCE] Triggers (45)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| capital_adjustments | capital_adjustments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| capital_adjustments | trg_update_balance_adjustment | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION finance.update_partner_balance_after_cap... |
| client_commitments | client_commitments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| client_commitments | on_client_commitment_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_client_commitment_activity() |
| client_commitments | set_audit_client_commitments | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| client_payment_schedule | client_payment_schedule_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| client_payment_schedule | set_audit_client_schedule | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| client_payments | on_client_payment_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION audit.log_client_payment_activity() |
| client_payments | set_audit_client_payments | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| client_payments | set_client_payments_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| financial_operation_movements | on_financial_movement_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_financial_movement_activity() |
| financial_operation_movements | set_updated_at_financial_operation_movements | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| financial_operation_movements | set_updated_by_financial_operation_movements | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| financial_operations | on_financial_operation_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION audit.log_financial_operation_activity() |
| financial_operations | set_updated_at_financial_operations | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| financial_operations | set_updated_by_financial_operations | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| general_cost_categories | on_general_cost_categories_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION audit.log_general_cost_category_activity() |
| general_cost_categories | set_updated_by_general_cost_categories | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| general_cost_categories | trg_set_updated_at_general_cost_categories | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| general_costs | on_general_costs_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_general_costs_activity() |
| general_costs | set_updated_by_general_costs | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| general_costs_payments | on_gc_payments_audit | AFTER | INSERT, UPDATE | EXECUTE FUNCTION audit.log_general_costs_payments_activity() |
| general_costs_payments | set_updated_by_gc_payments | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| labor_payments | on_labor_payment_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION audit.log_labor_payment_activity() |
| labor_payments | set_updated_by_labor_payments | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| material_payments | on_material_payment_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION audit.log_material_payment_activity() |
| material_payments | set_audit_material_payments | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| material_payments | set_material_payments_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| material_purchase_order_items | trg_recalculate_po_totals | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION finance.recalculate_po_totals() |
| material_purchase_orders | trg_generate_po_number | BEFORE | INSERT | EXECUTE FUNCTION finance.generate_po_order_number() |
| organization_wallets | organization_wallets_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| partner_contributions | trg_update_balance_contribution | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION finance.update_partner_balance_after_cap... |
| partner_withdrawals | trg_update_balance_withdrawal | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION finance.update_partner_balance_after_cap... |
| quote_items | on_quote_item_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION audit.log_quote_item_activity() |
| quote_items | quote_items_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| quote_items | set_updated_by_quote_items | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| quote_items | trg_quote_item_default_sort | BEFORE | INSERT | EXECUTE FUNCTION finance.quote_item_set_default_sort_key() |
| quotes | notify_quote_status_change | AFTER | UPDATE | EXECUTE FUNCTION notifications.notify_quote_status_change() |
| quotes | on_quote_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION audit.log_quote_activity() |
| quotes | quotes_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| quotes | set_updated_by_quotes | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| subcontract_payments | on_subcontract_payment_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION audit.log_subcontract_payment_activity() |
| subcontract_payments | set_updated_by_subcontract_payments | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| subcontracts | on_subcontract_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION audit.log_subcontract_activity() |
| subcontracts | set_updated_by_subcontracts | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
