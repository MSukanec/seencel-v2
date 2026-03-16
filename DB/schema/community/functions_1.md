# Database Schema (Auto-generated)
> Generated: 2026-03-15T18:32:16.410Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [COMMUNITY] Functions (chunk 1: update_forum_thread_activity — update_forum_thread_activity)

### `community.update_forum_thread_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION community.update_forum_thread_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'community', 'public'
AS $function$
begin
  if tg_op = 'INSERT' then
    update community.forum_threads
    set
      last_activity_at = now(),
      reply_count = reply_count + 1
    where id = new.thread_id;

  elsif tg_op = 'DELETE' then
    update community.forum_threads
    set
      reply_count = greatest(reply_count - 1, 0)
    where id = old.thread_id;
  end if;

  return null;
end;
$function$
```
</details>
