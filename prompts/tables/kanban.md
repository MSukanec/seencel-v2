# Tablas de DB relacionadas a KANBAN:

# Tabla de KANBAN_ATTACHMENTS:    

create table public.kanban_attachments (
  id uuid not null default gen_random_uuid (),
  card_id uuid null,
  file_url text not null,
  file_name text null,
  uploaded_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint kanban_attachments_pkey primary key (id),
  constraint kanban_attachments_card_id_fkey foreign KEY (card_id) references kanban_cards (id) on delete CASCADE,
  constraint kanban_attachments_uploaded_by_fkey1 foreign KEY (uploaded_by) references organization_members (id) on delete set null
) TABLESPACE pg_default;

# Tabla de KANBAN_BOARDS:   

create table public.kanban_boards (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  organization_id uuid null,
  created_at timestamp with time zone null default now(),
  project_id uuid null,
  created_by uuid null,
  updated_at timestamp with time zone null default now(),
  constraint kanban_boards_pkey primary key (id),
  constraint kanban_boards_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint kanban_boards_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint kanban_boards_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;

# Tabla de KANBAN_CARDS: 

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
  constraint kanban_cards_pkey primary key (id),
  constraint kanban_cards_assigned_to_fkey foreign KEY (assigned_to) references organization_members (id) on delete set null,
  constraint kanban_cards_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint kanban_cards_list_id_fkey foreign KEY (list_id) references kanban_lists (id) on delete CASCADE
) TABLESPACE pg_default;

# Tabla de KANBAN_COMMENTS: 

create table public.kanban_comments (
  id uuid not null default gen_random_uuid (),
  card_id uuid null,
  author_id uuid null,
  content text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null,
  constraint kanban_comments_pkey primary key (id),
  constraint kanban_comments_author_id_fkey1 foreign KEY (author_id) references organization_members (id) on delete set null,
  constraint kanban_comments_card_id_fkey foreign KEY (card_id) references kanban_cards (id) on delete CASCADE
) TABLESPACE pg_default;

# Tabla de KANBAN_LISTS: 

create table public.kanban_lists (
  id uuid not null default gen_random_uuid (),
  board_id uuid null,
  name text not null,
  position integer not null default 0,
  created_at timestamp with time zone null default now(),
  created_by uuid null,
  updated_at timestamp with time zone null default now(),
  constraint kanban_lists_pkey primary key (id),
  constraint kanban_lists_board_id_fkey foreign KEY (board_id) references kanban_boards (id) on delete CASCADE,
  constraint kanban_lists_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null
) TABLESPACE pg_default;

