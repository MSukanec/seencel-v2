# Database Schema (Auto-generated)
> Generated: 2026-02-22T20:08:16.861Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROJECTS] Functions (chunk 1: assert_project_is_active — documents_validate_project_org)

### `projects.assert_project_is_active(p_project_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION projects.assert_project_is_active(p_project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'projects', 'public'
AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM projects
        WHERE id = p_project_id
          AND status = 'active'
          AND is_deleted = false
    ) THEN
        RAISE EXCEPTION 'Project is not active. Mutations are blocked.'
            USING ERRCODE = 'P0001';
    END IF;
END;
$function$
```
</details>

### `projects.documents_validate_project_org()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION projects.documents_validate_project_org()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'projects', 'public'
AS $function$
declare
  proj_org uuid;
begin
  -- Validar que el proyecto pertenezca a la organización
  if new.project_id is not null then
    select p.organization_id
    into proj_org
    from public.projects p
    where p.id = new.project_id;

    if proj_org is null or proj_org <> new.organization_id then
      raise exception 'El proyecto no pertenece a la organización.';
    end if;
  end if;

  return new;
end;
$function$
```
</details>
