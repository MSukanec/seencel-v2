-- Migration: Update general_costs views to include creator info and use base tables
-- Purpose: Make payments view consistent with unified_financial_movements_view
-- Also refactor dependent views to use base tables instead of other views

-- 1. Drop dependent views first
DROP VIEW IF EXISTS public.general_costs_monthly_summary_view;
DROP VIEW IF EXISTS public.general_costs_by_category_view;
DROP VIEW IF EXISTS public.general_costs_payments_view;

-- 2. Recreate main payments view with all new fields
CREATE VIEW public.general_costs_payments_view AS
SELECT
  gcp.id,
  gcp.organization_id,
  gcp.payment_date,
  date_trunc('month'::text, gcp.payment_date::timestamp with time zone) as payment_month,
  gcp.amount,
  gcp.currency_id,
  cur.code AS currency_code,
  cur.symbol AS currency_symbol,
  COALESCE(gcp.exchange_rate, 1::numeric) AS exchange_rate,
  gcp.status,
  gcp.wallet_id,
  w.name AS wallet_name,
  gcp.notes,
  gcp.reference,
  gc.id AS general_cost_id,
  gc.name AS general_cost_name,
  gc.is_recurring,
  gc.recurrence_interval,
  gcc.id AS category_id,
  gcc.name AS category_name,
  -- Creator info
  gcp.created_by,
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  -- Attachments
  EXISTS (SELECT 1 FROM media_links ml WHERE ml.general_cost_payment_id = gcp.id) AS has_attachments
FROM
  general_costs_payments gcp
  LEFT JOIN general_costs gc ON gc.id = gcp.general_cost_id
  LEFT JOIN general_cost_categories gcc ON gcc.id = gc.category_id
  LEFT JOIN organization_members om ON om.id = gcp.created_by
  LEFT JOIN users u ON u.id = om.user_id
  LEFT JOIN wallets w ON w.id = gcp.wallet_id
  LEFT JOIN currencies cur ON cur.id = gcp.currency_id
WHERE
  gcp.is_deleted = false;

-- 3. Recreate monthly summary view (now queries base tables directly)
CREATE VIEW public.general_costs_monthly_summary_view AS
SELECT
  gcp.organization_id,
  date_trunc('month'::text, gcp.payment_date::timestamp with time zone) AS payment_month,
  SUM(gcp.amount) AS total_amount,
  COUNT(*) AS payments_count
FROM
  general_costs_payments gcp
WHERE
  gcp.is_deleted = false
GROUP BY
  gcp.organization_id,
  date_trunc('month'::text, gcp.payment_date::timestamp with time zone);

-- 4. Recreate by-category view (now queries base tables directly)
CREATE VIEW public.general_costs_by_category_view AS
SELECT
  gcp.organization_id,
  date_trunc('month'::text, gcp.payment_date::timestamp with time zone) AS payment_month,
  gc.category_id,
  gcc.name AS category_name,
  SUM(gcp.amount) AS total_amount
FROM
  general_costs_payments gcp
  LEFT JOIN general_costs gc ON gc.id = gcp.general_cost_id
  LEFT JOIN general_cost_categories gcc ON gcc.id = gc.category_id
WHERE
  gcp.is_deleted = false
GROUP BY
  gcp.organization_id,
  date_trunc('month'::text, gcp.payment_date::timestamp with time zone),
  gc.category_id,
  gcc.name;
