CREATE OR REPLACE FUNCTION public.calculate_functional_amount(
  p_amount numeric,
  p_exchange_rate numeric,
  p_currency_id uuid,
  p_organization_id uuid
) RETURNS numeric AS $$
DECLARE
  v_ref_currency_id uuid;
BEGIN
  -- 1. Obtener moneda de referencia (Funcional)
  SELECT COALESCE(p.functional_currency_id, p.default_currency_id)
  INTO v_ref_currency_id
  FROM public.organization_preferences p
  WHERE p.organization_id = p_organization_id;

  -- 2. Si la moneda del movimiento ES IGUAL a la de referencia
  --    Monto Funcional = Monto * 1
  IF p_currency_id = v_ref_currency_id THEN
    RETURN p_amount;
  END IF;

  -- 3. Si la moneda del movimiento NO ES IGUAL a la de referencia
  --    Monto Funcional = Monto / Cotización (Ej: 100,000 ARS / 1000 = 100 USD)
  --    Guard clause: evitar división por cero o null
  IF p_exchange_rate IS NULL OR p_exchange_rate = 0 THEN
    RETURN 0; 
  END IF;

  RETURN p_amount / p_exchange_rate;
END;
$$ LANGUAGE plpgsql STABLE;
