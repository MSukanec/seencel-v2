# Database Schema (Auto-generated)
> Generated: 2026-02-19T12:56:55.329Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Functions (chunk 7: notify_quote_status_change — redeem_coupon_universal)

### `notify_quote_status_change()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_quote_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_project_name TEXT;
    v_client_name TEXT;
    v_quote_name TEXT;
    v_notification_type TEXT;
    v_notification_title TEXT;
    v_notification_body TEXT;
    v_project_id UUID;
BEGIN
    -- Solo procesar si el status cambió a 'approved' o 'rejected'
    IF NEW.status IN ('approved', 'rejected') AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
        
        -- Obtener datos del proyecto y cliente para el mensaje
        SELECT p.name, c.name, NEW.name, p.id
        INTO v_project_name, v_client_name, v_quote_name, v_project_id
        FROM projects p
        LEFT JOIN clients c ON NEW.client_id = c.id
        WHERE p.id = NEW.project_id;
        
        -- Configurar mensaje según el tipo de acción
        IF NEW.status = 'approved' THEN
            v_notification_type := 'success';
            v_notification_title := '✅ Presupuesto Aprobado';
            v_notification_body := COALESCE(v_client_name, 'Un cliente') || ' aprobó el presupuesto "' || COALESCE(v_quote_name, 'Sin nombre') || '" del proyecto ' || COALESCE(v_project_name, 'Sin nombre') || '.';
        ELSE
            v_notification_type := 'warning';
            v_notification_title := '❌ Presupuesto Rechazado';
            v_notification_body := COALESCE(v_client_name, 'Un cliente') || ' rechazó el presupuesto "' || COALESCE(v_quote_name, 'Sin nombre') || '" del proyecto ' || COALESCE(v_project_name, 'Sin nombre') || '.';
            
            -- Agregar motivo de rechazo si existe
            IF NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason != '' THEN
                v_notification_body := v_notification_body || ' Motivo: "' || NEW.rejection_reason || '"';
            END IF;
        END IF;
        
        -- Llamar a la función MAESTRA - notificar a todos los admins
        PERFORM public.send_notification(
            NULL,                              -- 1. Destinatario (NULL = broadcast)
            v_notification_type,               -- 2. Tipo: 'success' o 'warning'
            v_notification_title,              -- 3. Título
            v_notification_body,               -- 4. Cuerpo
            jsonb_build_object(                -- 5. DATA (Deep Linking)
                'quote_id', NEW.id,
                'project_id', v_project_id,
                'client_id', NEW.client_id,
                'status', NEW.status,
                'url', '/project/' || v_project_id || '/quotes'
            ), 
            'admins'                           -- 6. Audiencia: 'admins' para todos los admins
        );
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

### `notify_subscription_activated()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_subscription_activated()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_plan_name text;
    v_owner_id uuid;
    v_is_upgrade boolean := false;
    v_previous_plan text;
    v_title_owner text;
    v_body_owner text;
    v_title_admin text;
    v_body_admin text;
    v_billing_label text;
BEGIN
    -- Solo notificar cuando la suscripción se crea activa
    IF NEW.status = 'active' THEN
        
        -- Obtener nombre del plan
        SELECT name INTO v_plan_name
        FROM public.plans
        WHERE id = NEW.plan_id;
        
        -- Obtener el owner de la organización
        SELECT owner_id INTO v_owner_id
        FROM public.organizations
        WHERE id = NEW.organization_id;

        -- Etiqueta del período
        v_billing_label := CASE 
            WHEN NEW.billing_period = 'annual' THEN 'anual'
            ELSE 'mensual'
        END;
        
        -- Detectar si es upgrade: ¿hay una suscripción anterior para esta org?
        SELECT p.name INTO v_previous_plan
        FROM public.organization_subscriptions s
        JOIN public.plans p ON p.id = s.plan_id
        WHERE s.organization_id = NEW.organization_id
          AND s.id != NEW.id
          AND s.status IN ('expired', 'cancelled')
        ORDER BY s.created_at DESC
        LIMIT 1;
        
        v_is_upgrade := (v_previous_plan IS NOT NULL);
        
        -- Construir mensajes según sea upgrade o nueva suscripción
        IF v_is_upgrade THEN
            v_title_owner := '⬆️ ¡Plan Mejorado!';
            v_body_owner := 'Tu plan fue mejorado a ' || COALESCE(v_plan_name, '') || '. ¡A disfrutarlo! 🚀';
            v_title_admin := '⬆️ Upgrade de Plan';
            v_body_admin := 'Organización mejoró de ' || COALESCE(v_previous_plan, '?') || ' a ' || COALESCE(v_plan_name, '') || ' (' || v_billing_label || ') por ' || NEW.amount || ' ' || NEW.currency;
        ELSE
            v_title_owner := '¡Plan Activado!';
            v_body_owner := 'Tu plan ' || COALESCE(v_plan_name, '') || ' está activo. ¡Hora de construir! 🚀';
            v_title_admin := '💰 Nueva Suscripción';
            v_body_admin := 'Organización activó plan ' || COALESCE(v_plan_name, '') || ' (' || v_billing_label || ') por ' || NEW.amount || ' ' || NEW.currency;
        END IF;
        
        -- Notificación al dueño de la organización
        IF v_owner_id IS NOT NULL THEN
            PERFORM public.send_notification(
                v_owner_id,
                'success',
                v_title_owner,
                v_body_owner,
                jsonb_build_object(
                    'subscription_id', NEW.id,
                    'plan_id', NEW.plan_id,
                    'plan_name', v_plan_name,
                    'billing_period', NEW.billing_period,
                    'is_upgrade', v_is_upgrade,
                    'url', '/organization/settings?tab=billing'
                ),
                'direct'
            );
        END IF;
        
        -- Notificar a admins de la plataforma
        PERFORM public.send_notification(
            NULL,
            'info',
            v_title_admin,
            v_body_admin,
            jsonb_build_object(
                'subscription_id', NEW.id,
                'organization_id', NEW.organization_id,
                'plan_name', v_plan_name,
                'billing_period', NEW.billing_period,
                'amount', NEW.amount,
                'currency', NEW.currency,
                'is_upgrade', v_is_upgrade,
                'previous_plan', v_previous_plan
            ),
            'admins'
        );
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

### `notify_system_error()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_system_error()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_name text := NULL;
    v_user_email text := NULL;
    v_org_name text := NULL;
    v_body text;
    v_context_parts text[] := ARRAY[]::text[];
BEGIN
    -- Solo notificar errores de severidad 'error' o 'critical'
    IF NEW.severity NOT IN ('error', 'critical') THEN
        RETURN NEW;
    END IF;

    -- Resolver usuario si existe en context
    IF NEW.context ? 'user_id' AND (NEW.context->>'user_id') IS NOT NULL THEN
        SELECT u.full_name, u.email
        INTO v_user_name, v_user_email
        FROM public.users u
        WHERE u.id = (NEW.context->>'user_id')::uuid;
    END IF;

    -- Resolver organización si existe en context
    IF NEW.context ? 'organization_id' AND (NEW.context->>'organization_id') IS NOT NULL THEN
        SELECT o.name
        INTO v_org_name
        FROM public.organizations o
        WHERE o.id = (NEW.context->>'organization_id')::uuid;
    END IF;

    -- Construir cuerpo legible
    v_body := NEW.function_name || ': ' || LEFT(NEW.error_message, 100);

    -- Agregar contexto humano si existe
    IF v_org_name IS NOT NULL THEN
        v_context_parts := array_append(v_context_parts, 'Org: ' || v_org_name);
    END IF;

    IF v_user_name IS NOT NULL THEN
        v_context_parts := array_append(v_context_parts, 'Usuario: ' || v_user_name);
    ELSIF v_user_email IS NOT NULL THEN
        v_context_parts := array_append(v_context_parts, 'Usuario: ' || v_user_email);
    END IF;

    IF array_length(v_context_parts, 1) > 0 THEN
        v_body := v_body || ' (' || array_to_string(v_context_parts, ' | ') || ')';
    END IF;

    -- Enviar notificación a admins
    PERFORM public.send_notification(
        NULL,
        CASE 
            WHEN NEW.severity = 'critical' THEN 'error'
            ELSE 'warning'
        END,
        CASE
            WHEN NEW.severity = 'critical' THEN '🚨 Error Crítico'
            ELSE '⚠️ Error del Sistema'
        END,
        v_body,
        jsonb_build_object(
            'error_id', NEW.id,
            'domain', NEW.domain,
            'entity', NEW.entity,
            'function_name', NEW.function_name,
            'severity', NEW.severity,
            'url', '/admin/monitoring'
        ),
        'admins'
    );

    RETURN NEW;
END;
$function$
```
</details>

### `notify_user_direct(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb, p_created_by uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_user_direct(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb, p_created_by uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_notif_id uuid;
begin
  -- Crear notificación directa
  insert into public.notifications (
    type,
    title,
    body,
    data,
    audience,
    created_by
  )
  values (
    p_type,
    p_title,
    p_body,
    coalesce(p_data, '{}'::jsonb),
    'direct',
    p_created_by
  )
  returning id into v_notif_id;

  -- Asociar al usuario destino
  insert into public.user_notifications (
    user_id,
    notification_id
  )
  values (
    p_user_id,
    v_notif_id
  )
  on conflict (user_id, notification_id) do nothing;

  return v_notif_id;
end;
$function$
```
</details>

### `notify_user_payment_completed()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_user_payment_completed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
        
        PERFORM public.send_notification(
            NEW.user_id,
            'success',
            '¡Pago Confirmado!',
            'Tu pago de ' || NEW.currency || ' $' || NEW.amount || ' fue procesado correctamente.',
            jsonb_build_object(
                'payment_id', NEW.id,
                'product_type', NEW.product_type,
                'amount', NEW.amount,
                'currency', NEW.currency
            ),
            'direct'
        );
    END IF;
    RETURN NEW;
END;
$function$
```
</details>

### `ops_apply_plan_to_org(p_alert_id uuid, p_executed_by uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.ops_apply_plan_to_org(p_alert_id uuid, p_executed_by uuid)
 RETURNS void
 LANGUAGE plpgsql
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

### `protect_linked_contact_delete()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.protect_linked_contact_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_is_active_member boolean;
  v_is_active_actor boolean;
  v_ref_count integer := 0;
  v_ref_tables text[] := '{}';
begin
  -- Solo actuar cuando se está haciendo soft-delete
  if not (old.is_deleted = false and new.is_deleted = true) then
    return new;
  end if;

  -- ═════════════════════════════════════════════
  -- A. Proteger contactos vinculados a usuarios activos
  -- ═════════════════════════════════════════════
  if new.linked_user_id is not null then
    -- ¿El user sigue como miembro activo de esta org?
    select exists (
      select 1
      from public.organization_members om
      where om.organization_id = new.organization_id
        and om.user_id = new.linked_user_id
        and om.is_active = true
    )
    into v_is_active_member;

    -- ¿El user sigue como external actor activo de esta org?
    select exists (
      select 1
      from public.organization_external_actors oea
      where oea.organization_id = new.organization_id
        and oea.user_id = new.linked_user_id
        and oea.is_active = true
        and oea.is_deleted = false
    )
    into v_is_active_actor;

    if v_is_active_member or v_is_active_actor then
      raise exception 'No se puede eliminar un contacto vinculado a un usuario activo de la organización. Primero desvinculá al miembro o colaborador externo.'
        using errcode = 'P0001';
    end if;
  end if;

  -- ═════════════════════════════════════════════
  -- B. Proteger contactos referenciados en datos activos
  -- ═════════════════════════════════════════════

  -- project_clients
  if exists (
    select 1 from public.project_clients
    where contact_id = old.id and is_deleted = false
  ) then
    v_ref_tables := array_append(v_ref_tables, 'clientes de proyecto');
  end if;

  -- project_labor
  if exists (
    select 1 from public.project_labor
    where contact_id = old.id and is_deleted = false
  ) then
    v_ref_tables := array_append(v_ref_tables, 'mano de obra');
  end if;

  -- subcontracts
  if exists (
    select 1 from public.subcontracts
    where contact_id = old.id and coalesce(is_deleted, false) = false
  ) then
    v_ref_tables := array_append(v_ref_tables, 'subcontratos');
  end if;

  -- subcontract_bids
  if exists (
    select 1 from public.subcontract_bids
    where contact_id = old.id
  ) then
    v_ref_tables := array_append(v_ref_tables, 'ofertas de subcontrato');
  end if;

  -- movements
  if exists (
    select 1 from public.movements
    where contact_id = old.id
  ) then
    v_ref_tables := array_append(v_ref_tables, 'movimientos financieros');
  end if;

  -- material_invoices
  if exists (
    select 1 from public.material_invoices
    where provider_id = old.id
  ) then
    v_ref_tables := array_append(v_ref_tables, 'facturas de materiales');
  end if;

  -- material_purchase_orders
  if exists (
    select 1 from public.material_purchase_orders
    where provider_id = old.id and is_deleted = false
  ) then
    v_ref_tables := array_append(v_ref_tables, 'órdenes de compra');
  end if;

  -- materials (default_provider)
  if exists (
    select 1 from public.materials
    where default_provider_id = old.id and is_deleted = false
  ) then
    v_ref_tables := array_append(v_ref_tables, 'proveedor default de materiales');
  end if;

  -- task_recipe_external_services
  if exists (
    select 1 from public.task_recipe_external_services
    where contact_id = old.id and is_deleted = false
  ) then
    v_ref_tables := array_append(v_ref_tables, 'servicios externos de recetas');
  end if;

  if array_length(v_ref_tables, 1) > 0 then
    raise exception 'No se puede eliminar este contacto porque está siendo usado en: %. Primero reemplazalo por otro contacto.',
      array_to_string(v_ref_tables, ', ')
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$
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
