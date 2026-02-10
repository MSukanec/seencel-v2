# Tablas en DB para EQUIPO:

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
  u.email,
  r.name as role_name
from
  organization_activity_logs l
  join organization_members m on l.member_id = m.id
  join users u on m.user_id = u.id
  left join roles r on m.role_id = r.id
where
  l.member_id is not null;

# Tabla ORGANIZATION_INVITATIONS:

create table public.organization_invitations (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  email text not null,
  status text null default 'pending'::text,
  token text null,
  created_at timestamp with time zone null default now(),
  accepted_at timestamp with time zone null,
  role_id uuid null,
  invited_by uuid null,
  updated_at timestamp with time zone null default now(),
  user_id uuid null,
  expires_at timestamp with time zone null default (now() + '7 days'::interval),
  constraint organization_invitations_pkey primary key (id),
  constraint organization_invitations_invited_by_fkey foreign KEY (invited_by) references organization_members (id) on delete set null,
  constraint organization_invitations_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_invitations_role_id_fkey foreign KEY (role_id) references roles (id) on delete set null,
  constraint organization_invitations_user_id_fkey foreign KEY (user_id) references users (id) on delete set null,
  constraint valid_invitation_status check (
    (
      status = any (
        array[
          'pending'::text,
          'registered'::text,
          'accepted'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists organization_invitations_email_idx on public.organization_invitations using btree (email) TABLESPACE pg_default;

create index IF not exists organization_invitations_organization_id_idx on public.organization_invitations using btree (organization_id) TABLESPACE pg_default;

create unique INDEX IF not exists organization_invitations_email_org_unique on public.organization_invitations using btree (email, organization_id) TABLESPACE pg_default
where
  (status = 'pending'::text);

create trigger trigger_create_contact_on_registered_invitation
after INSERT on organization_invitations for EACH row
execute FUNCTION handle_registered_invitation ();

# Tabla ORGANIZATION_MEMBER_EVENTS:

create table public.organization_member_events (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  subscription_id uuid null,
  member_id uuid not null,
  user_id uuid null,
  event_type text not null,
  was_billable boolean null,
  is_billable boolean null,
  event_date timestamp with time zone not null default now(),
  performed_by uuid null,
  created_at timestamp with time zone null default now(),
  constraint organization_member_events_pkey primary key (id),
  constraint organization_member_events_member_id_fkey foreign KEY (member_id) references organization_members (id) on delete CASCADE,
  constraint organization_member_events_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_member_events_performed_by_fkey foreign KEY (performed_by) references users (id) on delete set null,
  constraint organization_member_events_subscription_id_fkey foreign KEY (subscription_id) references organization_subscriptions (id) on delete set null,
  constraint organization_member_events_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_member_events_org on public.organization_member_events using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_member_events_subscription on public.organization_member_events using btree (subscription_id) TABLESPACE pg_default;

create index IF not exists idx_member_events_member on public.organization_member_events using btree (member_id) TABLESPACE pg_default;

create index IF not exists idx_member_events_date on public.organization_member_events using btree (event_date) TABLESPACE pg_default;

create index IF not exists idx_member_events_type on public.organization_member_events using btree (event_type) TABLESPACE pg_default;

# Tabla ORGANIZATION_MEMBERS:

create table public.organization_members (
  created_at timestamp with time zone not null default now(),
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  is_active boolean not null default true,
  organization_id uuid not null,
  invited_by uuid null,
  joined_at timestamp with time zone null default now(),
  role_id uuid null,
  last_active_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  is_billable boolean not null default true,
  is_over_limit boolean null default false,
  constraint organization_members_pkey primary key (id),
  constraint organization_members_idd_key unique (id),
  constraint organization_members_invited_by_fkey foreign KEY (invited_by) references organization_members (id) on delete set null,
  constraint organization_members_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_members_role_id_fkey foreign KEY (role_id) references roles (id) on delete set null,
  constraint organization_members_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists organization_members_organization_id_idx on public.organization_members using btree (organization_id) TABLESPACE pg_default;

create index IF not exists organization_members_user_id_idx on public.organization_members using btree (user_id) TABLESPACE pg_default;

create unique INDEX IF not exists unique_user_per_organization on public.organization_members using btree (user_id, organization_id) TABLESPACE pg_default;

create index IF not exists idx_org_members_org_user on public.organization_members using btree (organization_id, user_id) TABLESPACE pg_default;

create index IF not exists org_members_over_limit_idx on public.organization_members using btree (organization_id, is_over_limit) TABLESPACE pg_default;

create trigger log_member_billable_changes
after INSERT
or DELETE
or
update on organization_members for EACH row
execute FUNCTION log_member_billable_change ();

create trigger set_updated_at BEFORE
update on organization_members for EACH row
execute FUNCTION update_updated_at_column ();

create trigger set_updated_by_organization_members BEFORE INSERT
or
update on organization_members for EACH row
execute FUNCTION handle_updated_by ();

create trigger trigger_create_contact_on_new_member
after INSERT on organization_members for EACH row
execute FUNCTION handle_new_org_member_contact ();

# Vista ORGANIZATION_MEMBERS_FULL_VIEW:

create view public.organization_members_full_view as
select
  om.id,
  om.user_id,
  om.organization_id,
  om.role_id,
  om.is_active,
  om.is_billable,
  om.is_over_limit,
  om.joined_at,
  om.last_active_at,
  om.invited_by,
  om.created_at,
  om.updated_at,
  u.full_name as user_full_name,
  u.email as user_email,
  u.avatar_url as user_avatar_url,
  r.id as role_id_ref,
  r.name as role_name,
  r.type as role_type
from
  organization_members om
  left join users u on om.user_id = u.id
  left join roles r on om.role_id = r.id;

# Tabla ORGANIZATIONS:

create table public.organizations (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  created_by uuid null,
  is_active boolean not null default true,
  updated_at timestamp with time zone not null default now(),
  plan_id uuid null,
  is_system boolean null default false,
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

# Tabla PERMISSIONS:

create table public.permissions (
  id uuid not null default gen_random_uuid (),
  key text not null,
  description text not null,
  category text not null,
  is_system boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint permissions_pkey primary key (id),
  constraint permissions_key_key unique (key)
) TABLESPACE pg_default;

# Tabla ROLE_PERMISSIONS:

create table public.role_permissions (
  id uuid not null default gen_random_uuid (),
  role_id uuid not null,
  permission_id uuid not null,
  created_at timestamp with time zone not null default now(),
  organization_id uuid not null,
  constraint role_permissions_pkey primary key (id),
  constraint role_permissions_role_id_permission_id_key unique (role_id, permission_id),
  constraint role_permissions_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint role_permissions_permission_id_fkey foreign KEY (permission_id) references permissions (id) on delete CASCADE,
  constraint role_permissions_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_role_id on public.role_permissions using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_permission_id on public.role_permissions using btree (permission_id) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_organization_id on public.role_permissions using btree (organization_id) TABLESPACE pg_default;

create trigger trg_role_permissions_sync_org BEFORE INSERT on role_permissions for EACH row
execute FUNCTION sync_role_permission_org_id ();

# Tabla ROLES:

create table public.roles (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  type text null,
  organization_id uuid null,
  is_system boolean not null default false,
  constraint roles_pkey primary key (id),
  constraint roles_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create unique INDEX IF not exists roles_unique_name_per_org on public.roles using btree (organization_id, name) TABLESPACE pg_default
where
  (is_system = false);

create index IF not exists idx_roles_organization_id on public.roles using btree (organization_id) TABLESPACE pg_default;

# Tabla USERS:

create table public.users (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  auth_id uuid not null,
  email text not null,
  avatar_url text null,
  avatar_source public.avatar_source_t null default 'email'::avatar_source_t,
  full_name text null,
  role_id uuid not null default 'e6cc68d2-fc28-421b-8bd3-303326ef91b8'::uuid,
  updated_at timestamp with time zone null default now(),
  is_active boolean not null default true,
  signup_completed boolean not null default false,
  constraint users_pkey primary key (id),
  constraint users_auth_id_key unique (auth_id),
  constraint users_id_key unique (id),
  constraint users_auth_id_fkey foreign KEY (auth_id) references auth.users (id) on delete CASCADE,
  constraint users_role_id_fkey foreign KEY (role_id) references roles (id) on delete RESTRICT,
  constraint users_email_format_chk check (
    (
      email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists users_email_lower_uniq on public.users using btree (lower(email)) TABLESPACE pg_default;

create index IF not exists idx_users_auth_id on public.users using btree (auth_id) TABLESPACE pg_default;

create index IF not exists idx_users_role_id on public.users using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_users_avatar_source on public.users using btree (avatar_source) TABLESPACE pg_default;

create index IF not exists idx_users_signup_completed on public.users using btree (signup_completed) TABLESPACE pg_default;

create trigger notify_new_user
after INSERT on users for EACH row
execute FUNCTION notify_admin_on_new_user ();

create trigger set_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_users_normalize_email BEFORE INSERT
or
update on users for EACH row
execute FUNCTION users_normalize_email ();

create trigger trigger_sync_contact_on_user_update
after
update on users for EACH row
execute FUNCTION sync_contact_on_user_update ();

