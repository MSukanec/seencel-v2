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

## 🗄️ TABLAS PRINCIPALES

### 1. kanban_boards (Tableros)

```sql
CREATE TABLE public.kanban_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE, -- NULL = Board de org
  created_by uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Nuevos campos V2
  is_template boolean DEFAULT false,
  template_id uuid REFERENCES kanban_boards(id) ON DELETE SET NULL,
  default_list_id uuid,
  is_archived boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  color text,
  icon text,
  settings jsonb DEFAULT '{}',
  
  -- Auditoría
  updated_by uuid REFERENCES organization_members(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_kanban_boards_org ON kanban_boards(organization_id);
CREATE INDEX idx_kanban_boards_project ON kanban_boards(project_id);
CREATE INDEX idx_kanban_boards_org_project ON kanban_boards(organization_id, project_id);
CREATE INDEX idx_kanban_boards_template ON kanban_boards(is_template) WHERE is_template = true;
CREATE INDEX idx_kanban_boards_active ON kanban_boards(organization_id, is_deleted, is_archived) 
  WHERE is_deleted = false AND is_archived = false;
```

**Límites por Plan**:
- Free: 1 board por organización + 1 por proyecto
- Pro: Ilimitados

---

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
