-- =============================================================================
-- MIGRACIÓN: Agregar expected_amount a general_costs + actualizar vista
-- =============================================================================
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- 1. Nuevas columnas en general_costs
ALTER TABLE finance.general_costs
  ADD COLUMN IF NOT EXISTS expected_amount numeric,
  ADD COLUMN IF NOT EXISTS expected_currency_id uuid REFERENCES finance.currencies(id);

-- 2. Actualizar vista de pagos para incluir expected_amount/currency del concepto
DROP VIEW IF EXISTS finance.general_costs_payments_view;

CREATE VIEW finance.general_costs_payments_view AS
SELECT gcp.id,
    gcp.organization_id,
    gcp.payment_date,
    date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone) AS payment_month,
    gcp.amount,
    gcp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(gcp.exchange_rate, (1)::numeric) AS exchange_rate,
    gcp.status,
    gcp.wallet_id,
    w.name AS wallet_name,
    gcp.notes,
    gcp.reference,
    gc.id AS general_cost_id,
    gc.name AS general_cost_name,
    gc.is_recurring,
    gc.recurrence_interval,
    gc.expected_day,
    gc.expected_amount,
    gc.expected_currency_id,
    exp_cur.code AS expected_currency_code,
    exp_cur.symbol AS expected_currency_symbol,
    gcc.id AS category_id,
    gcc.name AS category_name,
    gcp.created_by,
    u.full_name AS creator_full_name,
    u.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.general_cost_payment_id = gcp.id))) AS has_attachments
   FROM ((((((((finance.general_costs_payments gcp
     LEFT JOIN finance.general_costs gc ON ((gc.id = gcp.general_cost_id)))
     LEFT JOIN finance.general_cost_categories gcc ON ((gcc.id = gc.category_id)))
     LEFT JOIN iam.organization_members om ON ((om.id = gcp.created_by)))
     LEFT JOIN iam.users u ON ((u.id = om.user_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = gcp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.currencies cur ON ((cur.id = gcp.currency_id)))
     LEFT JOIN finance.currencies exp_cur ON ((exp_cur.id = gc.expected_currency_id)))
  WHERE (gcp.is_deleted = false);
