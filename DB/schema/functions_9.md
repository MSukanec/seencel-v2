# Database Schema (Auto-generated)
> Generated: 2026-02-17T17:51:37.665Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Functions & Procedures (chunk 9: step_create_user_preferences — update_partner_balance_after_capital_change)

### `step_create_user_preferences(p_user_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_user_preferences(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (p_user_id);

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user_preferences',
      'signup',
      SQLERRM,
      jsonb_build_object('user_id', p_user_id),
      'critical'
    );
    RAISE;
END;$function$
```
</details>

### `step_log_seat_purchase_event(p_organization_id uuid, p_user_id uuid, p_seats integer, p_amount numeric, p_currency text, p_payment_id uuid, p_prorated boolean)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_log_seat_purchase_event(p_organization_id uuid, p_user_id uuid, p_seats integer, p_amount numeric, p_currency text, p_payment_id uuid, p_prorated boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_event_id UUID;
    v_member_id UUID;
BEGIN
    -- Intentar obtener el member_id del usuario en la organización
    SELECT id INTO v_member_id
    FROM public.organization_members
    WHERE organization_id = p_organization_id 
      AND user_id = p_user_id
    LIMIT 1;

    -- Log en organization_activity_logs (tabla real)
    INSERT INTO public.organization_activity_logs (
        organization_id,
        member_id,
        action,
        target_table,
        target_id,
        metadata
    ) VALUES (
        p_organization_id,
        v_member_id,
        'seat_purchased',
        'payments',
        p_payment_id,
        jsonb_build_object(
            'seats', p_seats,
            'amount', p_amount,
            'currency', p_currency,
            'payment_id', p_payment_id,
            'prorated', p_prorated,
            'user_id', p_user_id
        )
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$function$
```
</details>

### `step_organization_increment_seats(p_organization_id uuid, p_seats_to_add integer)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_organization_increment_seats(p_organization_id uuid, p_seats_to_add integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.organizations
    SET 
        purchased_seats = COALESCE(purchased_seats, 0) + p_seats_to_add,
        updated_at = now()
    WHERE id = p_organization_id;
END;
$function$
```
</details>

### `step_organization_set_plan(p_organization_id uuid, p_plan_id uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_organization_set_plan(p_organization_id uuid, p_plan_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.organizations
  SET
    plan_id = p_plan_id,
    updated_at = now()
  WHERE id = p_organization_id;
END;
$function$
```
</details>

### `step_payment_insert_idempotent(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_product_type text, p_plan_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb)`

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_payment_insert_idempotent(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_product_type text, p_plan_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_payment_id uuid;
  v_product_id uuid;
begin
  -- ------------------------------------------------------------
  -- product_id unificado:
  -- - subscription: guardamos plan_id en product_id
  -- - course: guardamos course_id en product_id
  -- ------------------------------------------------------------
  if p_product_type = 'subscription' then
    v_product_id := p_plan_id;
  elsif p_product_type = 'course' then
    v_product_id := p_course_id;
  else
    v_product_id := null;
  end if;

  insert into public.payments (
    provider,
    provider_payment_id,
    user_id,
    organization_id,
    product_type,
    product_id,
    course_id,
    amount,
    currency,
    status,
    metadata,
    gateway,
    approved_at
  )
  values (
    p_provider,
    p_provider_payment_id,
    p_user_id,
    p_organization_id,
    p_product_type,
    v_product_id,
    p_course_id,
    p_amount,
    coalesce(p_currency, 'USD'),
    'completed',
    coalesce(p_metadata, '{}'::jsonb),
    p_provider,
    now()
  )
  on conflict (provider, provider_payment_id)
  do nothing
  returning id into v_payment_id;

  return v_payment_id;

exception
  when others then
    perform public.log_system_error(
      'payment',
      'payments',
      'step_payment_insert_idempotent',
      sqlerrm,
      jsonb_build_object(
        'provider', p_provider,
        'provider_payment_id', p_provider_payment_id,
        'user_id', p_user_id,
        'organization_id', p_organization_id,
        'product_type', p_product_type,
        'plan_id', p_plan_id,
        'course_id', p_course_id,
        'amount', p_amount,
        'currency', p_currency
      ),
      'critical'
    );
    raise;
end;
$function$
```
</details>

### `step_send_purchase_email(p_user_id uuid, p_product_type text, p_product_name text, p_amount numeric, p_currency text, p_payment_id uuid, p_provider text DEFAULT 'mercadopago'::text)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_send_purchase_email(p_user_id uuid, p_product_type text, p_product_name text, p_amount numeric, p_currency text, p_payment_id uuid, p_provider text DEFAULT 'mercadopago'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_email text;
    v_user_name text;
BEGIN
    -- Obtener datos del usuario
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM public.users
    WHERE id = p_user_id;

    IF v_user_email IS NULL THEN
        RAISE NOTICE 'step_send_purchase_email: Usuario % no encontrado', p_user_id;
        RETURN;
    END IF;

    -- Email al comprador
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        created_at
    ) VALUES (
        v_user_email,
        COALESCE(v_user_name, 'Usuario'),
        'purchase_confirmation',
        CASE p_product_type
            WHEN 'course' THEN '¡Tu curso está listo!'
            WHEN 'subscription' THEN '¡Bienvenido a SEENCEL ' || p_product_name || '!'
            ELSE 'Confirmación de compra'
        END,
        jsonb_build_object(
            'user_id', p_user_id,
            'user_email', v_user_email,
            'user_name', v_user_name,
            'product_type', p_product_type,
            'product_name', p_product_name,
            'amount', p_amount,
            'currency', p_currency,
            'payment_id', p_payment_id,
            'provider', p_provider  -- ← NUEVO: incluir provider
        ),
        NOW()
    );

    -- También notificar admins
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        created_at
    ) VALUES (
        'contacto@seencel.com',
        'Admin SEENCEL',
        'admin_sale_notification',
        '💰 Nueva venta: ' || p_product_name,
        jsonb_build_object(
            'buyer_email', v_user_email,
            'buyer_name', v_user_name,
            'product_type', p_product_type,
            'product_name', p_product_name,
            'amount', p_amount,
            'currency', p_currency,
            'payment_id', p_payment_id,
            'provider', p_provider  -- ← NUEVO: incluir provider
        ),
        NOW()
    );

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'step_send_purchase_email error: %', SQLERRM;
END;
$function$
```
</details>

### `step_subscription_create_active(p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_payment_id uuid, p_amount numeric, p_currency text)`

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_subscription_create_active(p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_payment_id uuid, p_amount numeric, p_currency text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_subscription_id uuid;
  v_expires_at timestamptz;
begin
  if p_billing_period = 'annual' then
    v_expires_at := now() + interval '1 year';
  else
    v_expires_at := now() + interval '1 month';
  end if;

  insert into public.organization_subscriptions (
    organization_id,
    plan_id,
    payment_id,
    status,
    billing_period,
    started_at,
    expires_at,
    amount,
    currency
  )
  values (
    p_organization_id,
    p_plan_id,
    p_payment_id,
    'active',
    p_billing_period,
    now(),
    v_expires_at,
    p_amount,
    p_currency
  )
  returning id into v_subscription_id;

  return v_subscription_id;
end;
$function$
```
</details>

### `step_subscription_expire_previous(p_organization_id uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_subscription_expire_previous(p_organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.organization_subscriptions
  SET
    status = 'expired',
    expires_at = now()
  WHERE organization_id = p_organization_id
    AND status = 'active';
END;
$function$
```
</details>

### `sync_contact_on_user_update()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.sync_contact_on_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Solo si cambian full_name o email
  if (old.full_name is distinct from new.full_name)
     or (old.email is distinct from new.email) then

    update public.contacts c
    set full_name  = coalesce(new.full_name, c.full_name),
        email      = coalesce(new.email, c.email),
        updated_at = now()
    where c.linked_user_id = new.id;
  end if;

  return new;
end;
$function$
```
</details>

### `sync_role_permission_org_id()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.sync_role_permission_org_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.roles WHERE id = NEW.role_id;
  END IF;
  RETURN NEW;
END;
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

### `tick_home_checklist(p_key text, p_value boolean)` 🔐

- **Returns**: boolean
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.tick_home_checklist(p_key text, p_value boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
begin
  -- Obtener usuario autenticado
  v_user_id := public.current_user_id();

  if v_user_id is null then
    return false;
  end if;

  update public.user_preferences up
  set
    home_checklist = jsonb_set(
      coalesce(up.home_checklist, '{}'::jsonb),
      array[p_key],
      to_jsonb(p_value),
      true
    ),
    updated_at = now()
  where up.user_id = v_user_id;

  return true;
end;
$function$
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

### `update_contact_category_links_updated_at()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.update_contact_category_links_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
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

### `update_name_rendered_on_task_parametric()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.update_name_rendered_on_task_parametric()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  tipo_tarea_id uuid;
begin
  -- Generar nombre renderizado a partir de parámetros
  new.name_rendered :=
    public.render_parametric_task_name(new.param_order, new.param_values);

  -- Validar param_values
  if new.param_values is null then
    raise exception 'param_values no puede ser NULL';
  end if;

  -- Extraer tipo_tarea (clave esperada)
  tipo_tarea_id := (new.param_values ->> 'tipo_tarea')::uuid;

  if tipo_tarea_id is null then
    raise exception 'param_values.tipo_tarea es requerido';
  end if;

  -- Asignar unidad y categoría desde opciones del parámetro
  select tpo.unit_id, tpo.category_id
  into new.unit_id, new.category_id
  from public.task_parameter_options tpo
  where tpo.id = tipo_tarea_id;

  -- Validación fuerte
  if new.unit_id is null or new.category_id is null then
    raise exception
      'No se pudo resolver unit_id / category_id para tipo_tarea %',
      tipo_tarea_id;
  end if;

  return new;
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
