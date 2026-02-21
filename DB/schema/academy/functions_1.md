# Database Schema (Auto-generated)
> Generated: 2026-02-21T03:04:42.923Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [ACADEMY] Functions (chunk 1: fill_progress_user_id_from_auth — step_course_enrollment_annual)

### `academy.fill_progress_user_id_from_auth()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION academy.fill_progress_user_id_from_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'academy', 'public'
AS $function$
declare
  v_user_id uuid;
begin
  -- Si ya viene user_id, no tocar
  if new.user_id is not null then
    return new;
  end if;

  -- Resolver user_id desde auth.uid()
  select u.id
  into v_user_id
  from public.users u
  where u.auth_id = auth.uid()
  limit 1;

  -- Si no existe usuario asociado al auth.uid(), error
  if v_user_id is null then
    raise exception 'No existe users.id para el auth.uid() actual';
  end if;

  -- Completar user_id automáticamente
  new.user_id := v_user_id;

  return new;
end;
$function$
```
</details>

### `academy.step_course_enrollment_annual(p_user_id uuid, p_course_id uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION academy.step_course_enrollment_annual(p_user_id uuid, p_course_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'academy', 'billing', 'public'
AS $function$
BEGIN
  INSERT INTO public.course_enrollments (
    user_id,
    course_id,
    status,
    expires_at
  )
  VALUES (
    p_user_id,
    p_course_id,
    'active',
    now() + interval '1 year'
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE
  SET
    status = 'active',
    expires_at = excluded.expires_at,
    updated_at = now();
END;
$function$
```
</details>
