# Tablas de BD para SUBCONTRATOS:

## NUNCA LA MODIFIQUES TU!

# Tabla SUBCONTRACT_PAYMENTS:

create table public.subcontract_payments (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  subcontract_id uuid null,
  organization_id uuid not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  exchange_rate numeric not null,
  payment_date date not null default now(),
  notes text null,
  reference text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  wallet_id uuid null,
  status text not null default 'confirmed'::text,
  created_by uuid null,
  updated_by uuid null,
  is_deleted boolean null default false,
  import_batch_id uuid null,
  constraint subcontract_payments_pkey primary key (id),
  constraint fk_sp_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint fk_sp_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_sp_project foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint fk_sp_subcontract foreign KEY (subcontract_id) references subcontracts (id) on delete set null,
  constraint fk_sp_wallet foreign KEY (wallet_id) references organization_wallets (id) on delete set null,
  constraint fk_sp_created_by foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint subcontract_payments_import_batch_id_fkey foreign KEY (import_batch_id) references import_batches (id) on delete set null,
  constraint subcontract_payments_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint subcontract_payments_amount_positive check ((amount > (0)::numeric)),
  constraint subcontract_payments_exchange_rate_positive check ((exchange_rate > (0)::numeric)),
  constraint subcontract_payments_status_check check (
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
  )
) TABLESPACE pg_default;

create index IF not exists idx_subcontract_payments_is_deleted on public.subcontract_payments using btree (is_deleted) TABLESPACE pg_default;

create index IF not exists idx_subcontract_payments_view_org on public.subcontract_payments using btree (organization_id, payment_date desc) TABLESPACE pg_default;

create index IF not exists idx_subcontract_payments_import_batch_id on public.subcontract_payments using btree (import_batch_id) TABLESPACE pg_default;

create index IF not exists idx_subcontract_payments_org_project on public.subcontract_payments using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_subcontract_payments_subcontract on public.subcontract_payments using btree (subcontract_id) TABLESPACE pg_default;

create index IF not exists idx_subcontract_payments_date on public.subcontract_payments using btree (payment_date) TABLESPACE pg_default;

create index IF not exists idx_subcontract_payments_view_project on public.subcontract_payments using btree (project_id, payment_date desc) TABLESPACE pg_default;

create trigger on_subcontract_payment_audit
after INSERT
or DELETE
or
update on subcontract_payments for EACH row
execute FUNCTION log_subcontract_payment_activity ();

create trigger set_subcontract_payments_updated_at BEFORE
update on subcontract_payments for EACH row
execute FUNCTION update_updated_at_column ();

create trigger set_updated_by_subcontract_payments BEFORE INSERT
or
update on subcontract_payments for EACH row
execute FUNCTION handle_updated_by ();

# Vista SUBCONTRACT_PAYMENTS_VIEW:

create view public.subcontract_payments_view as
select
  sp.id,
  sp.organization_id,
  sp.project_id,
  sp.subcontract_id,
  sp.amount,
  sp.currency_id,
  sp.exchange_rate,
  sp.payment_date,
  sp.status,
  sp.wallet_id,
  sp.reference,
  sp.notes,
  sp.created_at,
  sp.created_by,
  sp.import_batch_id,
  date_trunc(
    'month'::text,
    sp.payment_date::timestamp with time zone
  ) as payment_month,
  s.title as subcontract_title,
  s.code as subcontract_code,
  s.status as subcontract_status,
  s.amount_total as subcontract_amount_total,
  c.id as provider_id,
  c.full_name as provider_name,
  c.first_name as provider_first_name,
  c.last_name as provider_last_name,
  c.company_name as provider_company_name,
  c.email as provider_email,
  c.phone as provider_phone,
  c.image_url as provider_image_url,
  c.linked_user_id as provider_linked_user_id,
  COALESCE(u.avatar_url, c.image_url) as provider_avatar_url,
  w.name as wallet_name,
  cur.symbol as currency_symbol,
  cur.code as currency_code,
  cur.name as currency_name
from
  subcontract_payments sp
  left join subcontracts s on s.id = sp.subcontract_id
  left join contacts c on c.id = s.contact_id
  left join users u on u.id = c.linked_user_id
  left join organization_wallets ow on ow.id = sp.wallet_id
  left join wallets w on w.id = ow.wallet_id
  left join currencies cur on cur.id = sp.currency_id
where
  sp.is_deleted = false;

# Tabla SUBCONTRACTS:

create table public.subcontracts (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  project_id uuid null,
  code text null,
  title text not null,
  amount_total numeric null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  status text null default 'draft'::text,
  exchange_rate numeric null,
  date date null,
  winner_bid_id uuid null,
  contact_id uuid null,
  functional_amount numeric(15, 2) null,
  created_by uuid null,
  updated_by uuid null,
  is_deleted boolean null default false,
  currency_id uuid null,
  constraint subcontracts_pkey primary key (id),
  constraint subcontracts_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete set null,
  constraint subcontracts_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint subcontracts_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete set null,
  constraint subcontracts_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint subcontracts_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint subcontracts_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint subcontracts_winner_bid_id_fkey foreign KEY (winner_bid_id) references subcontract_bids (id),
  constraint check_subcontracts_status check (
    (
      status = any (
        array[
          'draft'::text,
          'active'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_subcontracts_currency on public.subcontracts using btree (currency_id) TABLESPACE pg_default;

create index IF not exists idx_subcontracts_organization on public.subcontracts using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_subcontracts_project on public.subcontracts using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_subcontracts_status on public.subcontracts using btree (status) TABLESPACE pg_default;

create index IF not exists idx_subcontracts_contact on public.subcontracts using btree (contact_id) TABLESPACE pg_default;

create trigger on_subcontract_audit
after INSERT
or DELETE
or
update on subcontracts for EACH row
execute FUNCTION log_subcontract_activity ();

create trigger set_functional_amount_subcontracts BEFORE INSERT
or
update OF amount_total,
exchange_rate,
currency_id on subcontracts for EACH row
execute FUNCTION set_subcontract_functional_amount ();

create trigger set_subcontracts_updated_at BEFORE
update on subcontracts for EACH row
execute FUNCTION update_updated_at_column ();

create trigger set_updated_by_subcontracts BEFORE INSERT
or
update on subcontracts for EACH row
execute FUNCTION handle_updated_by ();

# Vista SUBCONTRACTS_VIEW:

create view public.subcontracts_view as
select
  s.id,
  s.organization_id,
  s.project_id,
  s.title,
  s.amount_total,
  s.currency_id,
  c.code as currency_code,
  c.symbol as currency_symbol,
  s.exchange_rate,
  s.date,
  s.status,
  s.notes,
  ct.id as provider_id,
  COALESCE(ct.full_name, ct.company_name) as provider_name,
  ct.image_url as provider_image,
  s.created_at,
  s.updated_at,
  s.is_deleted,
  s.adjustment_index_type_id,
  s.base_period_year,
  s.base_period_month,
  s.base_index_value
from
  subcontracts s
  left join contacts ct on s.contact_id = ct.id
  left join currencies c on s.currency_id = c.id
where
  s.is_deleted = false;