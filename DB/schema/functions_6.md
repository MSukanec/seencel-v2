# Database Schema (Auto-generated)
> Generated: 2026-02-18T21:46:26.792Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Functions & Procedures (chunk 6: log_quote_item_activity — notify_new_feedback)

### `log_quote_item_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_quote_item_activity()
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
        target_record := OLD; audit_action := 'delete_quote_item';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_quote_item';
        ELSE
            audit_action := 'update_quote_item';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; audit_action := 'create_quote_item';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Store minimal metadata context
    audit_metadata := jsonb_build_object(
        'description', target_record.description, 
        'quote_id', target_record.quote_id
    );

    -- Exception handler for cascade deletes or missing logs table
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'quote_items', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_recipe_external_service_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_recipe_external_service_activity()
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
        audit_action := 'delete_recipe_external_service';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_recipe_external_service';
        ELSE
            audit_action := 'update_recipe_external_service';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_recipe_external_service';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'recipe_id', target_record.recipe_id,
        'name', target_record.name,
        'unit_price', target_record.unit_price,
        'includes_materials', target_record.includes_materials
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'task_recipe_external_services', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_recipe_labor_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_recipe_labor_activity()
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
        audit_action := 'delete_recipe_labor';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_recipe_labor';
        ELSE
            audit_action := 'update_recipe_labor';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_recipe_labor';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'recipe_id', target_record.recipe_id,
        'labor_type_id', target_record.labor_type_id,
        'quantity', target_record.quantity
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'task_recipe_labor', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_recipe_material_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_recipe_material_activity()
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
        audit_action := 'delete_recipe_material';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_recipe_material';
        ELSE
            audit_action := 'update_recipe_material';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_recipe_material';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'recipe_id', target_record.recipe_id,
        'material_id', target_record.material_id,
        'quantity', target_record.quantity
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'task_recipe_materials', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_site_log_types_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_site_log_types_activity()
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
        audit_action := 'delete_site_log_type';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_site_log_type';
        ELSE
            audit_action := 'update_site_log_type';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_site_log_type';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    -- SAFE INSERT CATCHING ERRORS
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'site_log_types', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

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
