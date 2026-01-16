# Tablas de DB para SITELOGS:

# Tabla SITE_LOG_TYPES:

create table public.site_log_types (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  is_system boolean not null default false,
  created_at timestamp with time zone null default now(),
  organization_id uuid null,
  updated_at timestamp with time zone null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  updated_by uuid null,
  constraint site_log_types_pkey primary key (id),
  constraint site_log_types_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint site_log_types_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint site_log_types_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint site_log_types_system_consistency check (
    (
      (
        (is_system = true)
        and (organization_id is null)
      )
      or (
        (is_system = false)
        and (organization_id is not null)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists site_log_types_not_deleted_idx on public.site_log_types using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists site_log_types_org_not_deleted_idx on public.site_log_types using btree (organization_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists site_log_types_org_idx on public.site_log_types using btree (organization_id) TABLESPACE pg_default;

create unique INDEX IF not exists site_log_types_system_name_uniq on public.site_log_types using btree (lower(name)) TABLESPACE pg_default
where
  (
    (organization_id is null)
    and (is_deleted = false)
  );

create index IF not exists site_log_types_system_idx on public.site_log_types using btree (is_system) TABLESPACE pg_default;

create unique INDEX IF not exists site_log_types_org_name_uniq on public.site_log_types using btree (organization_id, lower(name)) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger on_site_log_types_audit
after INSERT
or DELETE
or
update on site_log_types for EACH row
execute FUNCTION log_site_log_types_activity ();

create trigger set_updated_by_site_log_types BEFORE INSERT
or
update on site_log_types for EACH row
execute FUNCTION handle_updated_by ();

create trigger update_site_log_types_timestamp BEFORE
update on site_log_types for EACH row
execute FUNCTION update_timestamp ();

# Tabla SITE_LOGS:

create table public.site_logs (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  created_by uuid null,
  log_date date not null,
  comments text null,
  created_at timestamp with time zone not null default now(),
  is_public boolean null default false,
  status public.site_log_status null default 'approved'::site_log_status,
  updated_at timestamp with time zone not null default now(),
  is_favorite boolean null default false,
  weather public.weather_enum null default 'none'::weather_enum,
  organization_id uuid not null,
  entry_type_id uuid null,
  severity public.site_log_severity null default 'low'::site_log_severity,
  ai_summary text null,
  ai_tags text[] null,
  ai_analyzed boolean not null default false,
  updated_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint site_logs_pkey primary key (id),
  constraint site_logs_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint site_logs_entry_type_id_fkey foreign KEY (entry_type_id) references site_log_types (id) on delete set null,
  constraint site_logs_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint site_logs_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint site_logs_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists site_logs_org_idx on public.site_logs using btree (organization_id) TABLESPACE pg_default;

create index IF not exists site_logs_project_idx on public.site_logs using btree (project_id) TABLESPACE pg_default;

create index IF not exists site_logs_created_by_idx on public.site_logs using btree (created_by) TABLESPACE pg_default;

create index IF not exists site_logs_date_idx on public.site_logs using btree (log_date desc) TABLESPACE pg_default;

create index IF not exists site_logs_status_idx on public.site_logs using btree (status) TABLESPACE pg_default;

create index IF not exists site_logs_org_project_date_idx on public.site_logs using btree (organization_id, project_id, log_date desc) TABLESPACE pg_default;

create index IF not exists site_logs_favorite_idx on public.site_logs using btree (is_favorite) TABLESPACE pg_default;

create index IF not exists site_logs_public_idx on public.site_logs using btree (is_public) TABLESPACE pg_default;

create index IF not exists site_logs_ai_analyzed_idx on public.site_logs using btree (ai_analyzed) TABLESPACE pg_default;

create index IF not exists site_logs_ai_full_idx on public.site_logs using btree (
  organization_id,
  project_id,
  ai_analyzed,
  log_date desc
) TABLESPACE pg_default;

create index IF not exists site_logs_not_deleted_pub_idx on public.site_logs using btree (is_public) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists site_logs_not_deleted_date_idx on public.site_logs using btree (organization_id, project_id, log_date desc) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger on_site_logs_audit
after INSERT
or DELETE
or
update on site_logs for EACH row
execute FUNCTION log_site_logs_activity ();

create trigger set_updated_by_site_logs BEFORE INSERT
or
update on site_logs for EACH row
execute FUNCTION handle_updated_by ();

create trigger update_site_logs_timestamp BEFORE
update on site_logs for EACH row
execute FUNCTION update_timestamp ();