-- 1. LIMPIEZA: Borrar el trigger viejo y la funcion "mala" (la que devuelve trigger)
DROP TRIGGER IF EXISTS trigger_calculate_functional_amount ON public.client_payments;
DROP FUNCTION IF EXISTS public.calculate_functional_amount(); 

-- NOTA: No borramos la función numérica (la que recibe params), esa es la CORRECTA.

-- 2. CREAR NUEVA FUNCIÓN TRIGGER (Wrapper) PARA PAGOS
-- Esta funcion "envuelve" la lógica numérica y se asigna a la tabla client_payments
CREATE OR REPLACE FUNCTION public.set_client_payment_functional_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo recalcular si cambian los valores relevantes
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

-- 3. ASIGNAR EL NUEVO TRIGGER A LA TABLA DE PAGOS
CREATE TRIGGER set_functional_amount_payments
BEFORE INSERT OR UPDATE ON public.client_payments
FOR EACH ROW
EXECUTE FUNCTION public.set_client_payment_functional_amount();

-- 4. BONUS: CONFIRMAR LA FUNCIÓN MATEMÁTICA PRINCIPAL
-- (Por si acaso, re-aseguramos que la función "cerebro" esté bien definida con DIVISIÓN)
CREATE OR REPLACE FUNCTION public.calculate_functional_amount(
  p_amount numeric,
  p_exchange_rate numeric,
  p_currency_id uuid,
  p_organization_id uuid
) RETURNS numeric AS $$
DECLARE
  v_ref_currency_id uuid;
BEGIN
  SELECT COALESCE(p.functional_currency_id, p.default_currency_id)
  INTO v_ref_currency_id
  FROM public.organization_preferences p
  WHERE p.organization_id = p_organization_id;

  IF p_currency_id = v_ref_currency_id THEN
    RETURN p_amount;
  END IF;

  IF p_exchange_rate IS NULL OR p_exchange_rate = 0 THEN
    RETURN 0; 
  END IF;

  RETURN p_amount / p_exchange_rate;
END;
$$ LANGUAGE plpgsql STABLE;
