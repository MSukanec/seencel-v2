# Database Schema (Auto-generated)
> Generated: 2026-02-22T20:08:16.861Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [DESIGN] Functions (chunk 1: generate_next_document_group_name — generate_next_document_group_name)

### `design.generate_next_document_group_name(p_folder_id uuid)` 🔐

- **Returns**: text
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION design.generate_next_document_group_name(p_folder_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'design', 'public'
AS $function$
declare
  latest_name text;
  latest_version int := 0;
  next_name text;
begin
  select d.name
  into latest_name
  from design.design_document_groups d
  where d.folder_id = p_folder_id
    and d.name ~ '^v[0-9]+$'
  order by cast(substring(d.name from 2) as int) desc
  limit 1;

  if latest_name is not null then
    latest_version := cast(substring(latest_name from 2) as int);
  end if;

  next_name := 'v' || (latest_version + 1);
  return next_name;
end;
$function$
```
</details>
