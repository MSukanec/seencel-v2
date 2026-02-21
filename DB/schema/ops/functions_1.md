# Database Schema (Auto-generated)
> Generated: 2026-02-21T16:30:21.519Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [OPS] Functions (chunk 1: admin_cleanup_test_purchase — reset_test_payments_and_subscriptions)

### `ops.admin_cleanup_test_purchase(p_user_email text, p_org_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.admin_cleanup_test_purchase(p_user_email text, p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_deleted_items TEXT[] := '{}';
    v_org_id UUID;
    v_affected_count INT;
    v_free_plan_id UUID := '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2';
    
BEGIN
    v_org_id := p_org_id;
    
    -- ============================================
    -- VALIDACIÓN: Obtener y validar user_id
    -- ============================================
    SELECT COUNT(*) INTO v_affected_count
    FROM public.users 
    WHERE email = p_user_email;
    
    IF v_affected_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuario no encontrado: ' || p_user_email
        );
    END IF;
    
    IF v_affected_count > 1 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '⛔ SEGURIDAD: Más de un usuario con ese email (esto no debería pasar)'
        );
    END IF;
    
    SELECT id INTO v_user_id 
    FROM public.users 
    WHERE email = p_user_email;
    
    -- ============================================
    -- OPERACIONES DE LIMPIEZA (con conteo)
    -- ============================================
    
    -- 1. Borrar course_enrollments
    DELETE FROM course_enrollments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'course_enrollments (' || v_affected_count || ')'); 
    END IF;
    
    -- 2. Borrar suscripciones de la organización
    DELETE FROM organization_subscriptions WHERE organization_id = v_org_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organization_subscriptions (' || v_affected_count || ')'); 
    END IF;
    
    -- 3. Resetear plan_id de la organización al plan FREE
    UPDATE organizations 
    SET plan_id = v_free_plan_id 
    WHERE id = v_org_id AND plan_id IS DISTINCT FROM v_free_plan_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organizations.plan_id → FREE'); 
    END IF;

    -- 3b. Resetear is_founder flag
    UPDATE organizations 
    SET settings = COALESCE(settings, '{}'::jsonb) - 'is_founder'
    WHERE id = v_org_id AND (settings->>'is_founder')::boolean = true;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organizations.settings.is_founder → removed'); 
    END IF;

    -- 3c. Resetear purchased_seats a 0
    UPDATE organizations 
    SET purchased_seats = 0 
    WHERE id = v_org_id AND COALESCE(purchased_seats, 0) > 0;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organizations.purchased_seats → 0'); 
    END IF;
    
    -- 4. Borrar payments del usuario
    DELETE FROM payments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'payments (' || v_affected_count || ')'); 
    END IF;
    
    -- 5. Borrar bank_transfer_payments del usuario
    DELETE FROM bank_transfer_payments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'bank_transfer_payments (' || v_affected_count || ')'); 
    END IF;
    
    -- 6. Borrar mp_preferences del usuario
    DELETE FROM mp_preferences WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'mp_preferences (' || v_affected_count || ')'); 
    END IF;
    
    -- 7. Borrar coupon_redemptions del usuario
    DELETE FROM coupon_redemptions WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'coupon_redemptions (' || v_affected_count || ')'); 
    END IF;
    
    -- 8. Borrar payment_events vinculados a paypal_preferences del usuario
    DELETE FROM payment_events pe
    WHERE EXISTS (
        SELECT 1 FROM paypal_preferences pp 
        WHERE pp.id::text = pe.custom_id 
        AND pp.user_id = v_user_id
    );
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'payment_events (' || v_affected_count || ')'); 
    END IF;

    -- 9. Borrar paypal_preferences del usuario (tabla unificada)
    DELETE FROM paypal_preferences WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'paypal_preferences (' || v_affected_count || ')'); 
    END IF;
    
    -- NOTA: paypal_seat_preferences y paypal_upgrade_preferences son legacy
    -- y no existen en producción. Toda la data está en paypal_preferences.
    
    -- ============================================
    -- RESULTADO
    -- ============================================
    IF array_length(v_deleted_items, 1) IS NULL OR array_length(v_deleted_items, 1) = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', '✅ Usuario ' || p_user_email || ' encontrado pero no tenía datos de compra.',
            'deleted_items', '[]'::jsonb
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', '✅ Limpieza completa para ' || p_user_email,
        'deleted_items', to_jsonb(v_deleted_items),
        'user_id', v_user_id,
        'org_id', v_org_id
    );
END;
$function$
```
</details>

### `ops.admin_cleanup_test_user(target_email text)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.admin_cleanup_test_user(target_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'public', 'iam'
AS $function$
DECLARE
    v_user_id uuid;
    v_org_record record;
BEGIN
    -- 1. Find the user ID from auth.users (or public.users)
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = target_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User % not found, nothing to clean.', target_email;
        RETURN;
    END IF;

    RAISE NOTICE 'Cleaning up user: % (ID: %)', target_email, v_user_id;

    -- 2. Find Organizations owned by this user
    FOR v_org_record IN 
        SELECT o.id, o.name 
        FROM public.organizations o
        JOIN iam.organization_members om ON o.id = om.organization_id
        WHERE om.user_id = (SELECT id FROM public.users WHERE auth_id = v_user_id)
    LOOP
        -- Check if there are OTHER members in this org
        IF (SELECT count(*) FROM iam.organization_members WHERE organization_id = v_org_record.id) = 1 THEN
            RAISE NOTICE 'Deleting Organization: % (ID: %)', v_org_record.name, v_org_record.id;
            
            DELETE FROM public.organizations WHERE id = v_org_record.id;
        ELSE
            RAISE NOTICE 'Skipping Organization % because it has other members.', v_org_record.name;
            
            -- Just remove the member, don't kill the org
            DELETE FROM iam.organization_members 
            WHERE organization_id = v_org_record.id 
            AND user_id = (SELECT id FROM public.users WHERE auth_id = v_user_id);
        END IF;
    END LOOP;

    -- 3. Finally, delete the User from auth.users
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Cleanup complete for %', target_email;
END;
$function$
```
</details>

### `ops.log_system_error(p_domain text, p_entity text, p_function_name text, p_error_message text, p_context jsonb DEFAULT NULL::jsonb, p_severity text DEFAULT 'error'::text)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.log_system_error(p_domain text, p_entity text, p_function_name text, p_error_message text, p_context jsonb DEFAULT NULL::jsonb, p_severity text DEFAULT 'error'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'ops'
AS $function$
BEGIN
  INSERT INTO ops.system_error_logs (
    domain,
    entity,
    function_name,
    error_message,
    context,
    severity
  )
  VALUES (
    p_domain,
    p_entity,
    p_function_name,
    p_error_message,
    p_context,
    p_severity
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'log_system_error failed: %', SQLERRM;
END;
$function$
```
</details>

### `ops.ops_apply_plan_to_org(p_alert_id uuid, p_executed_by uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.ops_apply_plan_to_org(p_alert_id uuid, p_executed_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'billing', 'academy', 'public'
AS $function$
DECLARE
  v_org_id UUID;
  v_plan_id UUID;
  v_payment_id UUID;
BEGIN
  -- 1. Validar alerta
  SELECT
    (metadata->>'organization_id')::uuid,
    (metadata->>'plan_id')::uuid,
    (metadata->>'payment_id')::uuid
  INTO
    v_org_id,
    v_plan_id,
    v_payment_id
  FROM ops_alerts
  WHERE id = p_alert_id
    AND status = 'open';

  IF v_org_id IS NULL OR v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Alert % does not contain required metadata', p_alert_id;
  END IF;

  -- 2. Aplicar plan a la organización
  UPDATE organizations
  SET
    plan_id = v_plan_id,
    updated_at = NOW()
  WHERE id = v_org_id;

  -- 3. Registrar reparación
  INSERT INTO ops_repair_logs (
    alert_id,
    action_id,
    executed_by,
    result,
    details
  )
  VALUES (
    p_alert_id,
    'apply_plan_to_org',
    p_executed_by,
    'success',
    jsonb_build_object(
      'organization_id', v_org_id,
      'plan_id', v_plan_id,
      'payment_id', v_payment_id
    )
  );

  -- 4. Marcar alerta como resuelta
  UPDATE ops_alerts
  SET
    status = 'resolved',
    resolved_at = NOW()
  WHERE id = p_alert_id;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO ops_repair_logs (
      alert_id,
      action_id,
      executed_by,
      result,
      details
    )
    VALUES (
      p_alert_id,
      'apply_plan_to_org',
      p_executed_by,
      'error',
      jsonb_build_object('error', SQLERRM)
    );

    RAISE;
END;
$function$
```
</details>

### `ops.ops_detect_orgs_without_currency()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.ops_detect_orgs_without_currency()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'public'
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

### `ops.ops_detect_payment_entitlement_missing()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.ops_detect_payment_entitlement_missing()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'public'
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

### `ops.ops_detect_payment_not_applied()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.ops_detect_payment_not_applied()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'public'
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

### `ops.ops_detect_subscription_missing_course()`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.ops_detect_subscription_missing_course()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'billing', 'academy', 'public'
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

### `ops.ops_execute_repair_action(p_alert_id uuid, p_action_id text, p_executed_by uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.ops_execute_repair_action(p_alert_id uuid, p_action_id text, p_executed_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'billing', 'academy', 'public'
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

### `ops.ops_retry_user_creation(p_alert_id uuid, p_executed_by uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.ops_retry_user_creation(p_alert_id uuid, p_executed_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'billing', 'academy', 'public'
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

### `ops.ops_run_all_checks()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.ops_run_all_checks()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'ops', 'billing', 'academy', 'public'
AS $function$
BEGIN
  -- Detectores de pagos
  PERFORM ops.ops_detect_payment_not_applied();

  -- Detector de entitlements
  PERFORM ops.ops_detect_payment_entitlement_missing();

  -- Detector de cursos no otorgados
  PERFORM ops.ops_detect_subscription_missing_course();

  -- Detector de orgs sin moneda
  PERFORM ops.ops_detect_orgs_without_currency();
END;
$function$
```
</details>

### `ops.reset_test_payments_and_subscriptions(p_user_id uuid, p_organization_id uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION ops.reset_test_payments_and_subscriptions(p_user_id uuid, p_organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'billing', 'academy', 'public'
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
