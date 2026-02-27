# Database Schema (Auto-generated)
> Generated: 2026-02-26T22:25:46.213Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CATALOG] Functions (chunk 1: increment_recipe_usage — set_task_material_organization)

### `catalog.increment_recipe_usage()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION catalog.increment_recipe_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'catalog', 'public'
AS $function$
begin
    update task_recipes
    set 
        usage_count = usage_count + 1,
        updated_at = now()
    where id = new.recipe_id;
    
    return new;
end;
$function$
```
</details>

### `catalog.lock_org_task_on_update()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION catalog.lock_org_task_on_update()
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

### `catalog.recalculate_recipe_rating()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION catalog.recalculate_recipe_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'catalog', 'public'
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

### `catalog.refresh_labor_avg_prices()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION catalog.refresh_labor_avg_prices()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'catalog', 'public'
AS $function$
begin
  refresh materialized view catalog.labor_avg_prices;
end;
$function$
```
</details>

### `catalog.refresh_material_avg_prices()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION catalog.refresh_material_avg_prices()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'catalog', 'public'
AS $function$
begin
  refresh materialized view public.material_avg_prices;
end;
$function$
```
</details>

### `catalog.set_budget_task_organization()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION catalog.set_budget_task_organization()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'catalog', 'public'
AS $function$
begin
  select t.organization_id
  into new.organization_id
  from catalog.tasks t
  where t.id = new.task_id;

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

### `catalog.set_task_labor_organization()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION catalog.set_task_labor_organization()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'catalog', 'public'
AS $function$
BEGIN
    -- Si organization_id es null, heredarlo de la tarea padre
    IF NEW.organization_id IS NULL THEN
        SELECT organization_id INTO NEW.organization_id
        FROM catalog.tasks
        WHERE id = NEW.task_id;
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

### `catalog.set_task_material_organization()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION catalog.set_task_material_organization()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'catalog', 'public'
AS $function$
begin
  select t.organization_id
  into new.organization_id
  from catalog.tasks t
  where t.id = new.task_id;

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
