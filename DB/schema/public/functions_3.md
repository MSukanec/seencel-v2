# Database Schema (Auto-generated)
> Generated: 2026-02-22T17:21:28.968Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Functions (chunk 3: set_timestamp — update_updated_at_column)

### `set_timestamp()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
```
</details>

### `set_updated_at()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
```
</details>

### `set_updated_at_ia_user_preferences()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at_ia_user_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
```
</details>

### `sync_task_status_progress()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.sync_task_status_progress()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Caso 1: Progress llega a 100 → marcar como completed
    IF NEW.progress_percent = 100 AND OLD.progress_percent < 100 THEN
        NEW.status := 'completed';
    END IF;

    -- Caso 2: Status cambia a completed → forzar progress a 100
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.progress_percent := 100;
    END IF;

    -- Caso 3: Progress baja de 100 y estaba completed → revertir a in_progress
    IF NEW.progress_percent < 100 AND OLD.status = 'completed' AND NEW.status = 'completed' THEN
        NEW.status := 'in_progress';
    END IF;

    RETURN NEW;
END;
$function$
```
</details>

### `unaccent(text)`

- **Returns**: text
- **Kind**: function | STABLE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.unaccent(text)
 RETURNS text
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/unaccent', $function$unaccent_dict$function$
```
</details>

### `unaccent(regdictionary, text)`

- **Returns**: text
- **Kind**: function | STABLE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.unaccent(regdictionary, text)
 RETURNS text
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/unaccent', $function$unaccent_dict$function$
```
</details>

### `unaccent_init(internal)`

- **Returns**: internal
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.unaccent_init(internal)
 RETURNS internal
 LANGUAGE c
 PARALLEL SAFE
AS '$libdir/unaccent', $function$unaccent_init$function$
```
</details>

### `unaccent_lexize(internal, internal, internal, internal)`

- **Returns**: internal
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.unaccent_lexize(internal, internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 PARALLEL SAFE
AS '$libdir/unaccent', $function$unaccent_lexize$function$
```
</details>

### `update_forum_thread_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.update_forum_thread_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then
    update public.forum_threads
    set
      last_activity_at = now(),
      reply_count = reply_count + 1
    where id = new.thread_id;

  elsif tg_op = 'DELETE' then
    update public.forum_threads
    set
      reply_count = greatest(reply_count - 1, 0)
    where id = old.thread_id;
  end if;

  return null;
end;
$function$
```
</details>

### `update_partner_balance_after_capital_change()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.update_partner_balance_after_capital_change()
 RETURNS trigger
 LANGUAGE plpgsql
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

### `update_testimonials_updated_at()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.update_testimonials_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
```
</details>

### `update_timestamp()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.update_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
```
</details>

### `update_updated_at_column()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
```
</details>
