# Database Schema (Auto-generated)
> Generated: 2026-02-22T22:41:22.161Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [FINANCE] Functions (chunk 1: budget_item_move — update_partner_balance_after_capital_change)

### `finance.budget_item_move(p_budget_id uuid, p_item_id uuid, p_prev_item_id uuid, p_next_item_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION finance.budget_item_move(p_budget_id uuid, p_item_id uuid, p_prev_item_id uuid, p_next_item_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'finance', 'public'
AS $function$
declare
  v_prev numeric(18,6);
  v_next numeric(18,6);
  v_new  numeric(18,6);
begin
  -- Seguridad: el caller debe ser miembro de la organización del presupuesto
  perform 1
  from finance.budgets b
  join finance.budget_items bi
    on bi.id = p_item_id
   and bi.budget_id = b.id
  where b.id = p_budget_id
    and public.is_org_member(b.organization_id);

  if not found then
    raise exception 'No autorizado o item/budget inválido';
  end if;

  -- Obtener sort_key anterior
  if p_prev_item_id is not null then
    select sort_key
    into v_prev
    from finance.budget_items
    where id = p_prev_item_id
      and budget_id = p_budget_id;
  end if;

  -- Obtener sort_key siguiente
  if p_next_item_id is not null then
    select sort_key
    into v_next
    from finance.budget_items
    where id = p_next_item_id
      and budget_id = p_budget_id;
  end if;

  -- Cálculo del nuevo sort_key
  if p_prev_item_id is null and p_next_item_id is null then
    select coalesce(max(sort_key), 0) + 1000
    into v_new
    from finance.budget_items
    where budget_id = p_budget_id;

  elsif p_prev_item_id is null then
    select coalesce(min(sort_key), 0) - 1000
    into v_new
    from finance.budget_items
    where budget_id = p_budget_id;

  elsif p_next_item_id is null then
    select coalesce(max(sort_key), 0) + 1000
    into v_new
    from finance.budget_items
    where budget_id = p_budget_id;

  else
    v_new := (v_prev + v_next) / 2.0;

    if v_next - v_prev < 0.001 then
      with ranked as (
        select
          id,
          row_number() over (order by sort_key) as rn
        from finance.budget_items
        where budget_id = p_budget_id
      )
      update finance.budget_items bi
      set sort_key = r.rn * 1000
      from ranked r
      where r.id = bi.id;

      select sort_key
      into v_prev
      from finance.budget_items
      where id = p_prev_item_id;

      select sort_key
      into v_next
      from finance.budget_items
      where id = p_next_item_id;

      v_new := (v_prev + v_next) / 2.0;
    end if;
  end if;

  update finance.budget_items
  set sort_key = v_new
  where id = p_item_id
    and budget_id = p_budget_id;
end;
$function$
```
</details>

### `finance.budget_item_set_default_sort_key()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION finance.budget_item_set_default_sort_key()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'finance', 'public'
AS $function$
declare
  v_max numeric(18,6);
begin
  if new.sort_key = 0 then
    select coalesce(max(sort_key), 0)
    into v_max
    from finance.budget_items
    where budget_id = new.budget_id;

    new.sort_key := v_max + 1000;
  end if;

  return new;
end;
$function$
```
</details>

### `finance.fn_financial_kpi_summary(p_org_id uuid, p_project_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: TABLE(income numeric, expenses numeric, balance numeric, currency_symbol text, currency_code text)
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION finance.fn_financial_kpi_summary(p_org_id uuid, p_project_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(income numeric, expenses numeric, balance numeric, currency_symbol text, currency_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'finance', 'iam', 'public'
AS $function$
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
$function$
```
</details>

### `finance.generate_po_order_number()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION finance.generate_po_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'finance', 'public'
AS $function$
DECLARE
    v_count INTEGER;
    v_year TEXT;
BEGIN
    IF NEW.order_number IS NULL THEN
        v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
        
        SELECT COUNT(*) + 1 INTO v_count
        FROM material_purchase_orders
        WHERE organization_id = NEW.organization_id
          AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
        
        NEW.order_number := 'PO-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

### `finance.quote_item_set_default_sort_key()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION finance.quote_item_set_default_sort_key()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'finance', 'public'
AS $function$
BEGIN
    IF NEW.sort_key IS NULL OR NEW.sort_key = 0 THEN
        SELECT COALESCE(MAX(sort_key), 0) + 1 INTO NEW.sort_key
        FROM finance.quote_items
        WHERE quote_id = NEW.quote_id;
    END IF;
    RETURN NEW;
END;
$function$
```
</details>

### `finance.recalculate_po_totals()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION finance.recalculate_po_totals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'finance', 'public'
AS $function$
BEGIN
    UPDATE material_purchase_orders
    SET subtotal = COALESCE((
        SELECT SUM(quantity * COALESCE(unit_price, 0))
        FROM material_purchase_order_items
        WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
    ), 0),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$function$
```
</details>

### `finance.update_partner_balance_after_capital_change()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION finance.update_partner_balance_after_capital_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'finance', 'public'
AS $function$
DECLARE
  v_partner_id uuid;
  v_organization_id uuid;
  v_signed_amount numeric;
BEGIN
  -- Determine the partner_id and organization_id based on the operation
  IF TG_TABLE_NAME = 'capital_adjustments' THEN
    v_partner_id := NEW.partner_id;
    v_organization_id := NEW.organization_id;
    v_signed_amount := CASE 
      WHEN TG_OP = 'DELETE' THEN -(OLD.amount)
      ELSE NEW.amount
    END;
  ELSIF TG_TABLE_NAME = 'partner_contributions' THEN
    v_partner_id := NEW.partner_id;
    v_organization_id := NEW.organization_id;
    v_signed_amount := CASE 
      WHEN TG_OP = 'DELETE' THEN -(OLD.amount)
      ELSE NEW.amount
    END;
  ELSIF TG_TABLE_NAME = 'partner_withdrawals' THEN
    v_partner_id := NEW.partner_id;
    v_organization_id := NEW.organization_id;
    v_signed_amount := CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.amount
      ELSE -(NEW.amount)
    END;
  END IF;

  -- Only update if we have a partner_id
  IF v_partner_id IS NOT NULL THEN
    INSERT INTO partner_capital_balance (partner_id, organization_id, balance_amount, balance_date, is_deleted)
    VALUES (v_partner_id, v_organization_id, v_signed_amount, CURRENT_DATE, false)
    ON CONFLICT (partner_id, organization_id) 
    DO UPDATE SET 
      balance_amount = partner_capital_balance.balance_amount + EXCLUDED.balance_amount,
      updated_at = NOW();
  END IF;

  RETURN NULL;
END;
$function$
```
</details>
