-- ============================================================================
-- MIGRATION: Remove functional_amount from client views
-- ============================================================================
-- This migration drops and recreates client_payments_view and 
-- client_financial_summary_view without functional_amount columns.
--
-- Run this BEFORE dropping functional_amount column from tables.
-- ============================================================================

-- ==========================
-- STEP 1: Drop dependent views (order matters!)
-- ==========================
DROP VIEW IF EXISTS public.client_financial_summary_view CASCADE;
DROP VIEW IF EXISTS public.client_payments_view CASCADE;

-- ==========================
-- STEP 2: Recreate client_payments_view WITHOUT functional_amount
-- ==========================
CREATE VIEW public.client_payments_view AS
SELECT
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
    date_trunc('month'::text, cp.payment_date::timestamp with time zone) AS payment_month,
    pcv.contact_full_name AS client_name,
    pcv.contact_first_name AS client_first_name,
    pcv.contact_last_name AS client_last_name,
    pcv.contact_company_name AS client_company_name,
    pcv.contact_email AS client_email,
    pcv.contact_phone AS client_phone,
    pcv.role_name AS client_role_name,
    pcv.contact_image_url AS client_image_url,
    pcv.linked_user_avatar_url AS client_linked_user_avatar_url,
    pcv.contact_avatar_url AS client_avatar_url,
    w.name AS wallet_name,
    cur.symbol AS currency_symbol,
    cur.code AS currency_code,
    cc.concept AS commitment_concept,
    cps.notes AS schedule_notes
FROM client_payments cp
LEFT JOIN project_clients_view pcv ON pcv.id = cp.client_id
LEFT JOIN organization_wallets ow ON ow.id = cp.wallet_id
LEFT JOIN wallets w ON w.id = ow.wallet_id
LEFT JOIN currencies cur ON cur.id = cp.currency_id
LEFT JOIN client_commitments cc ON cc.id = cp.commitment_id
LEFT JOIN client_payment_schedule cps ON cps.id = cp.schedule_id
WHERE cp.is_deleted = false;

-- ==========================
-- STEP 3: Recreate client_financial_summary_view WITHOUT functional_amount
-- ==========================
CREATE VIEW public.client_financial_summary_view AS
WITH commitment_totals AS (
    SELECT
        client_commitments.client_id,
        client_commitments.currency_id,
        SUM(client_commitments.amount) AS total_committed,
        -- Calculate functional equivalent using exchange_rate
        SUM(client_commitments.amount * COALESCE(client_commitments.exchange_rate, 1)) AS total_converted_committed
    FROM client_commitments
    WHERE client_commitments.is_deleted = false
    GROUP BY client_commitments.client_id, client_commitments.currency_id
),
payment_totals AS (
    SELECT
        client_payments.client_id,
        client_payments.currency_id,
        SUM(client_payments.amount) AS total_paid,
        -- Calculate functional equivalent using exchange_rate
        SUM(client_payments.amount * COALESCE(client_payments.exchange_rate, 1)) AS total_converted_paid
    FROM client_payments
    WHERE client_payments.status = 'confirmed'::text
      AND client_payments.is_deleted = false
    GROUP BY client_payments.client_id, client_payments.currency_id
)
SELECT
    pc.id AS client_id,
    pc.project_id,
    pc.organization_id,
    cur.id AS currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(ct.total_committed, 0::numeric) AS total_committed_amount,
    COALESCE(pt.total_paid, 0::numeric) AS total_paid_amount,
    COALESCE(ct.total_committed, 0::numeric) - COALESCE(pt.total_paid, 0::numeric) AS balance_due,
    -- These now use exchange_rate calculation instead of functional_amount
    COALESCE(ct.total_converted_committed, 0::numeric) AS total_functional_committed_amount,
    COALESCE(pt.total_converted_paid, 0::numeric) AS total_functional_paid_amount,
    COALESCE(ct.total_converted_committed, 0::numeric) - COALESCE(pt.total_converted_paid, 0::numeric) AS functional_balance_due
FROM project_clients pc
CROSS JOIN currencies cur
LEFT JOIN commitment_totals ct ON ct.client_id = pc.id AND ct.currency_id = cur.id
LEFT JOIN payment_totals pt ON pt.client_id = pc.id AND pt.currency_id = cur.id
WHERE pc.is_deleted = false
  AND (ct.total_committed > 0::numeric OR pt.total_paid > 0::numeric);

-- ==========================
-- GRANT PERMISSIONS (if needed)
-- ==========================
-- GRANT SELECT ON public.client_payments_view TO authenticated;
-- GRANT SELECT ON public.client_financial_summary_view TO authenticated;
