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
  functional_amount numeric(15, 2) null,
  updated_by uuid null,
  is_deleted boolean null default false,
  constraint subcontract_payments_pkey primary key (id),
  constraint fk_sp_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint fk_sp_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_sp_project foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint fk_sp_subcontract foreign KEY (subcontract_id) references subcontracts (id) on delete set null,
  constraint fk_sp_wallet foreign KEY (wallet_id) references organization_wallets (id) on delete set null,
  constraint subcontract_payments_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint fk_sp_created_by foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint subcontract_payments_amount_positive check ((amount > (0)::numeric)),
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
  ),
  constraint subcontract_payments_exchange_rate_positive check ((exchange_rate > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_subcontract_payments_is_deleted on public.subcontract_payments using btree (is_deleted) TABLESPACE pg_default;

create index IF not exists idx_subcontract_payments_view_org on public.subcontract_payments using btree (organization_id, payment_date desc) TABLESPACE pg_default;

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

create trigger set_functional_amount_subcontract_payments BEFORE INSERT
or
update OF amount,
exchange_rate,
currency_id on subcontract_payments for EACH row
execute FUNCTION set_subcontract_functional_amount ();

create trigger set_subcontract_payments_updated_at BEFORE
update on subcontract_payments for EACH row
execute FUNCTION update_updated_at_column ();

create trigger set_updated_by_subcontract_payments BEFORE INSERT
or
update on subcontract_payments for EACH row
execute FUNCTION handle_updated_by ();

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