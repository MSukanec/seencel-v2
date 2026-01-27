-- Migration: Add wallet_name to unified_financial_movements_view
-- Purpose: Enable distribution by wallet chart in finance overview

DROP VIEW IF EXISTS public.unified_financial_movements_view;

CREATE VIEW public.unified_financial_movements_view AS
SELECT
  cp.id,
  cp.organization_id,
  cp.project_id,
  cp.amount,
  cp.currency_id,
  COALESCE(cp.exchange_rate, 1::numeric) AS exchange_rate,
  cp.payment_date,
  COALESCE(cp.notes, cp.reference, 'Pago de cliente'::text) AS description,
  cp.reference,
  cp.wallet_id,
  w.name AS wallet_name,
  cp.status,
  cp.created_by,
  cp.created_at,
  cp.updated_at,
  'client_payment'::text AS movement_type,
  cp.client_id,
  NULL::uuid AS material_id,
  NULL::uuid AS personnel_id,
  NULL::uuid AS purchase_id,
  NULL::uuid AS partner_id,
  NULL::uuid AS general_cost_id,
  NULL::uuid AS financial_operation_id,
  1 AS amount_sign,
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  COALESCE(c.full_name, c.company_name) AS entity_name,
  EXISTS (SELECT 1 FROM media_links ml WHERE ml.client_payment_id = cp.id) AS has_attachments
FROM
  client_payments cp
  LEFT JOIN organization_members om ON om.id = cp.created_by
  LEFT JOIN users u ON u.id = om.user_id
  LEFT JOIN project_clients pc ON pc.id = cp.client_id
  LEFT JOIN contacts c ON c.id = pc.contact_id
  LEFT JOIN wallets w ON w.id = cp.wallet_id
WHERE
  cp.is_deleted IS NOT TRUE

UNION ALL

SELECT
  mp.id,
  mp.organization_id,
  mp.project_id,
  mp.amount,
  mp.currency_id,
  COALESCE(mp.exchange_rate, 1::numeric) AS exchange_rate,
  mp.payment_date,
  COALESCE(mp.notes, mp.reference, 'Pago de material'::text) AS description,
  mp.reference,
  mp.wallet_id,
  w.name AS wallet_name,
  mp.status,
  mp.created_by,
  mp.created_at,
  mp.updated_at,
  'material_payment'::text AS movement_type,
  NULL::uuid AS client_id,
  NULL::uuid AS material_id,
  NULL::uuid AS personnel_id,
  mp.purchase_id,
  NULL::uuid AS partner_id,
  NULL::uuid AS general_cost_id,
  NULL::uuid AS financial_operation_id,
  '-1'::integer AS amount_sign,
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  COALESCE(mp.notes, mp.reference, 'Material'::text) AS entity_name,
  EXISTS (SELECT 1 FROM media_links ml WHERE ml.material_payment_id = mp.id) AS has_attachments
FROM
  material_payments mp
  LEFT JOIN organization_members om ON om.id = mp.created_by
  LEFT JOIN users u ON u.id = om.user_id
  LEFT JOIN wallets w ON w.id = mp.wallet_id
WHERE
  mp.is_deleted IS NOT TRUE

UNION ALL

SELECT
  pp.id,
  pp.organization_id,
  pp.project_id,
  pp.amount,
  pp.currency_id,
  COALESCE(pp.exchange_rate, 1::numeric) AS exchange_rate,
  pp.payment_date,
  COALESCE(pp.notes, pp.reference, 'Pago de personal'::text) AS description,
  pp.reference,
  pp.wallet_id,
  w.name AS wallet_name,
  pp.status,
  pp.created_by,
  pp.created_at,
  pp.updated_at,
  'personnel_payment'::text AS movement_type,
  NULL::uuid AS client_id,
  NULL::uuid AS material_id,
  pp.personnel_id,
  NULL::uuid AS purchase_id,
  NULL::uuid AS partner_id,
  NULL::uuid AS general_cost_id,
  NULL::uuid AS financial_operation_id,
  '-1'::integer AS amount_sign,
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  c.full_name AS entity_name,
  EXISTS (SELECT 1 FROM media_links ml WHERE ml.personnel_payment_id = pp.id) AS has_attachments
FROM
  personnel_payments pp
  LEFT JOIN organization_members om ON om.id = pp.created_by
  LEFT JOIN users u ON u.id = om.user_id
  LEFT JOIN project_personnel ppe ON ppe.id = pp.personnel_id
  LEFT JOIN contacts c ON c.id = ppe.contact_id
  LEFT JOIN wallets w ON w.id = pp.wallet_id
WHERE
  pp.is_deleted IS NOT TRUE

UNION ALL

SELECT
  pc.id,
  pc.organization_id,
  pc.project_id,
  pc.amount,
  pc.currency_id,
  COALESCE(pc.exchange_rate, 1::numeric) AS exchange_rate,
  pc.contribution_date AS payment_date,
  COALESCE(pc.notes, pc.reference, 'Aporte de socio'::text) AS description,
  pc.reference,
  pc.wallet_id,
  w.name AS wallet_name,
  pc.status,
  pc.created_by,
  pc.created_at,
  pc.updated_at,
  'partner_contribution'::text AS movement_type,
  NULL::uuid AS client_id,
  NULL::uuid AS material_id,
  NULL::uuid AS personnel_id,
  NULL::uuid AS purchase_id,
  pc.partner_id,
  NULL::uuid AS general_cost_id,
  NULL::uuid AS financial_operation_id,
  1 AS amount_sign,
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  COALESCE(c.full_name, c.company_name) AS entity_name,
  EXISTS (SELECT 1 FROM media_links ml WHERE ml.partner_contribution_id = pc.id) AS has_attachments
FROM
  partner_contributions pc
  LEFT JOIN organization_members om ON om.id = pc.created_by
  LEFT JOIN users u ON u.id = om.user_id
  LEFT JOIN capital_participants cp ON cp.id = pc.partner_id
  LEFT JOIN contacts c ON c.id = cp.contact_id
  LEFT JOIN wallets w ON w.id = pc.wallet_id
WHERE
  pc.is_deleted IS NOT TRUE

UNION ALL

SELECT
  pw.id,
  pw.organization_id,
  pw.project_id,
  pw.amount,
  pw.currency_id,
  COALESCE(pw.exchange_rate, 1::numeric) AS exchange_rate,
  pw.withdrawal_date AS payment_date,
  COALESCE(pw.notes, pw.reference, 'Retiro de socio'::text) AS description,
  pw.reference,
  pw.wallet_id,
  w.name AS wallet_name,
  pw.status,
  pw.created_by,
  pw.created_at,
  pw.updated_at,
  'partner_withdrawal'::text AS movement_type,
  NULL::uuid AS client_id,
  NULL::uuid AS material_id,
  NULL::uuid AS personnel_id,
  NULL::uuid AS purchase_id,
  pw.partner_id,
  NULL::uuid AS general_cost_id,
  NULL::uuid AS financial_operation_id,
  '-1'::integer AS amount_sign,
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  COALESCE(c.full_name, c.company_name) AS entity_name,
  EXISTS (SELECT 1 FROM media_links ml WHERE ml.partner_withdrawal_id = pw.id) AS has_attachments
FROM
  partner_withdrawals pw
  LEFT JOIN organization_members om ON om.id = pw.created_by
  LEFT JOIN users u ON u.id = om.user_id
  LEFT JOIN capital_participants cp ON cp.id = pw.partner_id
  LEFT JOIN contacts c ON c.id = cp.contact_id
  LEFT JOIN wallets w ON w.id = pw.wallet_id
WHERE
  pw.is_deleted IS NOT TRUE

UNION ALL

SELECT
  gcp.id,
  gcp.organization_id,
  NULL::uuid AS project_id,
  gcp.amount,
  gcp.currency_id,
  COALESCE(gcp.exchange_rate, 1::numeric) AS exchange_rate,
  gcp.payment_date,
  COALESCE(gcp.notes, gcp.reference, 'Pago de gasto general'::text) AS description,
  gcp.reference,
  gcp.wallet_id,
  w.name AS wallet_name,
  gcp.status,
  gcp.created_by,
  gcp.created_at,
  gcp.updated_at,
  'general_cost_payment'::text AS movement_type,
  NULL::uuid AS client_id,
  NULL::uuid AS material_id,
  NULL::uuid AS personnel_id,
  NULL::uuid AS purchase_id,
  NULL::uuid AS partner_id,
  gcp.general_cost_id,
  NULL::uuid AS financial_operation_id,
  '-1'::integer AS amount_sign,
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  gc.name AS entity_name,
  EXISTS (SELECT 1 FROM media_links ml WHERE ml.general_cost_payment_id = gcp.id) AS has_attachments
FROM
  general_costs_payments gcp
  LEFT JOIN organization_members om ON om.id = gcp.created_by
  LEFT JOIN users u ON u.id = om.user_id
  LEFT JOIN general_costs gc ON gc.id = gcp.general_cost_id
  LEFT JOIN wallets w ON w.id = gcp.wallet_id
WHERE
  gcp.is_deleted IS NOT TRUE

UNION ALL

SELECT
  fom.id,
  fom.organization_id,
  fom.project_id,
  fom.amount,
  fom.currency_id,
  COALESCE(fom.exchange_rate, 1::numeric) AS exchange_rate,
  fo.operation_date AS payment_date,
  COALESCE(
    fo.description,
    CASE fo.type
      WHEN 'wallet_transfer'::text THEN 'Transferencia entre billeteras'::text
      WHEN 'currency_exchange'::text THEN 'Cambio de moneda'::text
      ELSE NULL::text
    END
  ) AS description,
  NULL::text AS reference,
  fom.wallet_id,
  w.name AS wallet_name,
  'completed'::text AS status,
  fom.created_by,
  fom.created_at,
  fom.updated_at,
  fo.type AS movement_type,
  NULL::uuid AS client_id,
  NULL::uuid AS material_id,
  NULL::uuid AS personnel_id,
  NULL::uuid AS purchase_id,
  NULL::uuid AS partner_id,
  NULL::uuid AS general_cost_id,
  fom.financial_operation_id,
  CASE fom.direction
    WHEN 'in'::text THEN 1
    WHEN 'out'::text THEN '-1'::integer
    ELSE NULL::integer
  END AS amount_sign,
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  CASE fo.type
    WHEN 'wallet_transfer'::text THEN 'Transferencia'::text
    WHEN 'currency_exchange'::text THEN 'Cambio de moneda'::text
    ELSE NULL::text
  END AS entity_name,
  FALSE AS has_attachments
FROM
  financial_operation_movements fom
  JOIN financial_operations fo ON fo.id = fom.financial_operation_id
  LEFT JOIN organization_members om ON om.id = fom.created_by
  LEFT JOIN users u ON u.id = om.user_id
  LEFT JOIN wallets w ON w.id = fom.wallet_id
WHERE
  fom.is_deleted IS NOT TRUE;
