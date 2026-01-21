# Tablas y vistas en DB para FOROS:

# Tabla FORUM_CATEGORIES:

create table public.forum_categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  description text null,
  icon text null,
  color text null default '#000000'::text,
  sort_order integer null default 0,
  allowed_roles text[] null default array['public'::text],
  is_read_only boolean null default false,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  course_id uuid null,
  constraint forum_categories_pkey primary key (id),
  constraint forum_categories_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_forum_categories_course on public.forum_categories using btree (course_id) TABLESPACE pg_default
where
  (course_id is not null);

create unique INDEX IF not exists forum_categories_slug_unique on public.forum_categories using btree (
  slug,
  COALESCE(
    course_id,
    '00000000-0000-0000-0000-000000000000'::uuid
  )
) TABLESPACE pg_default;

# Tabla FORUM_POSTS:

create table public.forum_posts (
  id uuid not null default gen_random_uuid (),
  thread_id uuid not null,
  organization_id uuid not null,
  author_id uuid not null,
  parent_id uuid null,
  content jsonb not null,
  is_accepted_answer boolean null default false,
  is_deleted boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint forum_posts_pkey primary key (id),
  constraint forum_posts_author_id_fkey foreign KEY (author_id) references users (id) on delete CASCADE,
  constraint forum_posts_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint forum_posts_parent_id_fkey foreign KEY (parent_id) references forum_posts (id) on delete set null,
  constraint forum_posts_thread_id_fkey foreign KEY (thread_id) references forum_threads (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_forum_posts_thread on public.forum_posts using btree (thread_id) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger trg_update_thread_activity
after INSERT
or DELETE on forum_posts for EACH row
execute FUNCTION update_forum_thread_activity ();

# Tabla FORUM_REACTIONS:    

create table public.forum_reactions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  item_type text not null,
  item_id uuid not null,
  reaction_type text not null default 'like'::text,
  created_at timestamp with time zone null default now(),
  constraint forum_reactions_pkey primary key (id),
  constraint forum_reactions_user_id_item_type_item_id_key unique (user_id, item_type, item_id),
  constraint forum_reactions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint forum_reactions_item_type_check check (
    (
      item_type = any (array['thread'::text, 'post'::text])
    )
  )
) TABLESPACE pg_default;

# Tabla FORUM_REACTIONS:    

create table public.forum_threads (
  id uuid not null default gen_random_uuid (),
  category_id uuid not null,
  organization_id uuid not null,
  author_id uuid not null,
  title text not null,
  slug text not null,
  content jsonb not null,
  view_count integer null default 0,
  reply_count integer null default 0,
  last_activity_at timestamp with time zone null default now(),
  is_pinned boolean null default false,
  is_locked boolean null default false,
  is_deleted boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint forum_threads_pkey primary key (id),
  constraint forum_threads_slug_key unique (slug),
  constraint forum_threads_author_id_fkey foreign KEY (author_id) references users (id) on delete set null,
  constraint forum_threads_category_id_fkey foreign KEY (category_id) references forum_categories (id) on delete RESTRICT,
  constraint forum_threads_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_forum_threads_category on public.forum_threads using btree (category_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_forum_last_activity on public.forum_threads using btree (last_activity_at desc) TABLESPACE pg_default;

