# Tablas en DB para PLANNER:

# Tabla KANBAN_CARDS:

create table public.kanban_cards (
  id uuid not null default gen_random_uuid (),
  list_id uuid null,
  title text not null,
  description text null,
  due_date date null,
  position integer not null default 0,
  created_at timestamp with time zone null default now(),
  created_by uuid null,
  is_completed boolean null default false,
  completed_at timestamp with time zone null,
  assigned_to uuid null,
  updated_at timestamp with time zone null,
  priority text null default 'none'::text,
  estimated_hours numeric(5, 2) null,
  actual_hours numeric(5, 2) null,
  start_date date null,
  cover_image_url text null,
  cover_color text null,
  is_archived boolean null default false,
  archived_at timestamp with time zone null,
  board_id uuid null,
  updated_by uuid null,
  organization_id uuid not null,
  is_deleted boolean null default false,
  deleted_at timestamp with time zone null,
  project_id uuid null,
  constraint kanban_cards_pkey primary key (id),
  constraint kanban_cards_board_id_fkey foreign KEY (board_id) references kanban_boards (id) on delete CASCADE,
  constraint kanban_cards_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint kanban_cards_list_id_fkey foreign KEY (list_id) references kanban_lists (id) on delete CASCADE,
  constraint kanban_cards_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint kanban_cards_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint kanban_cards_assigned_to_fkey foreign KEY (assigned_to) references organization_members (id) on delete set null,
  constraint kanban_cards_project_id_fkey foreign KEY (project_id) references projects (id) on delete set null,
  constraint kanban_cards_priority_check check (
    (
      priority = any (
        array[
          'urgent'::text,
          'high'::text,
          'medium'::text,
          'low'::text,
          'none'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_kanban_cards_list on public.kanban_cards using btree (list_id) TABLESPACE pg_default;

create index IF not exists idx_kanban_cards_board on public.kanban_cards using btree (board_id) TABLESPACE pg_default;

create index IF not exists idx_kanban_cards_assigned on public.kanban_cards using btree (assigned_to) TABLESPACE pg_default;

create index IF not exists idx_kanban_cards_priority on public.kanban_cards using btree (priority) TABLESPACE pg_default
where
  (priority <> 'none'::text);

create index IF not exists idx_kanban_cards_due on public.kanban_cards using btree (due_date) TABLESPACE pg_default
where
  (due_date is not null);

create index IF not exists idx_kanban_cards_completed on public.kanban_cards using btree (is_completed) TABLESPACE pg_default;

create index IF not exists idx_kanban_cards_org on public.kanban_cards using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_kanban_cards_project on public.kanban_cards using btree (project_id) TABLESPACE pg_default
where
  (project_id is not null);

create trigger kanban_cards_auto_complete BEFORE
update on kanban_cards for EACH row when (old.list_id is distinct from new.list_id)
execute FUNCTION kanban_auto_complete_card ();

create trigger kanban_cards_set_board_id BEFORE INSERT on kanban_cards for EACH row
execute FUNCTION kanban_set_card_board_id ();

create trigger kanban_cards_set_updated_at BEFORE
update on kanban_cards for EACH row
execute FUNCTION set_timestamp ();

create trigger on_kanban_card_audit
after INSERT
or DELETE
or
update on kanban_cards for EACH row
execute FUNCTION log_kanban_child_activity ();

create trigger set_updated_by_kanban_cards BEFORE INSERT
or
update on kanban_cards for EACH row
execute FUNCTION handle_updated_by ();

create trigger trg_notify_kanban_card_assigned
after INSERT
or
update OF assigned_to on kanban_cards for EACH row
execute FUNCTION notify_kanban_card_assigned ();

# Vista KANBAN_CARDS_VIEW:

create view public.kanban_cards_view as
select
  c.id,
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
  l.name as list_name,
  l."position" as list_position,
  b.name as board_name,
  b.organization_id,
  b.project_id,
  c.assigned_to,
  m.user_id as assigned_to_user_id,
  (
    select
      count(*) as count
    from
      kanban_comments
    where
      kanban_comments.card_id = c.id
  ) as comment_count,
  (
    select
      count(*) as count
    from
      kanban_attachments
    where
      kanban_attachments.card_id = c.id
  ) as attachment_count,
  (
    select
      count(*) as count
    from
      kanban_checklist_items ci
      join kanban_checklists ch on ch.id = ci.checklist_id
    where
      ch.card_id = c.id
  ) as total_checklist_items,
  (
    select
      count(*) as count
    from
      kanban_checklist_items ci
      join kanban_checklists ch on ch.id = ci.checklist_id
    where
      ch.card_id = c.id
      and ci.is_completed = true
  ) as completed_checklist_items,
  (
    select
      array_agg(
        jsonb_build_object('id', lb.id, 'name', lb.name, 'color', lb.color)
      ) as array_agg
    from
      kanban_card_labels cl
      join kanban_labels lb on lb.id = cl.label_id
    where
      cl.card_id = c.id
  ) as labels
from
  kanban_cards c
  join kanban_lists l on l.id = c.list_id
  join kanban_boards b on b.id = c.board_id
  left join organization_members m on m.id = c.assigned_to
where
  c.is_archived = false;