# Database Schema (Auto-generated)
> Generated: 2026-02-17T23:22:11.037Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Functions & Procedures (chunk 7: ops_detect_orgs_without_currency — set_task_labor_organization)

### `ops_detect_orgs_without_currency()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.ops_detect_orgs_without_currency()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT o.id AS organization_id
    FROM organizations o
    LEFT JOIN organization_currencies oc
      ON oc.organization_id = o.id
    WHERE o.is_active = true
    GROUP BY o.id
    HAVING COUNT(oc.id) = 0
  LOOP
    PERFORM ops_create_alert(
      'organization.missing_currency',
      'high',
      'La organización no tiene monedas configuradas',
      jsonb_build_object(
        'organization_id', r.organization_id,
        'required', 'at least one currency'
      )
    );
  END LOOP;
END;
$function$
```
</details>

### `ops_detect_payment_entitlement_missing()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.ops_detect_payment_entitlement_missing()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      p.id              AS payment_id,
      p.organization_id AS organization_id,
      p.user_id         AS user_id,
      p.plan_id         AS expected_plan_id,
      o.plan_id         AS current_plan_id,
      o.is_founder      AS is_founder
    FROM payments p
    JOIN organizations o ON o.id = p.organization_id
    WHERE p.status = 'approved'
      AND p.plan_id IS NOT NULL
      AND (
        o.plan_id IS DISTINCT FROM p.plan_id
        OR o.is_founder IS DISTINCT FROM TRUE
      )
  LOOP
    -- Evitar duplicados
    IF NOT EXISTS (
      SELECT 1
      FROM ops_alerts
      WHERE alert_type = 'payment.entitlement_missing'
        AND metadata->>'payment_id' = r.payment_id::text
        AND resolved_at IS NULL
    ) THEN
      INSERT INTO ops_alerts (
        alert_type,
        severity,
        title,
        description,
        organization_id,
        user_id,
        metadata,
        created_at
      )
      VALUES (
        'payment.entitlement_missing',
        'critical',
        'Pago aprobado sin entitlements aplicados',
        'El pago fue aprobado pero no se aplicaron todos los efectos esperados (plan, founder, suscripción, curso).',
        r.organization_id,
        r.user_id,
        jsonb_build_object(
          'payment_id', r.payment_id,
          'expected_plan_id', r.expected_plan_id,
          'current_plan_id', r.current_plan_id,
          'is_founder', r.is_founder
        ),
        now()
      );
    END IF;
  END LOOP;
END;
$function$
```
</details>

### `ops_detect_payment_not_applied()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.ops_detect_payment_not_applied()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO ops_alerts (
    alert_type,
    severity,
    title,
    description,
    organization_id,
    payment_id,
    provider,
    fingerprint,
    evidence,
    status,
    created_at
  )
  SELECT
    'payment.approved_but_not_applied',
    'critical',
    'Pago aprobado sin aplicación de plan',
    'Se detectó un pago aprobado que no generó suscripción o no aplicó el plan a la organización.',
    p.organization_id,
    p.id,
    p.provider,
    'payment_not_applied_' || p.id::text,
    jsonb_build_object(
      'payment_id', p.id,
      'provider', p.provider,
      'amount', p.amount,
      'currency', p.currency,
      'product_id', p.product_id,
      'user_id', p.user_id
    ),
    'open',
    now()
  FROM payments p
  LEFT JOIN organization_subscriptions s
    ON s.organization_id = p.organization_id
    AND s.status = 'active'
    AND s.plan_id = p.product_id
  WHERE
    p.status = 'approved'
    AND p.product_type = 'subscription'
    AND p.organization_id IS NOT NULL
    AND (
      s.id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = p.organization_id
          AND o.plan_id = p.product_id
      )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM ops_alerts a
      WHERE a.alert_type = 'payment.approved_but_not_applied'
        AND a.payment_id = p.id
        AND a.status IN ('open', 'ack')
    );
END;
$function$
```
</details>

### `ops_detect_subscription_missing_course()`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.ops_detect_subscription_missing_course()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  rec record;
  v_course_id uuid := '7b12c1f5-1fc9-4638-81a5-6791fa74d6af'; -- CURSO INCLUIDO EN PRO
begin
  for rec in
    select
      p.id as payment_id,
      p.user_id,
      p.organization_id,
      p.created_at
    from payments p
    where p.status = 'completed'
      and p.product_type = 'subscription'
      and p.user_id is not null
  loop
    -- si el usuario NO está inscripto al curso
    if not exists (
      select 1
      from course_enrollments ce
      where ce.user_id = rec.user_id
        and ce.course_id = v_course_id
    ) then
      -- evitar alertas duplicadas
      if not exists (
        select 1
        from ops_alerts oa
        where oa.alert_type = 'subscription.course_not_granted'
          and oa.metadata->>'payment_id' = rec.payment_id::text
      ) then
        insert into ops_alerts (
          alert_type,
          severity,
          title,
          description,
          status,
          metadata,
          created_at
        )
        values (
          'subscription.course_not_granted',
          'critical',
          'Suscripción pagada sin acceso al curso',
          'El usuario pagó una suscripción que incluye curso, pero no está inscripto.',
          'open',
          jsonb_build_object(
            'payment_id', rec.payment_id,
            'user_id', rec.user_id,
            'organization_id', rec.organization_id,
            'course_id', v_course_id
          ),
          now()
        );
      end if;
    end if;
  end loop;
end;
$function$
```
</details>

### `ops_execute_repair_action(p_alert_id uuid, p_action_id text, p_executed_by uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.ops_execute_repair_action(p_alert_id uuid, p_action_id text, p_executed_by uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$BEGIN
  -- Validar que la acción exista y esté activa
  IF NOT EXISTS (
    SELECT 1
    FROM ops_repair_actions
    WHERE id = p_action_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Repair action % does not exist or is inactive', p_action_id;
  END IF;

  -- Dispatcher
  CASE p_action_id

    WHEN 'apply_plan_to_org' THEN
      PERFORM ops_apply_plan_to_org(p_alert_id, p_executed_by);

    WHEN 'retry_user_creation' THEN
      PERFORM ops_retry_user_creation(p_alert_id, p_executed_by);

    WHEN 'force_resolve_alert' THEN
      UPDATE ops_alerts
      SET status = 'resolved', resolved_at = NOW()
      WHERE id = p_alert_id;

    ELSE
      RAISE EXCEPTION 'Repair action % not implemented yet', p_action_id;

  END CASE;

END;$function$
```
</details>

### `ops_retry_user_creation(p_alert_id uuid, p_executed_by uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.ops_retry_user_creation(p_alert_id uuid, p_executed_by uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_auth_user_id UUID;
BEGIN
  SELECT (metadata->>'auth_user_id')::uuid
  INTO v_auth_user_id
  FROM ops_alerts
  WHERE id = p_alert_id;

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_user_id missing in alert metadata';
  END IF;

  -- Reintenta provisión del usuario
  PERFORM handle_new_user(
    (SELECT * FROM auth.users WHERE id = v_auth_user_id)
  );

  INSERT INTO ops_repair_logs (
    alert_id, action_id, executed_by, result
  )
  VALUES (
    p_alert_id, 'retry_user_creation', p_executed_by, 'success'
  );

  UPDATE ops_alerts
  SET status = 'resolved', resolved_at = NOW()
  WHERE id = p_alert_id;

END;
$function$
```
</details>

### `ops_run_all_checks()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.ops_run_all_checks()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  -- Detectores existentes
  PERFORM public.ops_detect_payment_not_applied();

  -- 🔥 NUEVO detector real
  PERFORM public.ops_detect_payment_entitlement_missing();

  PERFORM public.ops_detect_subscription_missing_course();

  PERFORM public.ops_detect_orgs_without_currency();
END;$function$
```
</details>

### `queue_email_bank_transfer(p_user_id uuid, p_transfer_id uuid, p_product_name text, p_amount numeric, p_currency text, p_payer_name text, p_receipt_url text, p_user_email text DEFAULT NULL::text, p_user_first_name text DEFAULT NULL::text)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.queue_email_bank_transfer(p_user_id uuid, p_transfer_id uuid, p_product_name text, p_amount numeric, p_currency text, p_payer_name text, p_receipt_url text, p_user_email text DEFAULT NULL::text, p_user_first_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
    v_user_email TEXT;
    v_user_name TEXT;
    v_user_first_name TEXT;
    v_amount_formatted TEXT;
BEGIN
    -- 1. Obtener datos del usuario si no se pasaron
    IF p_user_email IS NULL OR p_user_first_name IS NULL THEN
        SELECT 
            email,
            COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Usuario')
        INTO v_user_email, v_user_name
        FROM auth.users
        WHERE id = p_user_id;
        
        -- Extraer primer nombre
        v_user_first_name := split_part(v_user_name, ' ', 1);
    ELSE
        v_user_email := p_user_email;
        v_user_first_name := p_user_first_name;
        v_user_name := p_payer_name; -- Fallback
    END IF;

    -- Formatear monto (básico)
    v_amount_formatted := p_amount::TEXT;

    -- 2. Insertar email para el USUARIO (BankTransferPending)
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        status,
        created_at
    ) VALUES (
        v_user_email,
        v_user_first_name,
        'bank_transfer_pending',
        'Recibimos tu comprobante - Acceso Habilitado',
        jsonb_build_object(
            'firstName', v_user_first_name,
            'productName', p_product_name,
            'amount', v_amount_formatted,
            'currency', p_currency,
            'reference', p_transfer_id -- Usamos el ID de transferencia como referencia
        ),
        'pending',
        NOW()
    );

    -- 3. Insertar email para el ADMIN (AdminNewTransfer)
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        status,
        created_at
    ) VALUES (
        'contacto@seencel.com', -- Admin email hardcodeado por ahora
        'Admin Seencel',
        'admin_new_transfer',
        '💸 Nueva transferencia: ' || p_product_name || ' - ' || p_payer_name,
        jsonb_build_object(
            'payerName', p_payer_name,
            'payerEmail', v_user_email,
            'productName', p_product_name,
            'amount', v_amount_formatted,
            'currency', p_currency,
            'transferId', p_transfer_id,
            'receiptUrl', p_receipt_url
        ),
        'pending',
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Emails encolados correctamente'
    );

EXCEPTION WHEN OTHERS THEN
    -- Loguear error pero no fallar la transacción principal
    RAISE NOTICE 'Error en queue_email_bank_transfer: %', SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;$function$
```
</details>

### `queue_email_welcome()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.queue_email_welcome()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Solo procesar si es un INSERT (nuevo usuario)
    IF TG_OP = 'INSERT' THEN
        -- Insertar en cola de emails
        INSERT INTO public.email_queue (
            recipient_email,
            recipient_name,
            template_type,
            subject,
            data,
            created_at
        ) VALUES (
            NEW.email,
            COALESCE(NEW.full_name, 'Usuario'),
            'welcome',
            '¡Bienvenido a SEENCEL!',
            jsonb_build_object(
                'user_id', NEW.id,
                'user_email', NEW.email,
                'user_name', COALESCE(NEW.full_name, 'Usuario'),
                'created_at', NEW.created_at
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error pero no romper el flujo de registro
    RAISE NOTICE 'trigger_send_welcome_email error: %', SQLERRM;
    RETURN NEW;
END;
$function$
```
</details>

### `quote_item_set_default_sort_key()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.quote_item_set_default_sort_key()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.sort_key IS NULL OR NEW.sort_key = 0 THEN
        SELECT COALESCE(MAX(sort_key), 0) + 1 INTO NEW.sort_key
        FROM public.quote_items
        WHERE quote_id = NEW.quote_id;
    END IF;
    RETURN NEW;
END;
$function$
```
</details>

### `recalculate_po_totals()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.recalculate_po_totals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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

### `recalculate_recipe_rating()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.recalculate_recipe_rating()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    update task_recipes
    set 
        rating_avg = (
            select round(avg(rating)::numeric, 2)
            from task_recipe_ratings
            where recipe_id = coalesce(new.recipe_id, old.recipe_id)
        ),
        rating_count = (
            select count(*)
            from task_recipe_ratings
            where recipe_id = coalesce(new.recipe_id, old.recipe_id)
        ),
        updated_at = now()
    where id = coalesce(new.recipe_id, old.recipe_id);
    
    return coalesce(new, old);
end;
$function$
```
</details>

### `redeem_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text, p_order_id uuid DEFAULT NULL::uuid, p_subscription_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.redeem_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text, p_order_id uuid DEFAULT NULL::uuid, p_subscription_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
  v_validation jsonb;
  v_coupon_id uuid;
  v_discount numeric;
  v_existing_id uuid;
BEGIN
  -- ============================================================
  -- 1) Obtener usuario
  -- ============================================================
  v_user_id := public.current_user_id();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'UNAUTHENTICATED'
    );
  END IF;

  -- ============================================================
  -- 2) Validar cupón usando la función universal
  -- ============================================================
  v_validation := public.validate_coupon_universal(
    p_code,
    p_product_type,
    p_product_id,
    p_price,
    p_currency
  );

  -- Si la validación falla, retornar el error
  IF (v_validation->>'ok')::boolean IS FALSE THEN
    RETURN v_validation;
  END IF;

  -- Extraer datos del cupón validado
  v_coupon_id := (v_validation->>'coupon_id')::uuid;
  v_discount := (v_validation->>'discount')::numeric;

  -- ============================================================
  -- 3) Verificar idempotencia (evitar duplicados)
  -- ============================================================
  SELECT id INTO v_existing_id
  FROM public.coupon_redemptions
  WHERE coupon_id = v_coupon_id
    AND user_id = v_user_id
    AND (
      (p_product_type = 'course' AND course_id = p_product_id)
      OR
      (p_product_type = 'subscription' AND plan_id = p_product_id)
    )
    AND (
      (p_order_id IS NOT NULL AND order_id = p_order_id)
      OR
      (p_subscription_id IS NOT NULL AND subscription_id = p_subscription_id)
    )
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Ya fue redimido para esta orden/suscripción
    RETURN jsonb_build_object(
      'ok', true,
      'already_redeemed', true,
      'redemption_id', v_existing_id,
      'discount', v_discount,
      'final_price', (v_validation->>'final_price')::numeric
    );
  END IF;

  -- ============================================================
  -- 4) Registrar redención
  -- ============================================================
  INSERT INTO public.coupon_redemptions (
    coupon_id,
    user_id,
    course_id,
    plan_id,
    order_id,
    subscription_id,
    amount_saved,
    currency
  )
  VALUES (
    v_coupon_id,
    v_user_id,
    CASE WHEN p_product_type = 'course' THEN p_product_id ELSE NULL END,
    CASE WHEN p_product_type = 'subscription' THEN p_product_id ELSE NULL END,
    p_order_id,
    p_subscription_id,
    v_discount,
    p_currency
  )
  RETURNING id INTO v_existing_id;

  -- ============================================================
  -- 5) Retornar éxito
  -- ============================================================
  RETURN jsonb_build_object(
    'ok', true,
    'redemption_id', v_existing_id,
    'coupon_id', v_coupon_id,
    'coupon_code', v_validation->>'coupon_code',
    'discount', v_discount,
    'final_price', (v_validation->>'final_price')::numeric,
    'is_free', (v_validation->>'is_free')::boolean
  );
END;
$function$
```
</details>

### `refresh_labor_avg_prices()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.refresh_labor_avg_prices()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  refresh materialized view public.labor_avg_prices;
end;
$function$
```
</details>

### `refresh_material_avg_prices()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.refresh_material_avg_prices()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  refresh materialized view public.material_avg_prices;
end;
$function$
```
</details>

### `refresh_product_avg_prices()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.refresh_product_avg_prices()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$refresh materialized view concurrently public.product_avg_prices;$function$
```
</details>

### `reset_test_payments_and_subscriptions(p_user_id uuid, p_organization_id uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.reset_test_payments_and_subscriptions(p_user_id uuid, p_organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- 🔥 CLAVE ABSOLUTA
  SET CONSTRAINTS ALL DEFERRED;

  -- 1) BORRAR ENROLLMENTS
  DELETE FROM public.course_enrollments
  WHERE user_id = p_user_id;

  -- 2) BORRAR PAGOS
  DELETE FROM public.payments
  WHERE user_id = p_user_id
     OR organization_id = p_organization_id;

  -- 3) BORRAR BILLING CYCLES
  DELETE FROM public.organization_billing_cycles
  WHERE organization_id = p_organization_id;

  -- 4) BORRAR SUBSCRIPTIONS
  DELETE FROM public.organization_subscriptions
  WHERE organization_id = p_organization_id;

  -- 5) RESET ORGANIZATION
  UPDATE public.organizations
  SET
    plan_id = '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2',
    settings = '{}'::jsonb,
    updated_at = now()
  WHERE id = p_organization_id;

  -- 6) LIMPIAR ERRORES
  DELETE FROM public.system_errors
  WHERE context->>'user_id' = p_user_id::text
     OR context->>'organization_id' = p_organization_id::text;
END;
$function$
```
</details>

### `send_notification(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb DEFAULT '{}'::jsonb, p_audience text DEFAULT 'direct'::text)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.send_notification(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb DEFAULT '{}'::jsonb, p_audience text DEFAULT 'direct'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_notification_id uuid;
BEGIN
    -- 1. Insertar la notificación
    INSERT INTO public.notifications (type, title, body, data, audience)
    VALUES (p_type, p_title, p_body, p_data, p_audience)
    RETURNING id INTO v_notification_id;

    -- 2. Distribuir según audiencia
    IF p_audience = 'direct' AND p_user_id IS NOT NULL THEN
        INSERT INTO public.user_notifications (user_id, notification_id)
        VALUES (p_user_id, v_notification_id);
    
    ELSIF p_audience = 'admins' THEN
        -- CORREGIDO: Usar el role_id de admin directamente
        INSERT INTO public.user_notifications (user_id, notification_id)
        SELECT id, v_notification_id
        FROM public.users
        WHERE role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid;
        
    END IF;

    RETURN v_notification_id;
END;
$function$
```
</details>

### `set_budget_task_organization()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_budget_task_organization()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Resolver organización desde la tarea
  select t.organization_id
  into new.organization_id
  from public.tasks t
  where t.id = new.task_id;

  -- Si no existe la tarea, es un error lógico
  if new.organization_id is null then
    raise exception
      'No se pudo resolver organization_id para task_id %',
      new.task_id;
  end if;

  return new;
end;
$function$
```
</details>

### `set_task_labor_organization()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_task_labor_organization()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Si organization_id es null, heredarlo de la tarea padre
    IF NEW.organization_id IS NULL THEN
        SELECT organization_id INTO NEW.organization_id
        FROM tasks
        WHERE id = NEW.task_id;
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>
