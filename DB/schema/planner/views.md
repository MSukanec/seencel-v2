# Database Schema (Auto-generated)
> Generated: 2026-02-26T15:52:15.290Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] Views (2)

### `planner.boards_view` (🔓 INVOKER)

```sql
SELECT b.id,
    b.name,
    b.description,
    b.color,
    b.icon,
    b.organization_id,
    b.project_id,
    b.is_template,
    b.is_archived,
    b.created_at,
    b.updated_at,
    b.created_by,
    p.name AS project_name,
    ( SELECT count(*) AS count
           FROM planner.lists
          WHERE ((lists.board_id = b.id) AND (lists.is_deleted = false))) AS list_count,
    ( SELECT count(*) AS count
           FROM planner.items
          WHERE ((items.board_id = b.id) AND (items.is_deleted = false) AND (items.is_archived = false))) AS item_count,
    ( SELECT count(*) AS count
           FROM planner.items
          WHERE ((items.board_id = b.id) AND (items.is_completed = true) AND (items.is_deleted = false) AND (items.is_archived = false))) AS completed_item_count
   FROM (planner.boards b
     LEFT JOIN projects.projects p ON ((p.id = b.project_id)))
  WHERE (b.is_deleted = false);
```

### `planner.items_view` (🔓 INVOKER)

```sql
SELECT i.id,
    i.title,
    i.description,
    i.item_type,
    i.color,
    i.priority,
    i.status,
    i.start_at,
    i.due_at,
    i.end_at,
    i.is_all_day,
    i.is_completed,
    i.completed_at,
    i."position",
    i.cover_color,
    i.cover_image_url,
    i.estimated_hours,
    i.actual_hours,
    i.location,
    i.recurrence_rule,
    i.source_type,
    i.source_id,
    i.created_at,
    i.updated_at,
    i.list_id,
    i.board_id,
    i.organization_id,
    i.project_id,
    i.assigned_to,
    i.is_archived,
    l.name AS list_name,
    l."position" AS list_position,
    brd.name AS board_name,
    m.user_id AS assigned_to_user_id,
    ( SELECT count(*) AS count
           FROM planner.comments
          WHERE (comments.item_id = i.id)) AS comment_count,
    ( SELECT count(*) AS count
           FROM planner.attachments
          WHERE (attachments.item_id = i.id)) AS attachment_count,
    ( SELECT count(*) AS count
           FROM (planner.checklist_items ci
             JOIN planner.checklists ch ON ((ch.id = ci.checklist_id)))
          WHERE (ch.item_id = i.id)) AS total_checklist_items,
    ( SELECT count(*) AS count
           FROM (planner.checklist_items ci
             JOIN planner.checklists ch ON ((ch.id = ci.checklist_id)))
          WHERE ((ch.item_id = i.id) AND (ci.is_completed = true))) AS completed_checklist_items,
    ( SELECT array_agg(jsonb_build_object('id', lb.id, 'name', lb.name, 'color', lb.color)) AS array_agg
           FROM (planner.item_labels il
             JOIN planner.labels lb ON ((lb.id = il.label_id)))
          WHERE (il.item_id = i.id)) AS labels
   FROM (((planner.items i
     LEFT JOIN planner.lists l ON ((l.id = i.list_id)))
     LEFT JOIN planner.boards brd ON ((brd.id = i.board_id)))
     LEFT JOIN iam.organization_members m ON ((m.id = i.assigned_to)))
  WHERE ((i.is_deleted = false) AND (i.is_archived = false));
```
