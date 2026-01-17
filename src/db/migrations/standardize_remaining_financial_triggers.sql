-- Standardize Functional Amount Triggers for Remaining Financial Tables
-- Based on FINANCIAL_ARCHITECTURE.md

-- 1. GENERAL_COSTS_PAYMENTS
CREATE OR REPLACE FUNCTION public.set_general_cost_payment_functional_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.functional_amount := public.calculate_functional_amount(
        NEW.amount,
        NEW.exchange_rate,
        NEW.currency_id,
        NEW.organization_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_functional_amount_general_costs_payments ON public.general_costs_payments;
CREATE TRIGGER set_functional_amount_general_costs_payments
BEFORE INSERT OR UPDATE ON public.general_costs_payments
FOR EACH ROW
EXECUTE FUNCTION public.set_general_cost_payment_functional_amount();

-- 2. CAPITAL_ADJUSTMENTS
CREATE OR REPLACE FUNCTION public.set_capital_adjustment_functional_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.functional_amount := public.calculate_functional_amount(
        NEW.amount,
        NEW.exchange_rate,
        NEW.currency_id,
        NEW.organization_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_functional_amount_capital_adjustments ON public.capital_adjustments;
CREATE TRIGGER set_functional_amount_capital_adjustments
BEFORE INSERT OR UPDATE ON public.capital_adjustments
FOR EACH ROW
EXECUTE FUNCTION public.set_capital_adjustment_functional_amount();

-- 3. INITIAL RECALCULATION
UPDATE public.general_costs_payments
SET functional_amount = public.calculate_functional_amount(
    amount,
    exchange_rate,
    currency_id,
    organization_id
)
WHERE functional_amount IS NULL OR functional_amount = 0;

UPDATE public.capital_adjustments
SET functional_amount = public.calculate_functional_amount(
    amount,
    exchange_rate,
    currency_id,
    organization_id
)
WHERE functional_amount IS NULL OR functional_amount = 0;
