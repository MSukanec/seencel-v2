# Database Schema (Auto-generated)
> Generated: 2026-02-25T18:05:07.898Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [NOTIFICATIONS] Functions (chunk 1: notify_admin_on_new_user — send_notification)

### `notifications.notify_admin_on_new_user()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_admin_on_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications'
AS $function$
BEGIN
    PERFORM notifications.send_notification(
        NULL,
        'info',
        'Nuevo Usuario',
        'Se ha registrado el usuario ' || NEW.email,
        jsonb_build_object('user_id', NEW.id),
        'admins'
    );
    RETURN NEW;
END;
$function$
```
</details>

### `notifications.notify_admin_on_payment()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_admin_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'notifications', 'iam'
AS $function$
DECLARE
    v_amount_formatted text;
    v_user_email text;
BEGIN
    IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
        
        SELECT email INTO v_user_email FROM iam.users WHERE id = NEW.user_id;

        PERFORM notifications.send_notification(
            NULL,
            'success',
            '💰 Nuevo Pago Recibido',
            COALESCE(v_user_email, 'Un usuario') || ' ha pagado ' || NEW.amount || ' ' || COALESCE(NEW.currency, 'USD'),
            jsonb_build_object(
                'payment_id', NEW.id,
                'amount', NEW.amount,
                'user_id', NEW.user_id
            ),
            'admins'
        );
    END IF;
    RETURN NEW;
END;
$function$
```
</details>

### `notifications.notify_broadcast_all(p_type text, p_title text, p_body text, p_data jsonb, p_created_by uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_broadcast_all(p_type text, p_title text, p_body text, p_data jsonb, p_created_by uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'iam'
AS $function$
DECLARE
  v_notif_id uuid;
BEGIN
  INSERT INTO notifications.notifications (
    type, title, body, data, audience, created_by
  )
  VALUES (
    p_type, p_title, p_body,
    COALESCE(p_data, '{}'::jsonb),
    'all', p_created_by
  )
  RETURNING id INTO v_notif_id;

  INSERT INTO notifications.user_notifications (user_id, notification_id)
  SELECT u.id, v_notif_id
  FROM iam.users u
  WHERE u.is_active = true
  ON CONFLICT (user_id, notification_id) DO NOTHING;

  RETURN v_notif_id;
END;
$function$
```
</details>

### `notifications.notify_course_enrollment()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_course_enrollment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'academy', 'notifications'
AS $function$
DECLARE
    v_course_name TEXT;
    v_course_slug TEXT;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        
        SELECT title, slug INTO v_course_name, v_course_slug
        FROM courses
        WHERE id = NEW.course_id;
        
        PERFORM notifications.send_notification(
            NEW.user_id,
            'success',
            '¡Inscripción Exitosa!',
            'Ya tienes acceso al curso "' || COALESCE(v_course_name, 'tu curso') || '". ¡Comienza a aprender!',
            jsonb_build_object(
                'course_id', NEW.course_id,
                'enrollment_id', NEW.id,
                'url', '/academia/mis-cursos/' || COALESCE(v_course_slug, NEW.course_id::text)
            ), 
            'direct'
        );
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

### `notifications.notify_new_feedback()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_new_feedback()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'iam'
AS $function$
DECLARE
    user_identity text;
BEGIN
    BEGIN
        SELECT COALESCE(full_name, email, 'Un usuario') INTO user_identity
        FROM iam.users
        WHERE id = NEW.user_id;
    EXCEPTION WHEN OTHERS THEN
        user_identity := 'Un usuario';
    END;

    IF user_identity IS NULL THEN
        user_identity := 'Un usuario';
    END IF;

    PERFORM notifications.send_notification(
        NULL,
        'info',
        'Nuevo Feedback Recibido 💬',
        user_identity || ' ha enviado un nuevo comentario: "' ||
            substring(NEW.message from 1 for 40) ||
            (CASE WHEN length(NEW.message) > 40 THEN '...' ELSE '' END) || '"',
        jsonb_build_object(
            'feedback_id', NEW.id,
            'url', '/admin/feedback'
        ),
        'admins'
    );

    RETURN NEW;
END;
$function$
```
</details>

### `notifications.notify_new_transfer()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_new_transfer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'notifications'
AS $function$
DECLARE
    payer_name text;
BEGIN
    payer_name := COALESCE(NEW.payer_name, 'Un usuario');

    PERFORM notifications.send_notification(
        NULL,
        'info',
        'Nueva Transferencia',
        payer_name || ' ha reportado un pago de ' || NEW.currency || ' ' || NEW.amount,
        jsonb_build_object(
            'payment_id', NEW.id,
            'url', '/admin/finance?id=' || NEW.id
        ), 
        'admins'
    );

    RETURN NEW;
END;
$function$
```
</details>

### `notifications.notify_new_user()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications'
AS $function$
BEGIN
    PERFORM notifications.send_notification(
        NULL,
        'info',
        'Nuevo Usuario',
        'Se ha registrado el usuario ' || NEW.email,
        jsonb_build_object(
            'user_id', NEW.id,
            'url', '/admin/directory?tab=users'
        ),
        'admins'
    );
    RETURN NEW;
END;
$function$
```
</details>

### `notifications.notify_push_on_notification()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_push_on_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications'
AS $function$
DECLARE
    v_title TEXT;
    v_body TEXT;
    v_data JSONB;
    v_app_url TEXT;
    v_push_api_secret TEXT;
BEGIN
    SELECT title, body, data
    INTO v_title, v_body, v_data
    FROM notifications.notifications
    WHERE id = NEW.notification_id;

    IF v_title IS NULL THEN
        RETURN NEW;
    END IF;

    v_app_url := current_setting('app.settings.app_url', true);
    v_push_api_secret := current_setting('app.settings.push_api_secret', true);

    IF v_app_url IS NULL OR v_push_api_secret IS NULL THEN
        RETURN NEW;
    END IF;

    PERFORM net.http_post(
        url := v_app_url || '/api/push/send',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_push_api_secret
        ),
        body := jsonb_build_object(
            'user_id', NEW.user_id,
            'title', v_title,
            'body', COALESCE(v_body, ''),
            'data', COALESCE(v_data, '{}'::jsonb)
        )
    );

    RETURN NEW;
END;
$function$
```
</details>

### `notifications.notify_quote_status_change()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_quote_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'construction', 'projects'
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
    IF NEW.status IN ('approved', 'rejected') AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN

        SELECT p.name, c.name, NEW.name, p.id
        INTO v_project_name, v_client_name, v_quote_name, v_project_id
        FROM projects.projects p
        LEFT JOIN projects.project_clients c ON NEW.client_id = c.id
        WHERE p.id = NEW.project_id;

        IF NEW.status = 'approved' THEN
            v_notification_type := 'success';
            v_notification_title := '✅ Presupuesto Aprobado';
            v_notification_body := COALESCE(v_client_name, 'Un cliente') ||
                ' aprobó el presupuesto "' || COALESCE(v_quote_name, 'Sin nombre') ||
                '" del proyecto ' || COALESCE(v_project_name, 'Sin nombre') || '.';
        ELSE
            v_notification_type := 'warning';
            v_notification_title := '❌ Presupuesto Rechazado';
            v_notification_body := COALESCE(v_client_name, 'Un cliente') ||
                ' rechazó el presupuesto "' || COALESCE(v_quote_name, 'Sin nombre') ||
                '" del proyecto ' || COALESCE(v_project_name, 'Sin nombre') || '.';

            IF NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason != '' THEN
                v_notification_body := v_notification_body ||
                    ' Motivo: "' || NEW.rejection_reason || '"';
            END IF;
        END IF;

        PERFORM notifications.send_notification(
            NULL,
            v_notification_type,
            v_notification_title,
            v_notification_body,
            jsonb_build_object(
                'quote_id', NEW.id,
                'project_id', v_project_id,
                'client_id', NEW.client_id,
                'status', NEW.status,
                'url', '/project/' || v_project_id || '/quotes'
            ),
            'admins'
        );
    END IF;

    RETURN NEW;
END;
$function$
```
</details>

### `notifications.notify_subscription_activated()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_subscription_activated()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'notifications', 'iam'
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
    IF NEW.status = 'active' THEN
        
        SELECT name INTO v_plan_name
        FROM billing.plans
        WHERE id = NEW.plan_id;
        
        SELECT owner_id INTO v_owner_id
        FROM iam.organizations
        WHERE id = NEW.organization_id;

        v_billing_label := CASE 
            WHEN NEW.billing_period = 'annual' THEN 'anual'
            ELSE 'mensual'
        END;
        
        SELECT p.name INTO v_previous_plan
        FROM billing.organization_subscriptions s
        JOIN billing.plans p ON p.id = s.plan_id
        WHERE s.organization_id = NEW.organization_id
          AND s.id != NEW.id
          AND s.status IN ('expired', 'cancelled')
        ORDER BY s.created_at DESC
        LIMIT 1;
        
        v_is_upgrade := (v_previous_plan IS NOT NULL);
        
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
        
        IF v_owner_id IS NOT NULL THEN
            PERFORM notifications.send_notification(
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
        
        PERFORM notifications.send_notification(
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

### `notifications.notify_system_error()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_system_error()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'iam', 'billing'
AS $function$
DECLARE
    v_user_name text := NULL;
    v_user_email text := NULL;
    v_org_name text := NULL;
    v_body text;
    v_context_parts text[] := ARRAY[]::text[];
BEGIN
    IF NEW.severity NOT IN ('error', 'critical') THEN
        RETURN NEW;
    END IF;

    IF NEW.context ? 'user_id' AND (NEW.context->>'user_id') IS NOT NULL THEN
        SELECT u.full_name, u.email
        INTO v_user_name, v_user_email
        FROM iam.users u
        WHERE u.id = (NEW.context->>'user_id')::uuid;
    END IF;

    IF NEW.context ? 'organization_id' AND (NEW.context->>'organization_id') IS NOT NULL THEN
        SELECT o.name
        INTO v_org_name
        FROM iam.organizations o
        WHERE o.id = (NEW.context->>'organization_id')::uuid;
    END IF;

    v_body := NEW.function_name || ': ' || LEFT(NEW.error_message, 100);

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

    PERFORM notifications.send_notification(
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

### `notifications.notify_user_direct(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb, p_created_by uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_user_direct(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb, p_created_by uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications'
AS $function$
declare
  v_notif_id uuid;
begin
  -- Crear notificación directa
  insert into notifications.notifications (
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
  insert into notifications.user_notifications (
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

### `notifications.notify_user_payment_completed()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.notify_user_payment_completed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'notifications'
AS $function$
BEGIN
    IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
        
        PERFORM notifications.send_notification(
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

### `notifications.queue_email_bank_transfer(p_user_id uuid, p_transfer_id uuid, p_product_name text, p_amount numeric, p_currency text, p_payer_name text, p_receipt_url text, p_user_email text DEFAULT NULL::text, p_user_first_name text DEFAULT NULL::text)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.queue_email_bank_transfer(p_user_id uuid, p_transfer_id uuid, p_product_name text, p_amount numeric, p_currency text, p_payer_name text, p_receipt_url text, p_user_email text DEFAULT NULL::text, p_user_first_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'iam'
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
    INSERT INTO notifications.email_queue (
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
            'reference', p_transfer_id
        ),
        'pending',
        NOW()
    );

    -- 3. Insertar email para el ADMIN (AdminNewTransfer)
    INSERT INTO notifications.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        status,
        created_at
    ) VALUES (
        'contacto@seencel.com',
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
    RAISE NOTICE 'Error en queue_email_bank_transfer: %', SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;$function$
```
</details>

### `notifications.queue_email_welcome()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.queue_email_welcome()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'iam'
AS $function$
BEGIN
    -- Solo procesar si es un INSERT (nuevo usuario)
    IF TG_OP = 'INSERT' THEN
        -- Insertar en cola de emails
        INSERT INTO notifications.email_queue (
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

### `notifications.queue_purchase_email()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.queue_purchase_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'billing', 'academy', 'iam'
AS $function$
DECLARE
    v_user_email text;
    v_user_name text;
    v_product_name text;
    v_subject_user text;
    v_subject_admin text;
BEGIN
    -- Solo pagos completados
    IF NEW.status <> 'completed' THEN
        RETURN NEW;
    END IF;

    -- Obtener datos del usuario
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM iam.users
    WHERE id = NEW.user_id;

    IF v_user_email IS NULL THEN
        RAISE NOTICE 'queue_purchase_email: Usuario % no encontrado', NEW.user_id;
        RETURN NEW;
    END IF;

    -- Obtener nombre del producto desde metadata (enriquecida por los handlers)
    v_product_name := NEW.metadata->>'product_name';

    -- Fallback: construir nombre si no está en metadata
    IF v_product_name IS NULL THEN
        CASE NEW.product_type
            WHEN 'course' THEN
                SELECT title INTO v_product_name FROM academy.courses WHERE id = NEW.course_id;
                v_product_name := COALESCE(v_product_name, 'Curso');
            WHEN 'subscription' THEN
                SELECT name INTO v_product_name FROM billing.plans WHERE id = NEW.product_id;
                v_product_name := COALESCE(v_product_name, 'Plan');
            WHEN 'upgrade' THEN
                SELECT name INTO v_product_name FROM billing.plans WHERE id = NEW.product_id;
                v_product_name := 'Upgrade a ' || COALESCE(v_product_name, 'Plan');
            WHEN 'seat_purchase' THEN
                v_product_name := COALESCE(NEW.metadata->>'seats_purchased', '?') || ' asiento(s) adicional(es)';
            ELSE
                v_product_name := 'Producto';
        END CASE;
    END IF;

    -- Construir subjects
    v_subject_user := CASE NEW.product_type
        WHEN 'course' THEN '¡Tu curso está listo!'
        WHEN 'subscription' THEN '¡Bienvenido a SEENCEL ' || v_product_name || '!'
        WHEN 'upgrade' THEN '¡Plan mejorado!'
        ELSE 'Confirmación de compra'
    END;
    v_subject_admin := '💰 Nueva venta: ' || v_product_name;

    -- Email al comprador
    INSERT INTO notifications.email_queue (
        recipient_email, recipient_name, template_type, subject, data, created_at
    ) VALUES (
        v_user_email,
        COALESCE(v_user_name, 'Usuario'),
        'purchase_confirmation',
        v_subject_user,
        jsonb_build_object(
            'user_id', NEW.user_id, 'user_email', v_user_email,
            'user_name', v_user_name, 'product_type', NEW.product_type,
            'product_name', v_product_name, 'amount', NEW.amount,
            'currency', NEW.currency, 'payment_id', NEW.id,
            'provider', COALESCE(NEW.provider, NEW.gateway)
        ),
        NOW()
    );

    -- Email al admin
    INSERT INTO notifications.email_queue (
        recipient_email, recipient_name, template_type, subject, data, created_at
    ) VALUES (
        'contacto@seencel.com',
        'Admin SEENCEL',
        'admin_sale_notification',
        v_subject_admin,
        jsonb_build_object(
            'buyer_email', v_user_email, 'buyer_name', v_user_name,
            'product_type', NEW.product_type, 'product_name', v_product_name,
            'amount', NEW.amount, 'currency', NEW.currency,
            'payment_id', NEW.id, 'provider', COALESCE(NEW.provider, NEW.gateway)
        ),
        NOW()
    );

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'queue_purchase_email error: %', SQLERRM;
    RETURN NEW;
END;
$function$
```
</details>

### `notifications.send_notification(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb DEFAULT '{}'::jsonb, p_audience text DEFAULT 'direct'::text)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION notifications.send_notification(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb DEFAULT '{}'::jsonb, p_audience text DEFAULT 'direct'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'iam'
AS $function$
DECLARE
    v_notification_id uuid;
BEGIN
    -- 1. Insertar la notificación
    INSERT INTO notifications.notifications (type, title, body, data, audience)
    VALUES (p_type, p_title, p_body, p_data, p_audience)
    RETURNING id INTO v_notification_id;

    -- 2. Distribuir según audiencia
    IF p_audience = 'direct' AND p_user_id IS NOT NULL THEN
        INSERT INTO notifications.user_notifications (user_id, notification_id)
        VALUES (p_user_id, v_notification_id);
    
    ELSIF p_audience = 'admins' THEN
        INSERT INTO notifications.user_notifications (user_id, notification_id)
        SELECT id, v_notification_id
        FROM iam.users
        WHERE role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid;
        
    END IF;

    RETURN v_notification_id;
END;
$function$
```
</details>
