# Tablas en DB para el feature FINANZAS (NUNCA SE MODIFICARÁN):

# Vista UNIFIED_FINANCIAL_MOVEMENTS_VIEW:

create view public.unified_financial_movements_view as
select
  gcp.id,
  'general_cost'::text as movement_type,
  gcp.organization_id,
  null::uuid as project_id,
  gcp.payment_date as date,
  date_trunc(
    'month'::text,
    gcp.payment_date::timestamp with time zone
  ) as payment_month,
  gcp.amount,
  gcp.currency_id,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  gcp.exchange_rate,
  gcp.amount * COALESCE(gcp.exchange_rate, 1::numeric) as functional_amount,
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
  ) as has_attachments
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
  mp.payment_date as date,
  date_trunc(
    'month'::text,
    mp.payment_date::timestamp with time zone
  ) as payment_month,
  mp.amount,
  mp.currency_id,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  mp.exchange_rate,
  mp.amount * COALESCE(mp.exchange_rate, 1::numeric) as functional_amount,
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
  ) as has_attachments
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
  lp.payment_date as date,
  date_trunc(
    'month'::text,
    lp.payment_date::timestamp with time zone
  ) as payment_month,
  lp.amount,
  lp.currency_id,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  lp.exchange_rate,
  lp.amount * COALESCE(lp.exchange_rate, 1::numeric) as functional_amount,
  lp.status,
  lp.wallet_id,
  w.name as wallet_name,
  lt.name as concept_name,
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
  ) as has_attachments
from
  labor_payments lp
  left join currencies cur on cur.id = lp.currency_id
  left join organization_wallets ow on ow.id = lp.wallet_id
  left join wallets w on w.id = ow.wallet_id
  left join project_labor pl on pl.id = lp.labor_id
  left join contacts ct on ct.id = pl.contact_id
  left join labor_types lt on lt.id = pl.labor_type_id
  left join organization_members om_created on om_created.id = lp.created_by
  left join users u_created on u_created.id = om_created.user_id
where
  lp.is_deleted = false
  or lp.is_deleted is null;