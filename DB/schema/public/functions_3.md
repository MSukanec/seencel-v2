# Database Schema (Auto-generated)
> Generated: 2026-02-21T03:04:42.923Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Functions (chunk 3: is_self — step_create_organization_roles)

### `is_self(p_user_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_self(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_self(p_user_id);
$function$
```
</details>

### `is_system_row(p_is_system boolean)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_system_row(p_is_system boolean)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_system_row(p_is_system);
$function$
```
</details>

### `lock_org_task_on_update()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.lock_org_task_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- organization_id es inmutable
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id is immutable';
  end if;

  -- task_id es inmutable
  if new.task_id is distinct from old.task_id then
    raise exception 'task_id is immutable';
  end if;

  return new;
end;
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
 SET search_path TO 'public', 'iam'
AS $function$
declare
  v_source record;
  v_target record;
  v_updated_count integer := 0;
  v_table_count integer;
begin
  if p_source_contact_id = p_target_contact_id then
    return jsonb_build_object('success', false, 'error', 'SAME_CONTACT', 'message', 'No podés reemplazar un contacto por sí mismo');
  end if;

  select id, organization_id, linked_user_id, full_name into v_source
  from public.contacts where id = p_source_contact_id and organization_id = p_organization_id and is_deleted = false;

  if v_source.id is null then
    return jsonb_build_object('success', false, 'error', 'SOURCE_NOT_FOUND', 'message', 'El contacto a reemplazar no existe');
  end if;

  select id, organization_id, linked_user_id, full_name into v_target
  from public.contacts where id = p_target_contact_id and organization_id = p_organization_id and is_deleted = false;

  if v_target.id is null then
    return jsonb_build_object('success', false, 'error', 'TARGET_NOT_FOUND', 'message', 'El contacto de destino no existe');
  end if;

  if v_source.linked_user_id is not null then
    if exists (
      select 1 from iam.organization_members
      where organization_id = p_organization_id and user_id = v_source.linked_user_id and is_active = true
    ) or exists (
      select 1 from iam.organization_external_actors
      where organization_id = p_organization_id and user_id = v_source.linked_user_id and is_active = true and is_deleted = false
    ) then
      return jsonb_build_object('success', false, 'error', 'SOURCE_IS_LINKED_ACTIVE', 'message', 'No se puede reemplazar un contacto vinculado a un usuario activo');
    end if;
  end if;

  update public.project_clients set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.project_labor set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.subcontracts set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.subcontract_bids set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.movements set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.material_invoices set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.material_purchase_orders set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.materials set default_provider_id = p_target_contact_id, updated_at = now() where default_provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.task_recipe_external_services set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.media_links set contact_id = p_target_contact_id where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.contact_category_links set contact_id = p_target_contact_id
  where contact_id = p_source_contact_id
    and category_id not in (select category_id from public.contact_category_links where contact_id = p_target_contact_id);
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  delete from public.contact_category_links where contact_id = p_source_contact_id;

  update public.contacts
  set is_deleted = true, deleted_at = now(), updated_at = now(), linked_user_id = null
  where id = p_source_contact_id;

  return jsonb_build_object(
    'success', true, 'source_contact', v_source.full_name, 'target_contact', v_target.full_name,
    'references_moved', v_updated_count,
    'message', 'Contacto "' || v_source.full_name || '" reemplazado por "' || v_target.full_name || '". ' || v_updated_count || ' referencias actualizadas.'
  );

exception
  when others then
    return jsonb_build_object('success', false, 'error', 'UNEXPECTED_ERROR', 'message', SQLERRM);
end;
$function$
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
 SET search_path TO 'public', 'iam'
AS $function$
declare
  v_is_active_member boolean;
  v_is_active_actor boolean;
  v_ref_count integer := 0;
  v_ref_tables text[] := '{}';
begin
  if not (old.is_deleted = false and new.is_deleted = true) then
    return new;
  end if;

  if new.linked_user_id is not null then
    select exists (
      select 1 from iam.organization_members om
      where om.organization_id = new.organization_id and om.user_id = new.linked_user_id and om.is_active = true
    ) into v_is_active_member;

    select exists (
      select 1 from iam.organization_external_actors oea
      where oea.organization_id = new.organization_id and oea.user_id = new.linked_user_id
        and oea.is_active = true and oea.is_deleted = false
    ) into v_is_active_actor;

    if v_is_active_member or v_is_active_actor then
      raise exception 'No se puede eliminar un contacto vinculado a un usuario activo de la organización. Primero desvinculá al miembro o colaborador externo.'
        using errcode = 'P0001';
    end if;
  end if;

  if exists (select 1 from public.project_clients where contact_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'clientes de proyecto');
  end if;
  if exists (select 1 from public.project_labor where contact_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'mano de obra');
  end if;
  if exists (select 1 from public.subcontracts where contact_id = old.id and coalesce(is_deleted, false) = false) then
    v_ref_tables := array_append(v_ref_tables, 'subcontratos');
  end if;
  if exists (select 1 from public.subcontract_bids where contact_id = old.id) then
    v_ref_tables := array_append(v_ref_tables, 'ofertas de subcontrato');
  end if;
  if exists (select 1 from public.movements where contact_id = old.id) then
    v_ref_tables := array_append(v_ref_tables, 'movimientos financieros');
  end if;
  if exists (select 1 from public.material_invoices where provider_id = old.id) then
    v_ref_tables := array_append(v_ref_tables, 'facturas de materiales');
  end if;
  if exists (select 1 from public.material_purchase_orders where provider_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'órdenes de compra');
  end if;
  if exists (select 1 from public.materials where default_provider_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'proveedor default de materiales');
  end if;
  if exists (select 1 from public.task_recipe_external_services where contact_id = old.id and is_deleted = false) then
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

### `set_task_material_organization()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_task_material_organization()
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

### `step_add_org_member(p_user_id uuid, p_org_id uuid, p_role_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_add_org_member(p_user_id uuid, p_org_id uuid, p_role_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.step_add_org_member(p_user_id, p_org_id, p_role_id);
$function$
```
</details>

### `step_assign_org_role_permissions(p_org_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_assign_org_role_permissions(p_org_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.step_assign_org_role_permissions(p_org_id);
$function$
```
</details>

### `step_create_organization_roles(p_org_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_organization_roles(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.step_create_organization_roles(p_org_id);
$function$
```
</details>
