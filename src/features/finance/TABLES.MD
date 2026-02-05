# Tablas en DB para el feature FINANZAS (NUNCA SE MODIFICARÁN):

# Tabla FINANCIAL_OPERATION_MOVEMENTS:

create table public.financial_operation_movements (
  id uuid not null default gen_random_uuid (),
  financial_operation_id uuid not null,
  organization_id uuid not null,
  project_id uuid null,
  wallet_id uuid not null,
  currency_id uuid not null,
  amount numeric(14, 2) not null,
  direction text not null,
  exchange_rate numeric(14, 6) null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  updated_by uuid null,
  constraint financial_operation_movements_pkey primary key (id),
  constraint financial_operation_movements_currency_fkey foreign KEY (currency_id) references currencies (id),
  constraint financial_operation_movements_operation_fkey foreign KEY (financial_operation_id) references financial_operations (id) on delete CASCADE,
  constraint financial_operation_movements_org_fkey foreign KEY (organization_id) references organizations (id),
  constraint financial_operation_movements_wallet_fkey foreign KEY (wallet_id) references organization_wallets (id),
  constraint financial_operation_movements_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint financial_operation_movements_project_fkey foreign KEY (project_id) references projects (id),
  constraint financial_operation_movements_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint financial_operation_movements_direction_check check (
    (direction = any (array['in'::text, 'out'::text]))
  )
) TABLESPACE pg_default;

create trigger on_financial_movement_audit
after INSERT
or DELETE
or
update on financial_operation_movements for EACH row
execute FUNCTION log_financial_movement_activity ();

create trigger set_updated_at_financial_operation_movements BEFORE
update on financial_operation_movements for EACH row
execute FUNCTION set_updated_at ();

create trigger set_updated_by_financial_operation_movements BEFORE INSERT
or
update on financial_operation_movements for EACH row
execute FUNCTION handle_updated_by ();

# Tabla FINANCIAL_OPERATIONS:

create table public.financial_operations (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  project_id uuid null,
  type text not null,
  operation_date date not null default CURRENT_DATE,
  description text null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_by uuid null,
  updated_at timestamp with time zone null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint financial_operations_pkey primary key (id),
  constraint financial_operations_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint financial_operations_organization_fkey foreign KEY (organization_id) references organizations (id),
  constraint financial_operations_project_fkey foreign KEY (project_id) references projects (id),
  constraint financial_operations_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint financial_operations_type_check check (
    (
      type = any (
        array[
          'wallet_transfer'::text,
          'currency_exchange'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger on_financial_operation_audit
after INSERT
or DELETE
or
update on financial_operations for EACH row
execute FUNCTION log_financial_operation_activity ();

create trigger set_updated_at_financial_operations BEFORE
update on financial_operations for EACH row
execute FUNCTION set_updated_at ();

create trigger set_updated_by_financial_operations BEFORE INSERT
or
update on financial_operations for EACH row
execute FUNCTION handle_updated_by ();

# Vista UNIFIED_FINANCIAL_MOVEMENTS_VIEW:

create view public.unified_financial_movements_view as
select
  gcp.id,
  'general_cost'::text as movement_type,
  gcp.organization_id,
  null::uuid as project_id,
  gcp.payment_date,
  date_trunc(
    'month'::text,
    gcp.payment_date::timestamp with time zone
  ) as payment_month,
  gcp.amount,
  gcp.currency_id,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  COALESCE(gcp.exchange_rate, 1::numeric) as exchange_rate,
  gcp.amount * COALESCE(gcp.exchange_rate, 1::numeric) as functional_amount,
  '-1'::integer as amount_sign,
  gcp.status,
  gcp.wallet_id,
  w.name as wallet_name,
  gc.name as concept_name,
  gcc.name as category_name,
  null::text as contact_name,
  gcp.notes,
  gcp.reference,
  gcp.created_at,
  gcp.created_by,
  u_created.full_name as creator_name,
  u_created.avatar_url as creator_avatar_url,
  (
    exists (
      select
        1
      from
        media_links ml
      where
        ml.general_cost_payment_id = gcp.id
    )
  ) as has_attachments,
  null::numeric as to_amount,
  null::text as to_currency_code,
  null::text as to_currency_symbol,
  null::text as to_wallet_name
from
  general_costs_payments gcp
  left join currencies cur on cur.id = gcp.currency_id
  left join organization_wallets ow on ow.id = gcp.wallet_id
  left join wallets w on w.id = ow.wallet_id
  left join general_costs gc on gc.id = gcp.general_cost_id
  left join general_cost_categories gcc on gcc.id = gc.category_id
  left join organization_members om_created on om_created.id = gcp.created_by
  left join users u_created on u_created.id = om_created.user_id
where
  gcp.is_deleted = false
union all
select
  mp.id,
  'material_payment'::text as movement_type,
  mp.organization_id,
  mp.project_id,
  mp.payment_date,
  date_trunc(
    'month'::text,
    mp.payment_date::timestamp with time zone
  ) as payment_month,
  mp.amount,
  mp.currency_id,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  COALESCE(mp.exchange_rate, 1::numeric) as exchange_rate,
  mp.amount * COALESCE(mp.exchange_rate, 1::numeric) as functional_amount,
  '-1'::integer as amount_sign,
  mp.status,
  mp.wallet_id,
  w.name as wallet_name,
  mt.name as concept_name,
  null::text as category_name,
  COALESCE(
    prov.company_name,
    (prov.first_name || ' '::text) || prov.last_name
  ) as contact_name,
  mp.notes,
  mp.reference,
  mp.created_at,
  mp.created_by,
  u_created.full_name as creator_name,
  u_created.avatar_url as creator_avatar_url,
  (
    exists (
      select
        1
      from
        media_links ml
      where
        ml.material_payment_id = mp.id
    )
  ) as has_attachments,
  null::numeric as to_amount,
  null::text as to_currency_code,
  null::text as to_currency_symbol,
  null::text as to_wallet_name
from
  material_payments mp
  left join currencies cur on cur.id = mp.currency_id
  left join organization_wallets ow on ow.id = mp.wallet_id
  left join wallets w on w.id = ow.wallet_id
  left join material_types mt on mt.id = mp.material_type_id
  left join material_invoices mi on mi.id = mp.purchase_id
  left join contacts prov on prov.id = mi.provider_id
  left join organization_members om_created on om_created.id = mp.created_by
  left join users u_created on u_created.id = om_created.user_id
where
  mp.is_deleted = false
  or mp.is_deleted is null
union all
select
  lp.id,
  'labor_payment'::text as movement_type,
  lp.organization_id,
  lp.project_id,
  lp.payment_date,
  date_trunc(
    'month'::text,
    lp.payment_date::timestamp with time zone
  ) as payment_month,
  lp.amount,
  lp.currency_id,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  COALESCE(lp.exchange_rate, 1::numeric) as exchange_rate,
  lp.amount * COALESCE(lp.exchange_rate, 1::numeric) as functional_amount,
  '-1'::integer as amount_sign,
  lp.status,
  lp.wallet_id,
  w.name as wallet_name,
  lc.name as concept_name,
  null::text as category_name,
  COALESCE(
    ct.display_name_override,
    ct.full_name,
    concat(ct.first_name, ' ', ct.last_name)
  ) as contact_name,
  lp.notes,
  lp.reference,
  lp.created_at,
  lp.created_by,
  u_created.full_name as creator_name,
  u_created.avatar_url as creator_avatar_url,
  (
    exists (
      select
        1
      from
        media_links ml
      where
        ml.labor_payment_id = lp.id
    )
  ) as has_attachments,
  null::numeric as to_amount,
  null::text as to_currency_code,
  null::text as to_currency_symbol,
  null::text as to_wallet_name
from
  labor_payments lp
  left join currencies cur on cur.id = lp.currency_id
  left join organization_wallets ow on ow.id = lp.wallet_id
  left join wallets w on w.id = ow.wallet_id
  left join project_labor pl on pl.id = lp.labor_id
  left join contacts ct on ct.id = pl.contact_id
  left join labor_categories lc on lc.id = pl.labor_type_id
  left join organization_members om_created on om_created.id = lp.created_by
  left join users u_created on u_created.id = om_created.user_id
where
  lp.is_deleted = false
  or lp.is_deleted is null
union all
select
  sp.id,
  'subcontract_payment'::text as movement_type,
  sp.organization_id,
  sp.project_id,
  sp.payment_date,
  date_trunc(
    'month'::text,
    sp.payment_date::timestamp with time zone
  ) as payment_month,
  sp.amount,
  sp.currency_id,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  COALESCE(sp.exchange_rate, 1::numeric) as exchange_rate,
  sp.amount * COALESCE(sp.exchange_rate, 1::numeric) as functional_amount,
  '-1'::integer as amount_sign,
  sp.status,
  sp.wallet_id,
  w.name as wallet_name,
  s.title as concept_name,
  null::text as category_name,
  COALESCE(
    ct.full_name,
    ct.company_name,
    concat(ct.first_name, ' ', ct.last_name)
  ) as contact_name,
  sp.notes,
  sp.reference,
  sp.created_at,
  sp.created_by,
  u_created.full_name as creator_name,
  u_created.avatar_url as creator_avatar_url,
  (
    exists (
      select
        1
      from
        media_links ml
      where
        ml.subcontract_payment_id = sp.id
    )
  ) as has_attachments,
  null::numeric as to_amount,
  null::text as to_currency_code,
  null::text as to_currency_symbol,
  null::text as to_wallet_name
from
  subcontract_payments sp
  left join currencies cur on cur.id = sp.currency_id
  left join organization_wallets ow on ow.id = sp.wallet_id
  left join wallets w on w.id = ow.wallet_id
  left join subcontracts s on s.id = sp.subcontract_id
  left join contacts ct on ct.id = s.contact_id
  left join organization_members om_created on om_created.id = sp.created_by
  left join users u_created on u_created.id = om_created.user_id
where
  sp.is_deleted = false
  or sp.is_deleted is null
union all
select
  cp.id,
  'client_payment'::text as movement_type,
  cp.organization_id,
  cp.project_id,
  cp.payment_date,
  date_trunc(
    'month'::text,
    cp.payment_date::timestamp with time zone
  ) as payment_month,
  cp.amount,
  cp.currency_id,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  COALESCE(cp.exchange_rate, 1::numeric) as exchange_rate,
  cp.amount * COALESCE(cp.exchange_rate, 1::numeric) as functional_amount,
  1 as amount_sign,
  cp.status,
  cp.wallet_id,
  w.name as wallet_name,
  cc.concept as concept_name,
  null::text as category_name,
  COALESCE(
    ct.full_name,
    ct.company_name,
    concat(ct.first_name, ' ', ct.last_name)
  ) as contact_name,
  cp.notes,
  cp.reference,
  cp.created_at,
  cp.created_by,
  u_created.full_name as creator_name,
  u_created.avatar_url as creator_avatar_url,
  (
    exists (
      select
        1
      from
        media_links ml
      where
        ml.client_payment_id = cp.id
    )
  ) as has_attachments,
  null::numeric as to_amount,
  null::text as to_currency_code,
  null::text as to_currency_symbol,
  null::text as to_wallet_name
from
  client_payments cp
  left join currencies cur on cur.id = cp.currency_id
  left join organization_wallets ow on ow.id = cp.wallet_id
  left join wallets w on w.id = ow.wallet_id
  left join project_clients pc on pc.id = cp.client_id
  left join contacts ct on ct.id = pc.contact_id
  left join client_commitments cc on cc.id = cp.commitment_id
  left join organization_members om_created on om_created.id = cp.created_by
  left join users u_created on u_created.id = om_created.user_id
where
  cp.is_deleted = false
  or cp.is_deleted is null
union all
select
  fo.id,
  'currency_exchange'::text as movement_type,
  fo.organization_id,
  fo.project_id,
  fo.operation_date as payment_date,
  date_trunc(
    'month'::text,
    fo.operation_date::timestamp with time zone
  ) as payment_month,
  fom_out.amount,
  fom_out.currency_id,
  cur_out.code as currency_code,
  cur_out.symbol as currency_symbol,
  COALESCE(fom_out.exchange_rate, 1::numeric) as exchange_rate,
  fom_out.amount * COALESCE(fom_out.exchange_rate, 1::numeric) as functional_amount,
  0 as amount_sign,
  'confirmed'::text as status,
  fom_out.wallet_id,
  w_out.name as wallet_name,
  concat(w_out.name, ' → ', w_in.name) as concept_name,
  null::text as category_name,
  null::text as contact_name,
  fo.description as notes,
  null::text as reference,
  fo.created_at,
  fo.created_by,
  u_created.full_name as creator_name,
  u_created.avatar_url as creator_avatar_url,
  false as has_attachments,
  fom_in.amount as to_amount,
  cur_in.code as to_currency_code,
  cur_in.symbol as to_currency_symbol,
  w_in.name as to_wallet_name
from
  financial_operations fo
  left join financial_operation_movements fom_out on fom_out.financial_operation_id = fo.id
  and fom_out.direction = 'out'::text
  and (
    fom_out.is_deleted = false
    or fom_out.is_deleted is null
  )
  left join financial_operation_movements fom_in on fom_in.financial_operation_id = fo.id
  and fom_in.direction = 'in'::text
  and (
    fom_in.is_deleted = false
    or fom_in.is_deleted is null
  )
  left join currencies cur_out on cur_out.id = fom_out.currency_id
  left join currencies cur_in on cur_in.id = fom_in.currency_id
  left join organization_wallets ow_out on ow_out.id = fom_out.wallet_id
  left join wallets w_out on w_out.id = ow_out.wallet_id
  left join organization_wallets ow_in on ow_in.id = fom_in.wallet_id
  left join wallets w_in on w_in.id = ow_in.wallet_id
  left join organization_members om_created on om_created.id = fo.created_by
  left join users u_created on u_created.id = om_created.user_id
where
  fo.type = 'currency_exchange'::text
  and fo.is_deleted = false
union all
select
  fo.id,
  'wallet_transfer'::text as movement_type,
  fo.organization_id,
  fo.project_id,
  fo.operation_date as payment_date,
  date_trunc(
    'month'::text,
    fo.operation_date::timestamp with time zone
  ) as payment_month,
  fom_out.amount,
  fom_out.currency_id,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  COALESCE(fom_out.exchange_rate, 1::numeric) as exchange_rate,
  fom_out.amount * COALESCE(fom_out.exchange_rate, 1::numeric) as functional_amount,
  0 as amount_sign,
  'confirmed'::text as status,
  fom_out.wallet_id,
  w_out.name as wallet_name,
  concat(w_out.name, ' → ', w_in.name) as concept_name,
  null::text as category_name,
  null::text as contact_name,
  fo.description as notes,
  null::text as reference,
  fo.created_at,
  fo.created_by,
  u_created.full_name as creator_name,
  u_created.avatar_url as creator_avatar_url,
  false as has_attachments,
  fom_in.amount as to_amount,
  cur.code as to_currency_code,
  cur.symbol as to_currency_symbol,
  w_in.name as to_wallet_name
from
  financial_operations fo
  left join financial_operation_movements fom_out on fom_out.financial_operation_id = fo.id
  and fom_out.direction = 'out'::text
  and (
    fom_out.is_deleted = false
    or fom_out.is_deleted is null
  )
  left join financial_operation_movements fom_in on fom_in.financial_operation_id = fo.id
  and fom_in.direction = 'in'::text
  and (
    fom_in.is_deleted = false
    or fom_in.is_deleted is null
  )
  left join currencies cur on cur.id = fom_out.currency_id
  left join organization_wallets ow_out on ow_out.id = fom_out.wallet_id
  left join wallets w_out on w_out.id = ow_out.wallet_id
  left join organization_wallets ow_in on ow_in.id = fom_in.wallet_id
  left join wallets w_in on w_in.id = ow_in.wallet_id
  left join organization_members om_created on om_created.id = fo.created_by
  left join users u_created on u_created.id = om_created.user_id
where
  fo.type = 'wallet_transfer'::text
  and fo.is_deleted = false;