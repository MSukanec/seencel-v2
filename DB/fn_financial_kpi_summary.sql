-- ============================================================================
-- fn_financial_kpi_summary
-- ============================================================================
-- Reemplaza la query JS que trae TODOS los movimientos financieros
-- y calcula SUM en el cliente. Ahora se hace directo en SQL.
-- 
-- Retorna: income, expenses, balance en moneda funcional
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_financial_kpi_summary(
    p_org_id UUID,
    p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    income NUMERIC,
    expenses NUMERIC,
    balance NUMERIC,
    currency_symbol TEXT,
    currency_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_func_currency_id UUID;
    v_symbol TEXT := '$';
    v_code TEXT := 'ARS';
BEGIN
    -- 1. Get functional currency
    SELECT op.functional_currency_id 
    INTO v_func_currency_id
    FROM organization_preferences op
    WHERE op.organization_id = p_org_id;
    
    IF v_func_currency_id IS NOT NULL THEN
        SELECT c.symbol, c.code 
        INTO v_symbol, v_code
        FROM currencies c
        WHERE c.id = v_func_currency_id;
    END IF;

    -- 2. Calculate income/expenses in one pass
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN m.amount_sign = 1 THEN m.functional_amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN m.amount_sign = -1 THEN m.functional_amount ELSE 0 END), 0) AS expenses,
        COALESCE(SUM(CASE WHEN m.amount_sign = 1 THEN m.functional_amount ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN m.amount_sign = -1 THEN m.functional_amount ELSE 0 END), 0) AS balance,
        v_symbol AS currency_symbol,
        v_code AS currency_code
    FROM unified_financial_movements_view m
    WHERE m.organization_id = p_org_id
      AND m.amount_sign != 0
      AND (p_project_id IS NULL OR m.project_id = p_project_id);
END;
$$;
