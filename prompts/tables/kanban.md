# Tablas de DB relacionadas a KANBAN (Enterprise V2)

> **Última actualización**: 2026-01-11
> **Script de migración**: `kanban-migration.sql`

---

## 📐 Arquitectura

```
Organization
├── kanban_labels (Etiquetas globales)
├── kanban_boards (project_id = NULL → Board de org)
│   └── project_id NOT NULL → Board de proyecto
│
Board
├── kanban_lists (Columnas)
├── kanban_board_permissions (Permisos granulares)
│
List
└── kanban_cards (Tarjetas)
    ├── kanban_card_labels (M:N)
    ├── kanban_card_assignees (M:N)
    ├── kanban_card_watchers (Notificaciones)
    ├── kanban_checklists
    │   └── kanban_checklist_items
    ├── kanban_comments
    │   └── kanban_mentions (@menciones)
    └── kanban_attachments
```

---

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

### 2. kanban_lists (Columnas)

```sql
CREATE TABLE public.kanban_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Nuevos campos V2
  color text,
  limit_wip integer, -- Work In Progress limit
  auto_complete boolean DEFAULT false, -- Marca cards como completadas al entrar
  is_collapsed boolean DEFAULT false,
  
  -- Auditoría
  updated_by uuid REFERENCES organization_members(id) ON DELETE SET NULL
);

-- Índice
CREATE INDEX idx_kanban_lists_board ON kanban_lists(board_id);
```

---

### 3. kanban_cards (Tarjetas)

```sql
CREATE TABLE public.kanban_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES kanban_lists(id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE, -- Redundante pero útil
  title text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  
  -- Fechas
  due_date date,
  start_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  
  -- Estado
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  is_archived boolean DEFAULT false,
  archived_at timestamptz,
  
  -- Prioridad
  priority text DEFAULT 'none' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'none')),
  
  -- Tiempo
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2),
  
  -- Visual
  cover_image_url text,
  cover_color text,
  
  -- Asignación (legacy, usar kanban_card_assignees)
  assigned_to uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  
  -- Auditoría
  created_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES organization_members(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_kanban_cards_list ON kanban_cards(list_id);
CREATE INDEX idx_kanban_cards_board ON kanban_cards(board_id);
CREATE INDEX idx_kanban_cards_assigned ON kanban_cards(assigned_to);
CREATE INDEX idx_kanban_cards_priority ON kanban_cards(priority) WHERE priority != 'none';
CREATE INDEX idx_kanban_cards_due ON kanban_cards(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_kanban_cards_completed ON kanban_cards(is_completed);
```

---

### 4. kanban_labels (Etiquetas)

```sql
CREATE TABLE public.kanban_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  description text,
  position integer DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  
  CONSTRAINT kanban_labels_name_org_unique UNIQUE (organization_id, name)
);

CREATE INDEX idx_kanban_labels_org ON kanban_labels(organization_id);
```

---

### 5. kanban_card_labels (Cards ↔ Labels M:N)

```sql
CREATE TABLE public.kanban_card_labels (
  card_id uuid NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES kanban_labels(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  
  PRIMARY KEY (card_id, label_id)
);

CREATE INDEX idx_kanban_card_labels_card ON kanban_card_labels(card_id);
CREATE INDEX idx_kanban_card_labels_label ON kanban_card_labels(label_id);
```

---

### 6. kanban_card_assignees (Multi-asignados)

```sql
CREATE TABLE public.kanban_card_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  
  CONSTRAINT kanban_card_assignees_unique UNIQUE (card_id, member_id)
);

CREATE INDEX idx_kanban_card_assignees_card ON kanban_card_assignees(card_id);
CREATE INDEX idx_kanban_card_assignees_member ON kanban_card_assignees(member_id);
```

---

### 7. kanban_checklists (Listas de tareas)

```sql
CREATE TABLE public.kanban_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Checklist',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES organization_members(id) ON DELETE SET NULL
);

CREATE INDEX idx_kanban_checklists_card ON kanban_checklists(card_id);
```

---

### 8. kanban_checklist_items (Items del checklist)

```sql
CREATE TABLE public.kanban_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES kanban_checklists(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  position integer DEFAULT 0,
  due_date date,
  assigned_to uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES organization_members(id) ON DELETE SET NULL
);

CREATE INDEX idx_kanban_checklist_items_checklist ON kanban_checklist_items(checklist_id);
CREATE INDEX idx_kanban_checklist_items_incomplete ON kanban_checklist_items(checklist_id) 
  WHERE is_completed = false;
```

---

### 9. kanban_comments (Comentarios)

```sql
CREATE TABLE public.kanban_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  author_id uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  updated_by uuid REFERENCES organization_members(id) ON DELETE SET NULL
);

CREATE INDEX idx_kanban_comments_card ON kanban_comments(card_id);
```

---

### 10. kanban_mentions (@menciones)

```sql
CREATE TABLE public.kanban_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES kanban_comments(id) ON DELETE CASCADE,
  mentioned_member_id uuid NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_kanban_mentions_comment ON kanban_mentions(comment_id);
CREATE INDEX idx_kanban_mentions_member ON kanban_mentions(mentioned_member_id);
CREATE INDEX idx_kanban_mentions_unread ON kanban_mentions(mentioned_member_id, is_read) 
  WHERE is_read = false;
```

---

### 11. kanban_attachments (Archivos adjuntos)

```sql
CREATE TABLE public.kanban_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text,
  file_size integer,
  file_type text,
  uploaded_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES organization_members(id) ON DELETE SET NULL
);

CREATE INDEX idx_kanban_attachments_card ON kanban_attachments(card_id);
```

---

### 12. kanban_card_watchers (Observadores para notificaciones)

```sql
CREATE TABLE public.kanban_card_watchers (
  card_id uuid NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (card_id, member_id)
);

CREATE INDEX idx_kanban_card_watchers_member ON kanban_card_watchers(member_id);
```

---

### 13. kanban_board_permissions (Permisos granulares)

```sql
CREATE TABLE public.kanban_board_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  member_id uuid REFERENCES organization_members(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_level text NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  
  CONSTRAINT kanban_board_permissions_target CHECK (
    (member_id IS NOT NULL AND role_id IS NULL) OR
    (member_id IS NULL AND role_id IS NOT NULL)
  )
);

CREATE INDEX idx_kanban_board_permissions_board ON kanban_board_permissions(board_id);
CREATE INDEX idx_kanban_board_permissions_member ON kanban_board_permissions(member_id);
```

**Niveles de permiso**:
- `view`: Solo puede ver el board y sus cards
- `edit`: Puede crear, editar, mover cards
- `admin`: Puede modificar el board, listas, permisos

---

### 14. kanban_activity_log (Historial de actividad)

```sql
CREATE TABLE public.kanban_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  board_id uuid REFERENCES kanban_boards(id) ON DELETE CASCADE,
  card_id uuid REFERENCES kanban_cards(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_kanban_activity_org ON kanban_activity_log(organization_id);
CREATE INDEX idx_kanban_activity_board ON kanban_activity_log(board_id);
CREATE INDEX idx_kanban_activity_card ON kanban_activity_log(card_id);
CREATE INDEX idx_kanban_activity_created ON kanban_activity_log(created_at DESC);
```

**Action Types**:
- `card_created`, `card_updated`, `card_moved`, `card_archived`, `card_deleted`
- `list_created`, `list_updated`, `list_deleted`
- `comment_added`, `comment_updated`, `comment_deleted`
- `label_added`, `label_removed`
- `assignee_added`, `assignee_removed`
- `checklist_item_completed`, `checklist_item_uncompleted`

---

## 🔄 TRIGGERS AUTOMÁTICOS

1. **`kanban_set_updated_at`**: Actualiza `updated_at` automáticamente en todas las tablas
2. **`kanban_log_card_move`**: Registra en activity_log cuando se mueve una card
3. **`kanban_auto_complete_card`**: Marca card como completada al mover a lista con `auto_complete = true`
4. **`kanban_set_card_board_id`**: Pobla `board_id` automáticamente al crear card

---

## 👁️ VIEWS

### kanban_cards_view
Vista completa de cards con todos sus datos relacionados (labels, assignees, conteos).

### kanban_boards_view
Vista de boards con conteos de listas y cards.

---

## 📁 Archivos Relacionados

- **Migración SQL**: `prompts/tables/kanban-migration.sql`
- **Roadmap**: `.agent/workflows/kanban-roadmap.md`

# Tabla CALENDAR_EVENTS:

create table public.calendar_events (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  project_id uuid null,
  title text not null,
  description text null,
  location text null,
  color text null,
  start_at timestamp with time zone not null,
  end_at timestamp with time zone null,
  is_all_day boolean not null default false,
  timezone text null default 'America/Argentina/Buenos_Aires'::text,
  source_type text null,
  source_id uuid null,
  recurrence_rule text null,
  recurrence_end_at timestamp with time zone null,
  parent_event_id uuid null,
  status text not null default 'scheduled'::text,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone null,
  constraint calendar_events_pkey primary key (id),
  constraint calendar_events_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint calendar_events_parent_event_id_fkey foreign KEY (parent_event_id) references calendar_events (id) on delete CASCADE,
  constraint calendar_events_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint calendar_events_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint calendar_events_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint valid_recurrence check (
    (
      (
        (recurrence_rule is null)
        and (parent_event_id is null)
      )
      or (recurrence_rule is not null)
      or (parent_event_id is not null)
    )
  ),
  constraint valid_source check (
    (
      (
        (source_type is null)
        and (source_id is null)
      )
      or (
        (source_type is not null)
        and (source_id is not null)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_calendar_events_org_id on public.calendar_events using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_calendar_events_project_id on public.calendar_events using btree (project_id) TABLESPACE pg_default
where
  (project_id is not null);

create index IF not exists idx_calendar_events_start_at on public.calendar_events using btree (start_at) TABLESPACE pg_default;

create index IF not exists idx_calendar_events_source on public.calendar_events using btree (source_type, source_id) TABLESPACE pg_default
where
  (source_type is not null);

create index IF not exists idx_calendar_events_status on public.calendar_events using btree (status) TABLESPACE pg_default
where
  (deleted_at is null);

create trigger on_calendar_event_audit
after INSERT
or DELETE
or
update on calendar_events for EACH row
execute FUNCTION log_calendar_event_activity ();

create trigger set_updated_by_calendar_events BEFORE INSERT
or
update on calendar_events for EACH row
execute FUNCTION handle_updated_by ();
