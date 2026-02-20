# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Functions (chunk 6: log_site_logs_activity — notify_subscription_activated)

### `log_site_logs_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_site_logs_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_site_log';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_site_log';
        ELSE
            audit_action := 'update_site_log';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_site_log';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Generic metadata, maybe add date or weather?
    audit_metadata := jsonb_build_object(
        'date', target_record.log_date,
        'summary', left(target_record.ai_summary, 50)
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'site_logs', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_subcontract_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_subcontract_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; audit_action := 'delete_subcontract';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_subcontract';
        ELSE
            audit_action := 'update_subcontract';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; audit_action := 'create_subcontract';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('title', target_record.title);

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'subcontracts', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_subcontract_payment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_subcontract_payment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; audit_action := 'delete_subcontract_payment';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (NEW.status = 'void' AND OLD.status != 'void') THEN
            audit_action := 'void_subcontract_payment';
        ELSE
            audit_action := 'update_subcontract_payment';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; audit_action := 'create_subcontract_payment';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('amount', target_record.amount, 'currency', target_record.currency_id);

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'subcontract_payments', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_system_error(p_domain text, p_entity text, p_function_name text, p_error_message text, p_context jsonb DEFAULT NULL::jsonb, p_severity text DEFAULT 'error'::text)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_system_error(p_domain text, p_entity text, p_function_name text, p_error_message text, p_context jsonb DEFAULT NULL::jsonb, p_severity text DEFAULT 'error'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.system_error_logs (
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

### `log_task_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_task_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_task';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_task';
        ELSE
            audit_action := 'update_task';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_task';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', COALESCE(target_record.name, target_record.custom_name),
        'code', target_record.code
    );

    -- CRITICAL: Wrap in exception handler for cascade deletes
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, 
            resolved_member_id,
            audit_action, 
            target_record.id, 
            'tasks', 
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        -- Silently skip if org/member no longer exists (cascade delete in progress)
        -- or if organization_id is null (system tasks)
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_task_division_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_task_division_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; audit_action := 'delete_task_division';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_task_division';
        ELSE
            audit_action := 'update_task_division';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; audit_action := 'create_task_division';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    -- Solo loguear si hay organization_id (divisiones de sistema no tienen org)
    IF target_record.organization_id IS NOT NULL THEN
        BEGIN
            INSERT INTO public.organization_activity_logs (
                organization_id, member_id, action, target_id, target_table, metadata
            ) VALUES (
                target_record.organization_id, resolved_member_id,
                audit_action, target_record.id, 'task_divisions', audit_metadata
            );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    RETURN NULL;
END;
$function$
```
</details>

### `log_task_recipe_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_task_recipe_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_task_recipe';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_task_recipe';
        ELSE
            audit_action := 'update_task_recipe';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_task_recipe';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Obtener nombre de la tarea para contexto en el log
    audit_metadata := jsonb_build_object(
        'task_id', target_record.task_id,
        'is_public', target_record.is_public
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'task_recipes',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_unit_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_unit_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
    target_org_id uuid;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_unit';
        resolved_member_id := OLD.updated_by;
        target_org_id := OLD.organization_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        target_org_id := NEW.organization_id;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_unit';
        ELSE
            audit_action := 'update_unit';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_unit';
        resolved_member_id := NEW.created_by;
        target_org_id := NEW.organization_id;
    END IF;

    -- Solo loguear si hay organization_id (no para unidades de sistema)
    IF target_org_id IS NULL THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'symbol', target_record.symbol
    );

    -- CRITICAL: Exception handler for cascade deletes
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_org_id, resolved_member_id,
            audit_action, target_record.id, 'units', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$
```
</details>

### `merge_contacts(p_source_contact_id uuid, p_target_contact_id uuid, p_organization_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.merge_contacts(p_source_contact_id uuid, p_target_contact_id uuid, p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_source record;
  v_target record;
  v_updated_count integer := 0;
  v_table_count integer;
begin
  -- ═════════════════════════════════════════════
  -- Validaciones
  -- ═════════════════════════════════════════════

  if p_source_contact_id = p_target_contact_id then
    return jsonb_build_object(
      'success', false,
      'error', 'SAME_CONTACT',
      'message', 'No podés reemplazar un contacto por sí mismo'
    );
  end if;

  -- Verificar que el source existe y pertenece a la org
  select id, organization_id, linked_user_id, full_name
  into v_source
  from public.contacts
  where id = p_source_contact_id
    and organization_id = p_organization_id
    and is_deleted = false;

  if v_source.id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'SOURCE_NOT_FOUND',
      'message', 'El contacto a reemplazar no existe'
    );
  end if;

  -- Verificar que el target existe y pertenece a la org
  select id, organization_id, linked_user_id, full_name
  into v_target
  from public.contacts
  where id = p_target_contact_id
    and organization_id = p_organization_id
    and is_deleted = false;

  if v_target.id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'TARGET_NOT_FOUND',
      'message', 'El contacto de destino no existe'
    );
  end if;

  -- No permitir reemplazar un contacto vinculado a un usuario activo
  if v_source.linked_user_id is not null then
    if exists (
      select 1 from public.organization_members
      where organization_id = p_organization_id
        and user_id = v_source.linked_user_id
        and is_active = true
    ) or exists (
      select 1 from public.organization_external_actors
      where organization_id = p_organization_id
        and user_id = v_source.linked_user_id
        and is_active = true
        and is_deleted = false
    ) then
      return jsonb_build_object(
        'success', false,
        'error', 'SOURCE_IS_LINKED_ACTIVE',
        'message', 'No se puede reemplazar un contacto vinculado a un usuario activo'
      );
    end if;
  end if;

  -- ═════════════════════════════════════════════
  -- Mover todas las referencias del source al target
  -- ═════════════════════════════════════════════

  -- 1. project_clients
  update public.project_clients
  set contact_id = p_target_contact_id, updated_at = now()
  where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count;
  v_updated_count := v_updated_count + v_table_count;

  -- 2. project_labor
  update public.project_labor
  set contact_id = p_target_contact_id, updated_at = now()
  where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count;
  v_updated_count := v_updated_count + v_table_count;

  -- 3. subcontracts
  update public.subcontracts
  set contact_id = p_target_contact_id, updated_at = now()
  where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count;
  v_updated_count := v_updated_count + v_table_count;

  -- 4. subcontract_bids
  update public.subcontract_bids
  set contact_id = p_target_contact_id, updated_at = now()
  where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count;
  v_updated_count := v_updated_count + v_table_count;

  -- 5. movements
  update public.movements
  set contact_id = p_target_contact_id, updated_at = now()
  where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count;
  v_updated_count := v_updated_count + v_table_count;

  -- 6. material_invoices
  update public.material_invoices
  set provider_id = p_target_contact_id, updated_at = now()
  where provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count;
  v_updated_count := v_updated_count + v_table_count;

  -- 7. material_purchase_orders
  update public.material_purchase_orders
  set provider_id = p_target_contact_id, updated_at = now()
  where provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count;
  v_updated_count := v_updated_count + v_table_count;

  -- 8. materials (default_provider)
  update public.materials
  set default_provider_id = p_target_contact_id, updated_at = now()
  where default_provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count;
  v_updated_count := v_updated_count + v_table_count;

  -- 9. task_recipe_external_services
  update public.task_recipe_external_services
  set contact_id = p_target_contact_id, updated_at = now()
  where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count;
  v_updated_count := v_updated_count + v_table_count;

  -- 10. media_links
  update public.media_links
  set contact_id = p_target_contact_id
  where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count;
  v_updated_count := v_updated_count + v_table_count;

  -- 11. contact_category_links
  -- Mover categorías que no existan ya en el target
  update public.contact_category_links
  set contact_id = p_target_contact_id
  where contact_id = p_source_contact_id
    and category_id not in (
      select category_id from public.contact_category_links
      where contact_id = p_target_contact_id
    );
  get diagnostics v_table_count = row_count;
  v_updated_count := v_updated_count + v_table_count;

  -- Borrar categorías duplicadas que no se pudieron mover
  delete from public.contact_category_links
  where contact_id = p_source_contact_id;

  -- ═════════════════════════════════════════════
  -- Soft-delete del contacto source
  -- ═════════════════════════════════════════════

  -- Temporalmente desactivar el trigger de protección para este delete
  -- (ya movimos todas las refs, así que está limpio)
  update public.contacts
  set
    is_deleted = true,
    deleted_at = now(),
    updated_at = now(),
    -- Limpiar linked_user_id para evitar conflictos de unique
    linked_user_id = null
  where id = p_source_contact_id;

  return jsonb_build_object(
    'success', true,
    'source_contact', v_source.full_name,
    'target_contact', v_target.full_name,
    'references_moved', v_updated_count,
    'message', 'Contacto "' || v_source.full_name || '" reemplazado por "' || v_target.full_name || '". ' || v_updated_count || ' referencias actualizadas.'
  );

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', 'UNEXPECTED_ERROR',
      'message', SQLERRM
    );
end;
$function$
```
</details>

### `notify_admin_on_new_user()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Llamamos a la función maestra
    -- Enviamos audiencia 'admins' para que le llegue a todos los admins
    PERFORM public.send_notification(
        NULL, -- user_id ignordo porque es para admins
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

### `notify_admin_on_payment()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_admin_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_amount_formatted text;
    v_user_email text;
BEGIN
    -- 1. Verificar si el pago está completado
    -- (Funciona para INSERT directo como 'completed' O para UPDATE de 'pending' -> 'completed')
    IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
        
        -- Opcional: Obtener info extra del usuario para el mensaje (si quieres el email en el cuerpo)
        SELECT email INTO v_user_email FROM public.users WHERE id = NEW.user_id;
        -- 2. Enviar Notificación
        PERFORM public.send_notification(
            NULL, -- Se ignora porque audiencia es 'admins'
            'success', -- Tipo de info
            '💰 Nuevo Pago Recibido', -- Título con emoji para diferenciar
            COALESCE(v_user_email, 'Un usuario') || ' ha pagado ' || NEW.amount || ' ' || COALESCE(NEW.currency, 'USD'),
            jsonb_build_object(
                'payment_id', NEW.id,
                'amount', NEW.amount,
                'user_id', NEW.user_id
            ),
            'admins' -- Broadcast a todos los admins
        );
    END IF;
    RETURN NEW;
END;
$function$
```
</details>

### `notify_broadcast_all(p_type text, p_title text, p_body text, p_data jsonb, p_created_by uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_broadcast_all(p_type text, p_title text, p_body text, p_data jsonb, p_created_by uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_notif_id uuid;
begin
  -- Crear notificación global
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
    'all',
    p_created_by
  )
  returning id into v_notif_id;

  -- Asociar a todos los usuarios activos
  insert into public.user_notifications (
    user_id,
    notification_id
  )
  select
    u.id,
    v_notif_id
  from public.users u
  where u.is_active = true
  on conflict (user_id, notification_id) do nothing;

  return v_notif_id;
end;
$function$
```
</details>

### `notify_course_enrollment()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_course_enrollment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_course_name TEXT;
    v_course_slug TEXT;
BEGIN
    -- Only notify on INSERT when status is 'active'
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        
        -- Get course info
        SELECT title, slug INTO v_course_name, v_course_slug
        FROM courses
        WHERE id = NEW.course_id;
        
        -- Call the master notification function
        PERFORM public.send_notification(
            NEW.user_id,                    -- 1. Recipient (the enrolled user)
            'success',                      -- 2. Type: success (positive event)
            '¡Inscripción Exitosa!',        -- 3. Title
            'Ya tienes acceso al curso "' || COALESCE(v_course_name, 'tu curso') || '". ¡Comienza a aprender!', -- 4. Body
            jsonb_build_object(             -- 5. Data (for navigation)
                'course_id', NEW.course_id,
                'enrollment_id', NEW.id,
                'url', '/academia/mis-cursos/' || COALESCE(v_course_slug, NEW.course_id::text)
            ), 
            'direct'                        -- 6. Audience: direct to user
        );
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

### `notify_kanban_card_assigned()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_kanban_card_assigned()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_assignee_user_id uuid;
    v_actor_user_id uuid;
    v_actor_name text;
    v_board_id uuid;
BEGIN
    -- Solo actuar si assigned_to cambió a un valor no-null
    IF NEW.assigned_to IS NULL THEN
        RETURN NEW;
    END IF;

    -- En UPDATE, solo actuar si el valor realmente cambió
    IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to THEN
        RETURN NEW;
    END IF;

    -- Resolver el user_id del miembro asignado (assigned_to = organization_members.id)
    SELECT om.user_id INTO v_assignee_user_id
    FROM public.organization_members om
    WHERE om.id = NEW.assigned_to;

    IF v_assignee_user_id IS NULL THEN
        RETURN NEW; -- Miembro no encontrado, no notificar
    END IF;

    -- Resolver quién hizo la asignación (el usuario actual)
    SELECT u.id, u.full_name INTO v_actor_user_id, v_actor_name
    FROM public.users u
    WHERE u.auth_id = auth.uid();

    -- No notificar si el usuario se asigna a sí mismo
    IF v_actor_user_id IS NOT NULL AND v_actor_user_id = v_assignee_user_id THEN
        RETURN NEW;
    END IF;

    -- Resolver board_id (puede venir del registro o del list)
    v_board_id := NEW.board_id;

    -- Enviar notificación
    PERFORM public.send_notification(
        v_assignee_user_id,                                     -- Destinatario (users.id)
        'info',                                                  -- Tipo
        'Nueva asignación',                                      -- Título
        COALESCE(v_actor_name, 'Alguien') || 
            ' te asignó a la tarjeta "' || NEW.title || '"',     -- Cuerpo
        jsonb_build_object(                                      -- Data (deep linking)
            'card_id', NEW.id,
            'board_id', v_board_id,
            'url', '/organization/planner?view=kanban&boardId=' || v_board_id::text
        ),
        'direct'                                                 -- Audiencia
    );

    RETURN NEW;
END;
$function$
```
</details>

### `notify_new_feedback()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_new_feedback()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_identity text;
BEGIN
    -- Intentar obtener info del usuario (opcional, si falla usa el ID)
    -- Asumimos que public.users tiene full_name o email.
    -- Si no, usamos 'Un usuario'.
    BEGIN
        SELECT COALESCE(full_name, email, 'Un usuario') INTO user_identity 
        FROM public.users 
        WHERE id = NEW.user_id;
    EXCEPTION WHEN OTHERS THEN
        user_identity := 'Un usuario';
    END;

    IF user_identity IS NULL THEN
        user_identity := 'Un usuario';
    END IF;

    -- Llamar a la función MAESTRA send_notification
    -- Audience: 'admins' (Notifica a todos los administradores)
    PERFORM public.send_notification(
        NULL,                                    -- user_id (NULL para broadcast/admins)
        'info',                                  -- type
        'Nuevo Feedback Recibido 💬',             -- title
        user_identity || ' ha enviado un nuevo comentario: "' || substring(NEW.message from 1 for 40) || (CASE WHEN length(NEW.message) > 40 THEN '...' ELSE '' END) || '"', -- body
        jsonb_build_object(                      -- metadata
            'feedback_id', NEW.id,
            'url', '/admin/feedback'             -- Link a futura sección de admin
        ), 
        'admins'                                 -- audience
    );

    RETURN NEW;
END;
$function$
```
</details>

### `notify_new_transfer()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_new_transfer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    payer_name text;
BEGIN
    -- Obtener nombre del pagador (si es nulo usar 'Un usuario')
    payer_name := COALESCE(NEW.payer_name, 'Un usuario');

    -- Llamar a la función MAESTRA para notificar a TODOS los admins
    PERFORM public.send_notification(
        NULL,                    -- NULL porque es para audiencia 'admins'
        'info',                  -- Tipo: info, success, warning, error
        'Nueva Transferencia',   -- Título
        payer_name || ' ha reportado un pago de ' || NEW.currency || ' ' || NEW.amount, -- Cuerpo
        jsonb_build_object(      -- DATA para redirección
            'payment_id', NEW.id,
            'url', '/admin/finance?id=' || NEW.id -- Ajusta esta URL a donde quieras que vayan al hacer clic
        ), 
        'admins'                 -- Audiencia: 'admins' (Broadcast)
    );

    RETURN NEW;
END;
$function$
```
</details>

### `notify_new_user()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Enviar notificación a los admins
    PERFORM public.send_notification(
        NULL,                           -- No direct user
        'info',                         -- Tipo
        'Nuevo Usuario',                -- Título
        'Se ha registrado el usuario ' || NEW.email,  -- Body
        jsonb_build_object(
            'user_id', NEW.id,
            'url', '/admin/directory?tab=users'   -- <-- Deep Link
        ),
        'admins'                        -- Audiencia
    );
    RETURN NEW;
END;
$function$
```
</details>

### `notify_push_on_notification()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.notify_push_on_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_title TEXT;
    v_body TEXT;
    v_data JSONB;
    v_app_url TEXT;
    v_push_api_secret TEXT;
BEGIN
    -- Leer la notificación padre para obtener título, body y data
    SELECT title, body, data
    INTO v_title, v_body, v_data
    FROM notifications
    WHERE id = NEW.notification_id;

    -- Si no encontró la notificación, no hacer nada
    IF v_title IS NULL THEN
        RETURN NEW;
    END IF;

    -- Leer variables de entorno 
    -- NOTA: Estas deben configurarse como secrets en Supabase:
    -- supabase secrets set PUSH_API_SECRET=tu_secret
    -- supabase secrets set APP_URL=https://app.seencel.com
    v_app_url := current_setting('app.settings.app_url', true);
    v_push_api_secret := current_setting('app.settings.push_api_secret', true);

    -- Si no están configuradas, no enviar push
    IF v_app_url IS NULL OR v_push_api_secret IS NULL THEN
        RETURN NEW;
    END IF;

    -- Enviar push via pg_net (HTTP POST asincrono)
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
