# Database Schema (Auto-generated)
> Generated: 2026-02-21T14:12:15.483Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] Views (2)

### `planner.kanban_boards_view`

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
           FROM planner.kanban_lists
          WHERE (kanban_lists.board_id = b.id)) AS list_count,
    ( SELECT count(*) AS count
           FROM (planner.kanban_cards c
             JOIN planner.kanban_lists l ON ((l.id = c.list_id)))
          WHERE ((l.board_id = b.id) AND (c.is_archived = false))) AS card_count,
    ( SELECT count(*) AS count
           FROM (planner.kanban_cards c
             JOIN planner.kanban_lists l ON ((l.id = c.list_id)))
          WHERE ((l.board_id = b.id) AND (c.is_completed = true) AND (c.is_archived = false))) AS completed_card_count
   FROM (planner.kanban_boards b
     LEFT JOIN projects.projects p ON ((p.id = b.project_id)))
  WHERE (b.is_deleted = false);
```

### `planner.kanban_cards_view`

```sql
SELECT c.id,
    c.title,
    c.description,
    c.priority,
    c.due_date,
    c.start_date,
    c.is_completed,
    c.completed_at,
    c."position",
    c.cover_color,
    c.cover_image_url,
    c.estimated_hours,
    c.actual_hours,
    c.created_at,
    c.updated_at,
    c.list_id,
    c.board_id,
    l.name AS list_name,
    l."position" AS list_position,
    b.name AS board_name,
    b.organization_id,
    b.project_id,
    c.assigned_to,
    m.user_id AS assigned_to_user_id,
    ( SELECT count(*) AS count
           FROM planner.kanban_comments
          WHERE (kanban_comments.card_id = c.id)) AS comment_count,
    ( SELECT count(*) AS count
           FROM planner.kanban_attachments
          WHERE (kanban_attachments.card_id = c.id)) AS attachment_count,
    ( SELECT count(*) AS count
           FROM (planner.kanban_checklist_items ci
             JOIN planner.kanban_checklists ch ON ((ch.id = ci.checklist_id)))
          WHERE (ch.card_id = c.id)) AS total_checklist_items,
    ( SELECT count(*) AS count
           FROM (planner.kanban_checklist_items ci
             JOIN planner.kanban_checklists ch ON ((ch.id = ci.checklist_id)))
          WHERE ((ch.card_id = c.id) AND (ci.is_completed = true))) AS completed_checklist_items,
    ( SELECT array_agg(jsonb_build_object('id', lb.id, 'name', lb.name, 'color', lb.color)) AS array_agg
           FROM (planner.kanban_card_labels cl
             JOIN planner.kanban_labels lb ON ((lb.id = cl.label_id)))
          WHERE (cl.card_id = c.id)) AS labels
   FROM (((planner.kanban_cards c
     JOIN planner.kanban_lists l ON ((l.id = c.list_id)))
     JOIN planner.kanban_boards b ON ((b.id = c.board_id)))
     LEFT JOIN iam.organization_members m ON ((m.id = c.assigned_to)))
  WHERE (c.is_archived = false);
```
