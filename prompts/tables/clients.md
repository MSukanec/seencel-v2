# Tablas y vistas en DB para el modulo CLIENTS o similares:

NO MODIFICAR NUNCA; solo lo modifico yo! Si te pido modificarla solo MODIFICA LAS TABLAS PARA QUE SE ACTUALICEN A LO UTLIMO QUE HICIMOS; pero ni suplantes informacion ni nada raro. Preguntame cuaquier cosa.

## Tabla client_commitments:

create table public.client_commitments (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  client_id uuid not null,
  organization_id uuid not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  exchange_rate numeric not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  commitment_method public.client_commitment_method not null default 'fixed'::client_commitment_method,
  unit_name text null,
  unit_description text null,
  constraint project_client_commitments_pkey primary key (id),
  constraint client_commitments_client_id_fkey foreign KEY (client_id) references project_clients (id) on delete CASCADE,
  constraint client_commitments_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint client_commitments_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint fk_commit_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint fk_commit_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint client_commitments_amount_positive check ((amount > (0)::numeric)),
  constraint client_commitments_exchange_rate_positive check ((exchange_rate > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_client_commitments_org_project on public.client_commitments using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_client_commitments_org on public.client_commitments using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_client_commitments_client on public.client_commitments using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_client_commitments_currency on public.client_commitments using btree (currency_id) TABLESPACE pg_default;

create index IF not exists idx_client_commitments_created_at on public.client_commitments using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_commitments_org_project_client on public.client_commitments using btree (organization_id, project_id, client_id) TABLESPACE pg_default;

create index IF not exists client_commitments_not_deleted_idx on public.client_commitments using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_client_commitments_method on public.client_commitments using btree (commitment_method) TABLESPACE pg_default;

create trigger client_commitments_set_updated_at BEFORE
update on client_commitments for EACH row
execute FUNCTION update_timestamp ();

## Tabla client_payment_schedule:

create table public.client_payment_schedule (
  id uuid not null default gen_random_uuid (),
  commitment_id uuid not null,
  due_date date not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  status text not null default 'pending'::text,
  paid_at timestamp with time zone null,
  payment_method text null,
  notes text null,
  organization_id uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  constraint client_payment_schedule_pkey primary key (id),
  constraint client_payment_schedule_commitment_id_fkey foreign KEY (commitment_id) references client_commitments (id) on delete CASCADE,
  constraint client_payment_schedule_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint client_payment_schedule_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint client_payment_schedule_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint client_payment_schedule_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'paid'::text,
          'overdue'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists client_payment_schedule_org_idx on public.client_payment_schedule using btree (organization_id) TABLESPACE pg_default;

create index IF not exists client_payment_schedule_commitment_idx on public.client_payment_schedule using btree (commitment_id) TABLESPACE pg_default;

create index IF not exists client_payment_schedule_due_idx on public.client_payment_schedule using btree (due_date) TABLESPACE pg_default;

create index IF not exists client_payment_schedule_not_deleted_idx on public.client_payment_schedule using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists client_payment_schedule_org_commitment_due_idx on public.client_payment_schedule using btree (organization_id, commitment_id, due_date) TABLESPACE pg_default;

create trigger client_payment_schedule_set_updated_at BEFORE
update on client_payment_schedule for EACH row
execute FUNCTION update_timestamp ();

## Tabla client_payments:

create table public.client_payments (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  commitment_id uuid null,
  schedule_id uuid null,
  organization_id uuid not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  exchange_rate numeric null,
  payment_date date not null default now(),
  notes text null,
  reference text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone not null default now(),
  wallet_id uuid not null,
  client_id uuid null,
  status text not null default 'confirmed'::text,
  created_by uuid null,
  functional_amount numeric(12, 2) null,
  is_deleted boolean null default false,
  deleted_at timestamp with time zone null,
  constraint client_payments_pkey primary key (id),
  constraint client_payments_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint fk_payment_schedule foreign KEY (schedule_id) references client_payment_schedule (id) on delete set null,
  constraint fk_payment_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_payment_project foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint client_payments_wallet_id_fkey foreign KEY (wallet_id) references organization_wallets (id) on delete RESTRICT,
  constraint fk_payment_client foreign KEY (client_id) references project_clients (id) on delete set null,
  constraint fk_payment_commitment foreign KEY (commitment_id) references client_commitments (id) on delete set null,
  constraint fk_payment_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint client_payments_status_check check (
    (
      status = any (
        array[
          'confirmed'::text,
          'pending'::text,
          'rejected'::text,
          'void'::text
        ]
      )
    )
  ),
  constraint client_payments_amount_positive check ((amount > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_client_payments_org_project on public.client_payments using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_commitment on public.client_payments using btree (commitment_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_schedule on public.client_payments using btree (schedule_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_date on public.client_payments using btree (payment_date) TABLESPACE pg_default;

create index IF not exists idx_client_payments_view_project on public.client_payments using btree (project_id, payment_date desc) TABLESPACE pg_default;

create index IF not exists idx_client_payments_view_org on public.client_payments using btree (organization_id, payment_date desc) TABLESPACE pg_default;

create index IF not exists idx_client_payments_not_deleted on public.client_payments using btree (organization_id, project_id) TABLESPACE pg_default
where
  (
    (is_deleted is null)
    or (is_deleted = false)
  );

create trigger set_client_payments_updated_at BEFORE
update on client_payments for EACH row
execute FUNCTION set_timestamp ();

## Tabla client_portal_settings:

create table public.client_portal_settings (
  project_id uuid not null,
  organization_id uuid not null,
  show_dashboard boolean not null default true,
  show_installments boolean not null default false,
  show_payments boolean not null default false,
  show_logs boolean not null default false,
  show_amounts boolean not null default true,
  show_progress boolean not null default true,
  allow_comments boolean not null default false,
  updated_at timestamp with time zone null default now(),
  updated_by uuid null,
  constraint client_portal_settings_pkey primary key (project_id),
  constraint client_portal_settings_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint client_portal_settings_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint client_portal_settings_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_client_portal_settings_org on public.client_portal_settings using btree (organization_id) TABLESPACE pg_default;

## Tabla client_roles:

create table public.client_roles (
  id uuid not null default gen_random_uuid (),
  organization_id uuid null,
  name text not null,
  description text null,
  is_system boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  updated_by uuid null,
  constraint client_roles_pkey primary key (id),
  constraint client_roles_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint client_roles_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint client_roles_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null
) TABLESPACE pg_default;

create trigger on_client_role_audit
after INSERT or DELETE or update on client_roles for EACH row
execute FUNCTION log_client_role_activity ();

create trigger set_audit_client_roles BEFORE INSERT or update on client_roles for EACH row
execute FUNCTION handle_updated_by ();

## Tabla project_clients:

create table public.project_clients (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  contact_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  organization_id uuid not null,
  is_primary boolean not null default true,
  notes text null,
  status text not null default 'active'::text,
  client_role_id uuid null,
  created_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint project_clients_pkey primary key (id),
  constraint project_clients_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete set null,
  constraint project_clients_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint project_clients_client_role_id_fkey foreign KEY (client_role_id) references client_roles (id) on delete set null,
  constraint project_clients_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint project_clients_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint project_clients_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'inactive'::text,
          'deleted'::text,
          'potential'::text,
          'rejected'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_project_clients_is_primary on public.project_clients using btree (is_primary) TABLESPACE pg_default;

create index IF not exists idx_project_clients_org_project on public.project_clients using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_project_clients_project on public.project_clients using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_project_clients_client on public.project_clients using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_project_clients_created_at on public.project_clients using btree (created_at) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_project_client on public.project_clients using btree (project_id, contact_id) TABLESPACE pg_default
where
  (is_deleted = false);

## Tabla client_financial_summary_view:

create view public.client_financial_summary_view as
with
  commitment_totals as (
    select
      client_commitments.client_id,
      client_commitments.currency_id,
      sum(client_commitments.amount) as total_committed
    from
      client_commitments
    where
      client_commitments.is_deleted = false
    group by
      client_commitments.client_id,
      client_commitments.currency_id
  ),
  payment_totals as (
    select
      client_payments.client_id,
      client_payments.currency_id,
      sum(client_payments.amount) as total_paid
    from
      client_payments
    where
      client_payments.status = 'confirmed'::text
    group by
      client_payments.client_id,
      client_payments.currency_id
  )
select
  pc.id as client_id,
  pc.project_id,
  pc.organization_id,
  cur.id as currency_id,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  COALESCE(ct.total_committed, 0::numeric) as total_committed_amount,
  COALESCE(pt.total_paid, 0::numeric) as total_paid_amount,
  COALESCE(ct.total_committed, 0::numeric) - COALESCE(pt.total_paid, 0::numeric) as balance_due
from
  project_clients pc
  cross join currencies cur
  left join commitment_totals ct on ct.client_id = pc.id
  and ct.currency_id = cur.id
  left join payment_totals pt on pt.client_id = pc.id
  and pt.currency_id = cur.id
where
  pc.is_deleted = false
  and (
    ct.total_committed > 0::numeric
    or pt.total_paid > 0::numeric
  );

## Tabla client_payments_view:

create view public.client_payments_view as
select
  cp.id,
  cp.organization_id,
  cp.project_id,
  cp.client_id,
  cp.commitment_id,
  cp.amount,
  cp.currency_id,
  cp.exchange_rate,
  cp.payment_date,
  cp.status,
  cp.wallet_id,
  cp.reference,
  cp.notes,
  cp.created_at,
  cp.created_by,
  cp.schedule_id,
  date_trunc(
    'month'::text,
    cp.payment_date::timestamp without time zone
  ) as payment_month,
  pcv.contact_full_name as client_name,
  pcv.contact_first_name as client_first_name,
  pcv.contact_last_name as client_last_name,
  pcv.contact_company_name as client_company_name,
  pcv.contact_email as client_email,
  pcv.contact_phone as client_phone,
  pcv.role_name as client_role_name,
  pcv.contact_image_url as client_image_url,
  pcv.linked_user_avatar_url as client_linked_user_avatar_url,
  pcv.contact_avatar_url as client_avatar_url,
  w.name as wallet_name,
  cur.symbol as currency_symbol,
  cur.code as currency_code
from
  client_payments cp
  left join project_clients_view pcv on pcv.id = cp.client_id
  left join organization_wallets ow on ow.id = cp.wallet_id
  left join wallets w on w.id = ow.wallet_id
  left join currencies cur on cur.id = cp.currency_id
where
  cp.is_deleted = false;

## Tabla project_clients_view:

create view public.project_clients_view as
select
  pc.id,
  pc.project_id,
  pc.organization_id,
  pc.contact_id,
  pc.client_role_id,
  pc.is_primary,
  pc.status,
  pc.notes,
  pc.created_at,
  pc.updated_at,
  pc.is_deleted,
  c.full_name as contact_full_name,
  c.first_name as contact_first_name,
  c.last_name as contact_last_name,
  c.email as contact_email,
  c.phone as contact_phone,
  c.company_name as contact_company_name,
  c.image_url as contact_image_url,
  c.linked_user_id,
  u.avatar_url as linked_user_avatar_url,
  COALESCE(u.avatar_url, c.image_url) as contact_avatar_url,
  cr.name as role_name
from
  project_clients pc
  left join contacts c on c.id = pc.contact_id
  left join users u on u.id = c.linked_user_id
  left join client_roles cr on cr.id = pc.client_role_id
where
  pc.is_deleted = false;








