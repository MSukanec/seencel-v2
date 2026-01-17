-- Script para recalcular functional_amount en tablas existentes
-- Se basa en la nueva lógica de 'calculate_functional_amount' que usa functional_currency_id

-- 1. Actualizar CLIENT_PAYMENTS
UPDATE public.client_payments
SET functional_amount = public.calculate_functional_amount(
  amount,
  exchange_rate,
  currency_id,
  organization_id
);

-- 2. Actualizar GENERAL_COSTS_PAYMENTS (Opcional, descomentar si necesario)
-- UPDATE public.general_costs_payments
-- SET functional_amount = public.calculate_functional_amount(
--   amount,
--   exchange_rate,
--   currency_id,
--   organization_id
-- );

-- 3. Actualizar CAPITAL_ADJUSTMENTS (Opcional, descomentar si necesario)
-- UPDATE public.capital_adjustments
-- SET functional_amount = public.calculate_functional_amount(
--   amount,
--   exchange_rate,
--   currency_id,
--   organization_id
-- );
