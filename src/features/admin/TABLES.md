# Tablas en DB para ADMINISTRACION DE SISTEMA (NO TOCAR)

# Tabla FEATURE_FLAG_CATEGORIES:

create table public.feature_flag_categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  position integer null default 0,
  parent_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint feature_flag_categories_pkey primary key (id),
  constraint feature_flag_categories_parent_id_fkey foreign KEY (parent_id) references feature_flag_categories (id) on delete set null
) TABLESPACE pg_default;

# Tabla FEATURE_FLAGS:

create table public.feature_flags (
  id uuid not null default gen_random_uuid (),
  key character varying(100) not null,
  value boolean not null default true,
  description text null,
  category character varying(50) null default 'general'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  parent_id uuid null,
  position integer null default 0,
  status character varying(20) null default 'active'::character varying,
  flag_type text null default 'feature'::text,
  category_id uuid null,
  constraint feature_flags_pkey primary key (id),
  constraint feature_flags_key_key unique (key),
  constraint feature_flags_category_id_fkey foreign KEY (category_id) references feature_flag_categories (id) on delete set null,
  constraint feature_flags_parent_id_fkey foreign KEY (parent_id) references feature_flags (id) on delete set null,
  constraint feature_flags_flag_type_check check (
    (
      flag_type = any (array['system'::text, 'feature'::text])
    )
  ),
  constraint feature_flags_status_check check (
    (
      (status)::text = any (
        (
          array[
            'active'::character varying,
            'maintenance'::character varying,
            'hidden'::character varying,
            'founders'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_feature_flags_parent_id on public.feature_flags using btree (parent_id) TABLESPACE pg_default;