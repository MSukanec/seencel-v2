# Database Schema (Auto-generated)
> Generated: 2026-02-22T20:08:16.861Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Functions (chunk 3: tick_home_checklist — users_normalize_email)

### `iam.tick_home_checklist(p_key text, p_value boolean)` 🔐

- **Returns**: boolean
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.tick_home_checklist(p_key text, p_value boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
declare
  v_user_id uuid;
begin
  v_user_id := iam.current_user_id();
  if v_user_id is null then return false; end if;

  update iam.user_preferences up
  set
    home_checklist = jsonb_set(
      coalesce(up.home_checklist, '{}'::jsonb), array[p_key], to_jsonb(p_value), true
    ),
    updated_at = now()
  where up.user_id = v_user_id;

  return found;
end;
$function$
```
</details>

### `iam.update_contact_category_links_updated_at()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.update_contact_category_links_updated_at()
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

### `iam.users_normalize_email()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.users_normalize_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
begin
  if new.email is not null then
    new.email := lower(new.email);
  end if;

  return new;
end;
$function$
```
</details>
