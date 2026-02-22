# Database Schema (Auto-generated)
> Generated: 2026-02-22T15:06:00.294Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] Functions (chunk 1: kanban_auto_complete_card — kanban_set_card_board_id)

### `planner.kanban_auto_complete_card()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION planner.kanban_auto_complete_card()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  list_auto_complete boolean;
BEGIN
  SELECT auto_complete INTO list_auto_complete
  FROM planner.kanban_lists
  WHERE id = NEW.list_id;
  
  IF list_auto_complete = true AND NEW.is_completed = false THEN
    NEW.is_completed := true;
    NEW.completed_at := now();
  END IF;
  
  RETURN NEW;
END;
$function$
```
</details>

### `planner.kanban_set_card_board_id()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION planner.kanban_set_card_board_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.board_id IS NULL AND NEW.list_id IS NOT NULL THEN
    SELECT board_id INTO NEW.board_id
    FROM planner.kanban_lists
    WHERE id = NEW.list_id;
  END IF;
  RETURN NEW;
END;
$function$
```
</details>
