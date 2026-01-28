# Tablas en DB para ACTIVIDAD:

# Tabla ORGANIZATION_ACTIVITY_LOGS:

create table public.organization_activity_logs (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  action text not null,
  target_table text not null,
  target_id uuid null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  member_id uuid null,
  constraint organization_activity_logs_pkey primary key (id),
  constraint organization_activity_logs_member_id_fkey foreign KEY (member_id) references organization_members (id) on delete set null,
  constraint organization_activity_logs_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_org_id on public.organization_activity_logs using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_target on public.organization_activity_logs using btree (target_table, target_id) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_created_at on public.organization_activity_logs using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_member_id on public.organization_activity_logs using btree (member_id) TABLESPACE pg_default;

# Vista ORGANIZATION_ACTIVITY_LOGS_VIEW:

create view public.organization_activity_logs_view as
select
  l.id,
  l.organization_id,
  l.member_id,
  m.user_id,
  l.action,
  l.target_table,
  l.target_id,
  l.metadata,
  l.created_at,
  u.full_name,
  u.avatar_url,
  u.email
from
  organization_activity_logs l
  left join organization_members m on l.member_id = m.id
  left join users u on m.user_id = u.id;