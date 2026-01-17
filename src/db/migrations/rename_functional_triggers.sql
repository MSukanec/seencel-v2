-- ===============================================================
-- SCRIPT DE UNIFICACIÓN Y RENOMBRADO DE TRIGGERS FINANCIEROS
-- ===============================================================

-- 1. DEFINIR FUNCIONES WRAPPER (Aseguramos que existen)
-- ---------------------------------------------------------------

-- 1.1 Wrapper para PAGOS (Client Payments)
CREATE OR REPLACE FUNCTION public.set_client_payment_functional_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR 
     (OLD.amount IS DISTINCT FROM NEW.amount) OR 
     (OLD.exchange_rate IS DISTINCT FROM NEW.exchange_rate) OR 
     (OLD.currency_id IS DISTINCT FROM NEW.currency_id) THEN
     
     NEW.functional_amount := public.calculate_functional_amount(
       NEW.amount,
       NEW.exchange_rate,
       NEW.currency_id,
       NEW.organization_id
     );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.2 Wrapper para COMPROMISOS (Client Commitments)
CREATE OR REPLACE FUNCTION public.set_client_commitment_functional_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR 
     (OLD.amount IS DISTINCT FROM NEW.amount) OR 
     (OLD.exchange_rate IS DISTINCT FROM NEW.exchange_rate) OR 
     (OLD.currency_id IS DISTINCT FROM NEW.currency_id) THEN
     
     NEW.functional_amount := public.calculate_functional_amount(
       NEW.amount,
       NEW.exchange_rate,
       NEW.currency_id,
       NEW.organization_id
     );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 2. LIMPIEZA Y RECREACIÓN DE TRIGGERS
-- ---------------------------------------------------------------

-- 2.1 PAGOS
DROP TRIGGER IF EXISTS set_functional_amount_payments ON public.client_payments;
DROP TRIGGER IF EXISTS trigger_calculate_functional_amount ON public.client_payments;
DROP TRIGGER IF EXISTS set_functional_amount_client_payments ON public.client_payments; -- Prevent dupe error

CREATE TRIGGER set_functional_amount_client_payments
BEFORE INSERT OR UPDATE ON public.client_payments
FOR EACH ROW
EXECUTE FUNCTION public.set_client_payment_functional_amount();

-- 2.2 COMPROMISOS
DROP TRIGGER IF EXISTS set_functional_amount_commitments ON public.client_commitments;
DROP TRIGGER IF EXISTS set_functional_amount_client_commitments ON public.client_commitments; -- Prevent dupe error

CREATE TRIGGER set_functional_amount_client_commitments
BEFORE INSERT OR UPDATE ON public.client_commitments
FOR EACH ROW
EXECUTE FUNCTION public.set_client_commitment_functional_amount();
