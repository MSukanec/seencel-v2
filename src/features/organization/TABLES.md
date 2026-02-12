# Tablas en DB para ORGANIZATIONS:

# Vista ADMIN_ORGANIZATIONS_VIEW:

create view public.admin_organizations_view as
select
  o.id,
  o.name,
  o.logo_path,
  o.created_at,
  o.updated_at,
  o.is_active,
  o.is_deleted,
  o.is_demo,
  o.settings,
  o.purchased_seats,
  ow.full_name as owner_name,
  ow.email as owner_email,
  pl.name as plan_name,
  pl.slug as plan_slug,
  COALESCE(mc.member_count, 0) as member_count,
  COALESCE(pc.project_count, 0) as project_count,
  al.last_activity_at
from
  organizations o
  left join users ow on ow.id = o.owner_id
  left join plans pl on pl.id = o.plan_id
  left join lateral (
    select
      count(*)::integer as member_count
    from
      organization_members om
    where
      om.organization_id = o.id
      and om.is_active = true
  ) mc on true
  left join lateral (
    select
      count(*)::integer as project_count
    from
      projects p
    where
      p.organization_id = o.id
      and p.is_deleted = false
  ) pc on true
  left join lateral (
    select
      max(oal.created_at) as last_activity_at
    from
      organization_activity_logs oal
    where
      oal.organization_id = o.id
  ) al on true
where
  o.is_deleted = false;

# Tabla ORGANIZATIONS:

create table public.organizations (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  created_by uuid null,
  is_active boolean not null default true,
  updated_at timestamp with time zone not null default now(),
  plan_id uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  owner_id uuid null,
  settings jsonb null default '{}'::jsonb,
  is_demo boolean not null default false,
  logo_path text null,
  updated_by uuid null,
  purchased_seats integer null default 0,
  constraint organizations_pkey primary key (id),
  constraint organizations_id_key unique (id),
  constraint organizations_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint organizations_owner_fkey foreign KEY (owner_id) references users (id) on delete set null,
  constraint organizations_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete set null,
  constraint organizations_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_organizations_updated_at on public.organizations using btree (updated_at) TABLESPACE pg_default;

create index IF not exists idx_organizations_active_not_deleted on public.organizations using btree (is_active, is_deleted) TABLESPACE pg_default;

create index IF not exists idx_organizations_plan on public.organizations using btree (plan_id) TABLESPACE pg_default;

create trigger on_organizations_audit
after INSERT
or DELETE
or
update on organizations for EACH row
execute FUNCTION log_organizations_activity ();

create trigger organizations_set_updated_at BEFORE
update on organizations for EACH row when (old.updated_at is distinct from new.updated_at)
execute FUNCTION update_updated_at_column ();

create trigger set_updated_by_organizations BEFORE
update on organizations for EACH row
execute FUNCTION handle_updated_by_organizations ();