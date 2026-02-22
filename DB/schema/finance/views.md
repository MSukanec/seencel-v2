# Database Schema (Auto-generated)
> Generated: 2026-02-22T17:21:28.968Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [FINANCE] Views (21)

### `finance.capital_ledger_view`

```sql
SELECT pc.id,
    pc.organization_id,
    pc.project_id,
    pc.partner_id,
    'contribution'::text AS movement_type,
    pc.amount AS signed_amount,
    pc.amount AS original_amount,
    pc.currency_id,
    pc.exchange_rate,
    pc.contribution_date AS movement_date,
    pc.notes,
    pc.reference,
    pc.wallet_id,
    pc.status,
    pc.created_by,
    pc.created_at,
    pc.is_deleted
   FROM finance.partner_contributions pc
  WHERE ((pc.status = 'confirmed'::text) AND ((pc.is_deleted = false) OR (pc.is_deleted IS NULL)))
UNION ALL
 SELECT pw.id,
    pw.organization_id,
    pw.project_id,
    pw.partner_id,
    'withdrawal'::text AS movement_type,
    (- pw.amount) AS signed_amount,
    pw.amount AS original_amount,
    pw.currency_id,
    pw.exchange_rate,
    pw.withdrawal_date AS movement_date,
    pw.notes,
    pw.reference,
    pw.wallet_id,
    pw.status,
    pw.created_by,
    pw.created_at,
    pw.is_deleted
   FROM finance.partner_withdrawals pw
  WHERE ((pw.status = 'confirmed'::text) AND ((pw.is_deleted = false) OR (pw.is_deleted IS NULL)))
UNION ALL
 SELECT ca.id,
    ca.organization_id,
    ca.project_id,
    ca.partner_id,
    'adjustment'::text AS movement_type,
    ca.amount AS signed_amount,
    abs(ca.amount) AS original_amount,
    ca.currency_id,
    ca.exchange_rate,
    ca.adjustment_date AS movement_date,
    ca.notes,
    ca.reference,
    NULL::uuid AS wallet_id,
    ca.status,
    ca.created_by,
    ca.created_at,
    ca.is_deleted
   FROM capital_adjustments ca
  WHERE ((ca.status = 'confirmed'::text) AND (ca.is_deleted = false));
```

### `finance.capital_organization_totals_view`

```sql
SELECT org.id AS organization_id,
    COALESCE(contributions.total, (0)::numeric) AS total_contributions,
    COALESCE(withdrawals.total, (0)::numeric) AS total_withdrawals,
    COALESCE(adjustments.total, (0)::numeric) AS total_adjustments,
    ((COALESCE(contributions.total, (0)::numeric) - COALESCE(withdrawals.total, (0)::numeric)) + COALESCE(adjustments.total, (0)::numeric)) AS total_net_capital,
    COALESCE(contributions.count, (0)::bigint) AS contributions_count,
    COALESCE(withdrawals.count, (0)::bigint) AS withdrawals_count,
    COALESCE(adjustments.count, (0)::bigint) AS adjustments_count
   FROM (((iam.organizations org
     LEFT JOIN ( SELECT partner_contributions.organization_id,
            sum(partner_contributions.amount) AS total,
            count(*) AS count
           FROM finance.partner_contributions
          WHERE ((partner_contributions.status = 'confirmed'::text) AND ((partner_contributions.is_deleted = false) OR (partner_contributions.is_deleted IS NULL)))
          GROUP BY partner_contributions.organization_id) contributions ON ((contributions.organization_id = org.id)))
     LEFT JOIN ( SELECT partner_withdrawals.organization_id,
            sum(partner_withdrawals.amount) AS total,
            count(*) AS count
           FROM finance.partner_withdrawals
          WHERE ((partner_withdrawals.status = 'confirmed'::text) AND ((partner_withdrawals.is_deleted = false) OR (partner_withdrawals.is_deleted IS NULL)))
          GROUP BY partner_withdrawals.organization_id) withdrawals ON ((withdrawals.organization_id = org.id)))
     LEFT JOIN ( SELECT capital_adjustments.organization_id,
            sum(capital_adjustments.amount) AS total,
            count(*) AS count
           FROM capital_adjustments
          WHERE ((capital_adjustments.status = 'confirmed'::text) AND (capital_adjustments.is_deleted = false))
          GROUP BY capital_adjustments.organization_id) adjustments ON ((adjustments.organization_id = org.id)));
```

### `finance.capital_participants_summary_view`

```sql
SELECT cp.id AS partner_id,
    cp.organization_id,
    cp.contact_id,
    cp.ownership_percentage,
    cp.status,
    cp.notes,
    cp.created_at,
    COALESCE(pb.total_contributed, (0)::numeric) AS total_contributed,
    COALESCE(pb.total_withdrawn, (0)::numeric) AS total_withdrawn,
    COALESCE(pb.total_adjusted, (0)::numeric) AS total_adjusted,
    COALESCE(pb.current_balance, (0)::numeric) AS current_balance,
    COALESCE(pb.contributions_count, (0)::bigint) AS contributions_count,
    COALESCE(pb.withdrawals_count, (0)::bigint) AS withdrawals_count,
    pb.last_movement_date
   FROM (finance.capital_participants cp
     LEFT JOIN finance.capital_partner_balances_view pb ON ((pb.partner_id = cp.id)))
  WHERE (cp.is_deleted = false);
```

### `finance.capital_partner_balances_view`

```sql
SELECT cp.id AS partner_id,
    cp.organization_id,
    cp.ownership_percentage,
    cp.status AS partner_status,
    COALESCE(contributions.total, (0)::numeric) AS total_contributed,
    COALESCE(withdrawals.total, (0)::numeric) AS total_withdrawn,
    COALESCE(adjustments.total, (0)::numeric) AS total_adjusted,
    ((COALESCE(contributions.total, (0)::numeric) - COALESCE(withdrawals.total, (0)::numeric)) + COALESCE(adjustments.total, (0)::numeric)) AS current_balance,
    COALESCE(contributions.count, (0)::bigint) AS contributions_count,
    COALESCE(withdrawals.count, (0)::bigint) AS withdrawals_count,
    COALESCE(adjustments.count, (0)::bigint) AS adjustments_count,
    GREATEST(contributions.last_date, withdrawals.last_date, adjustments.last_date) AS last_movement_date
   FROM (((finance.capital_participants cp
     LEFT JOIN ( SELECT partner_contributions.partner_id,
            sum(partner_contributions.amount) AS total,
            count(*) AS count,
            max(partner_contributions.contribution_date) AS last_date
           FROM finance.partner_contributions
          WHERE ((partner_contributions.status = 'confirmed'::text) AND ((partner_contributions.is_deleted = false) OR (partner_contributions.is_deleted IS NULL)))
          GROUP BY partner_contributions.partner_id) contributions ON ((contributions.partner_id = cp.id)))
     LEFT JOIN ( SELECT partner_withdrawals.partner_id,
            sum(partner_withdrawals.amount) AS total,
            count(*) AS count,
            max(partner_withdrawals.withdrawal_date) AS last_date
           FROM finance.partner_withdrawals
          WHERE ((partner_withdrawals.status = 'confirmed'::text) AND ((partner_withdrawals.is_deleted = false) OR (partner_withdrawals.is_deleted IS NULL)))
          GROUP BY partner_withdrawals.partner_id) withdrawals ON ((withdrawals.partner_id = cp.id)))
     LEFT JOIN ( SELECT capital_adjustments.partner_id,
            sum(capital_adjustments.amount) AS total,
            count(*) AS count,
            max(capital_adjustments.adjustment_date) AS last_date
           FROM capital_adjustments
          WHERE ((capital_adjustments.status = 'confirmed'::text) AND (capital_adjustments.is_deleted = false))
          GROUP BY capital_adjustments.partner_id) adjustments ON ((adjustments.partner_id = cp.id)))
  WHERE (cp.is_deleted = false);
```

### `finance.capital_partner_kpi_view`

```sql
SELECT pb.partner_id,
    pb.organization_id,
    pb.ownership_percentage,
    pb.partner_status,
    pb.total_contributed,
    pb.total_withdrawn,
    pb.total_adjusted,
    pb.current_balance,
    ot.total_contributions AS org_total_contributions,
    ot.total_withdrawals AS org_total_withdrawals,
    ot.total_adjustments AS org_total_adjustments,
    ot.total_net_capital AS org_total_net_capital,
        CASE
            WHEN ((pb.ownership_percentage IS NOT NULL) AND (pb.ownership_percentage > (0)::numeric)) THEN (ot.total_contributions * (pb.ownership_percentage / (100)::numeric))
            ELSE NULL::numeric
        END AS expected_contribution,
        CASE
            WHEN ((pb.ownership_percentage IS NOT NULL) AND (pb.ownership_percentage > (0)::numeric)) THEN (ot.total_net_capital * (pb.ownership_percentage / (100)::numeric))
            ELSE NULL::numeric
        END AS expected_net_capital,
        CASE
            WHEN ((pb.ownership_percentage IS NOT NULL) AND (pb.ownership_percentage > (0)::numeric)) THEN (pb.total_contributed - (ot.total_contributions * (pb.ownership_percentage / (100)::numeric)))
            ELSE NULL::numeric
        END AS deviation_contribution,
        CASE
            WHEN ((pb.ownership_percentage IS NOT NULL) AND (pb.ownership_percentage > (0)::numeric)) THEN (pb.current_balance - (ot.total_net_capital * (pb.ownership_percentage / (100)::numeric)))
            ELSE NULL::numeric
        END AS deviation_net,
        CASE
            WHEN (ot.total_net_capital > (0)::numeric) THEN (pb.current_balance / ot.total_net_capital)
            ELSE NULL::numeric
        END AS real_ownership_ratio,
        CASE
            WHEN ((pb.ownership_percentage IS NULL) OR (pb.ownership_percentage = (0)::numeric)) THEN 'sin_porcentaje'::text
            WHEN ((pb.total_contributed - (ot.total_contributions * (pb.ownership_percentage / (100)::numeric))) > (0)::numeric) THEN 'sobre_aportado'::text
            WHEN ((pb.total_contributed - (ot.total_contributions * (pb.ownership_percentage / (100)::numeric))) < (0)::numeric) THEN 'bajo_aportado'::text
            ELSE 'equilibrado'::text
        END AS contribution_status,
        CASE
            WHEN ((pb.ownership_percentage IS NULL) OR (pb.ownership_percentage = (0)::numeric)) THEN 'sin_porcentaje'::text
            WHEN ((pb.current_balance - (ot.total_net_capital * (pb.ownership_percentage / (100)::numeric))) > (0)::numeric) THEN 'arriba'::text
            WHEN ((pb.current_balance - (ot.total_net_capital * (pb.ownership_percentage / (100)::numeric))) < (0)::numeric) THEN 'abajo'::text
            ELSE 'equilibrado'::text
        END AS net_status,
    pb.contributions_count,
    pb.withdrawals_count,
    pb.adjustments_count,
    pb.last_movement_date
   FROM (finance.capital_partner_balances_view pb
     LEFT JOIN finance.capital_organization_totals_view ot ON ((ot.organization_id = pb.organization_id)));
```

### `finance.client_financial_summary_view`

```sql
WITH commitment_totals AS (
         SELECT client_commitments.client_id,
            client_commitments.currency_id,
            sum(client_commitments.amount) AS total_committed,
            max(client_commitments.exchange_rate) AS exchange_rate
           FROM finance.client_commitments
          WHERE (client_commitments.is_deleted = false)
          GROUP BY client_commitments.client_id, client_commitments.currency_id
        ), payment_totals AS (
         SELECT client_payments.client_id,
            client_payments.currency_id,
            sum(client_payments.amount) AS total_paid
           FROM finance.client_payments
          WHERE ((client_payments.status = 'confirmed'::text) AND (client_payments.is_deleted = false))
          GROUP BY client_payments.client_id, client_payments.currency_id
        )
 SELECT pc.id AS client_id,
    pc.project_id,
    pc.organization_id,
    cur.id AS currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(ct.total_committed, (0)::numeric) AS total_committed_amount,
    COALESCE(pt.total_paid, (0)::numeric) AS total_paid_amount,
    (COALESCE(ct.total_committed, (0)::numeric) - COALESCE(pt.total_paid, (0)::numeric)) AS balance_due,
    ct.exchange_rate AS commitment_exchange_rate
   FROM (((projects.project_clients pc
     CROSS JOIN finance.currencies cur)
     LEFT JOIN commitment_totals ct ON (((ct.client_id = pc.id) AND (ct.currency_id = cur.id))))
     LEFT JOIN payment_totals pt ON (((pt.client_id = pc.id) AND (pt.currency_id = cur.id))))
  WHERE ((pc.is_deleted = false) AND ((ct.total_committed > (0)::numeric) OR (pt.total_paid > (0)::numeric)));
```

### `finance.client_payments_view`

```sql
SELECT cp.id,
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
    cp.updated_at,
    cp.is_deleted,
    date_trunc('month'::text, (cp.payment_date)::timestamp with time zone) AS payment_month,
    c.full_name AS client_name,
    c.first_name AS client_first_name,
    c.last_name AS client_last_name,
    c.company_name AS client_company_name,
    c.email AS client_email,
    c.phone AS client_phone,
    cr.name AS client_role_name,
    c.image_url AS client_image_url,
    u_client.avatar_url AS client_linked_user_avatar_url,
    COALESCE(u_client.avatar_url, c.image_url) AS client_avatar_url,
    w.name AS wallet_name,
    cur.symbol AS currency_symbol,
    cur.code AS currency_code,
    cc.concept AS commitment_concept,
    cps.notes AS schedule_notes,
    u_creator.full_name AS creator_full_name,
    u_creator.avatar_url AS creator_avatar_url,
    p.name AS project_name,
    p.image_url AS project_image_url,
    p.color AS project_color
   FROM ((((((((((((finance.client_payments cp
     LEFT JOIN projects.project_clients pc ON ((pc.id = cp.client_id)))
     LEFT JOIN projects.contacts c ON ((c.id = pc.contact_id)))
     LEFT JOIN iam.users u_client ON ((u_client.id = c.linked_user_id)))
     LEFT JOIN projects.client_roles cr ON ((cr.id = pc.client_role_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = cp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.currencies cur ON ((cur.id = cp.currency_id)))
     LEFT JOIN finance.client_commitments cc ON ((cc.id = cp.commitment_id)))
     LEFT JOIN finance.client_payment_schedule cps ON ((cps.id = cp.schedule_id)))
     LEFT JOIN iam.organization_members om ON ((om.id = cp.created_by)))
     LEFT JOIN iam.users u_creator ON ((u_creator.id = om.user_id)))
     LEFT JOIN projects.projects p ON ((p.id = cp.project_id)))
  WHERE (cp.is_deleted = false);
```

### `finance.general_costs_by_category_view`

```sql
SELECT gcp.organization_id,
    date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone) AS payment_month,
    gc.category_id,
    gcc.name AS category_name,
    sum(gcp.amount) AS total_amount
   FROM ((finance.general_costs_payments gcp
     LEFT JOIN finance.general_costs gc ON ((gc.id = gcp.general_cost_id)))
     LEFT JOIN finance.general_cost_categories gcc ON ((gcc.id = gc.category_id)))
  WHERE (gcp.is_deleted = false)
  GROUP BY gcp.organization_id, (date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone)), gc.category_id, gcc.name;
```

### `finance.general_costs_monthly_summary_view`

```sql
SELECT gcp.organization_id,
    date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone) AS payment_month,
    sum(gcp.amount) AS total_amount,
    count(*) AS payments_count
   FROM finance.general_costs_payments gcp
  WHERE (gcp.is_deleted = false)
  GROUP BY gcp.organization_id, (date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone));
```

### `finance.general_costs_payments_view`

```sql
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
    gcc.id AS category_id,
    gcc.name AS category_name,
    gcp.created_by,
    u.full_name AS creator_full_name,
    u.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.general_cost_payment_id = gcp.id))) AS has_attachments
   FROM ((((((finance.general_costs_payments gcp
     LEFT JOIN finance.general_costs gc ON ((gc.id = gcp.general_cost_id)))
     LEFT JOIN finance.general_cost_categories gcc ON ((gcc.id = gc.category_id)))
     LEFT JOIN iam.organization_members om ON ((om.id = gcp.created_by)))
     LEFT JOIN iam.users u ON ((u.id = om.user_id)))
     LEFT JOIN finance.wallets w ON ((w.id = gcp.wallet_id)))
     LEFT JOIN finance.currencies cur ON ((cur.id = gcp.currency_id)))
  WHERE (gcp.is_deleted = false);
```

### `finance.labor_by_type_view`

```sql
SELECT lp.organization_id,
    lp.project_id,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    pl.labor_type_id,
    lt.name AS labor_type_name,
    sum((lp.amount * lp.exchange_rate)) AS total_functional_amount,
    count(*) AS payments_count
   FROM ((finance.labor_payments lp
     LEFT JOIN projects.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN catalog.labor_categories lt ON ((lt.id = pl.labor_type_id)))
  WHERE ((lp.status = 'confirmed'::text) AND ((lp.is_deleted IS NULL) OR (lp.is_deleted = false)))
  GROUP BY lp.organization_id, lp.project_id, (date_trunc('month'::text, (lp.payment_date)::timestamp with time zone)), pl.labor_type_id, lt.name;
```

### `finance.labor_monthly_summary_view`

```sql
SELECT lp.organization_id,
    lp.project_id,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    sum((lp.amount * lp.exchange_rate)) AS total_functional_amount,
    count(*) AS payments_count,
    count(DISTINCT lp.labor_id) AS unique_workers_count
   FROM finance.labor_payments lp
  WHERE ((lp.status = 'confirmed'::text) AND ((lp.is_deleted IS NULL) OR (lp.is_deleted = false)))
  GROUP BY lp.organization_id, lp.project_id, (date_trunc('month'::text, (lp.payment_date)::timestamp with time zone));
```

### `finance.labor_payments_view`

```sql
SELECT lp.id,
    lp.organization_id,
    lp.project_id,
    lp.labor_id,
    lp.payment_date,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    lp.amount,
    lp.currency_id,
    lp.exchange_rate,
    lp.status,
    lp.wallet_id,
    lp.notes,
    lp.reference,
    lp.created_at,
    lp.updated_at,
    lp.created_by,
    lp.updated_by,
    lp.is_deleted,
    lp.deleted_at,
    lp.import_batch_id,
    (lp.amount * lp.exchange_rate) AS functional_amount,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    cur.name AS currency_name,
    ow.id AS org_wallet_id,
    w.name AS wallet_name,
    pl.contact_id,
    pl.labor_type_id,
    pl.status AS labor_status,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    ct.national_id AS contact_national_id,
    ct.phone AS contact_phone,
    ct.email AS contact_email,
    ct.image_url AS contact_image_url,
    lc.name AS labor_type_name,
    proj.name AS project_name,
    om_created.id AS creator_member_id,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.labor_payment_id = lp.id))) AS has_attachments
   FROM (((((((((finance.labor_payments lp
     LEFT JOIN finance.currencies cur ON ((cur.id = lp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = lp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN projects.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN projects.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = lp.project_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = lp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((lp.is_deleted = false) OR (lp.is_deleted IS NULL));
```

### `finance.material_invoices_view`

```sql
SELECT inv.id,
    inv.organization_id,
    inv.project_id,
    inv.purchase_order_id,
    inv.invoice_number,
    inv.document_type,
    inv.purchase_date,
    inv.subtotal,
    inv.tax_amount,
    inv.total_amount,
    inv.currency_id,
    c.symbol AS currency_symbol,
    c.code AS currency_code,
    inv.exchange_rate,
    inv.status,
    inv.notes,
    inv.provider_id,
    COALESCE(prov.company_name, ((prov.first_name || ' '::text) || prov.last_name)) AS provider_name,
    p.name AS project_name,
    po.order_number AS po_number,
    inv.created_at,
    inv.updated_at,
    inv.created_by,
    COALESCE(items.item_count, (0)::bigint) AS item_count
   FROM (((((finance.material_invoices inv
     LEFT JOIN finance.currencies c ON ((c.id = inv.currency_id)))
     LEFT JOIN projects.contacts prov ON ((prov.id = inv.provider_id)))
     LEFT JOIN projects.projects p ON ((p.id = inv.project_id)))
     LEFT JOIN finance.material_purchase_orders po ON ((po.id = inv.purchase_order_id)))
     LEFT JOIN LATERAL ( SELECT count(*) AS item_count
           FROM finance.material_invoice_items ii
          WHERE (ii.invoice_id = inv.id)) items ON (true));
```

### `finance.material_payments_view`

```sql
SELECT mp.id,
    mp.organization_id,
    mp.project_id,
    mp.payment_date,
    date_trunc('month'::text, (mp.payment_date)::timestamp with time zone) AS payment_month,
    mp.amount,
    mp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(mp.exchange_rate, (1)::numeric) AS exchange_rate,
    mp.status,
    mp.wallet_id,
    w.name AS wallet_name,
    mp.notes,
    mp.reference,
    mp.purchase_id,
    mi.invoice_number,
    mi.provider_id,
    COALESCE(prov.company_name, ((prov.first_name || ' '::text) || prov.last_name)) AS provider_name,
    p.name AS project_name,
    mp.material_type_id,
    mt.name AS material_type_name,
    mp.created_by,
    u.full_name AS creator_full_name,
    u.avatar_url AS creator_avatar_url,
    mp.created_at,
    mp.updated_at,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.material_payment_id = mp.id))) AS has_attachments
   FROM (((((((((finance.material_payments mp
     LEFT JOIN finance.material_invoices mi ON ((mi.id = mp.purchase_id)))
     LEFT JOIN projects.contacts prov ON ((prov.id = mi.provider_id)))
     LEFT JOIN projects.projects p ON ((p.id = mp.project_id)))
     LEFT JOIN iam.organization_members om ON ((om.id = mp.created_by)))
     LEFT JOIN iam.users u ON ((u.id = om.user_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = mp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.currencies cur ON ((cur.id = mp.currency_id)))
     LEFT JOIN material_types mt ON ((mt.id = mp.material_type_id)))
  WHERE ((mp.is_deleted = false) OR (mp.is_deleted IS NULL));
```

### `finance.material_purchase_orders_view`

```sql
SELECT po.id,
    po.organization_id,
    po.project_id,
    po.order_number,
    po.order_date,
    po.expected_delivery_date,
    po.status,
    po.notes,
    po.subtotal,
    po.tax_amount,
    (po.subtotal + po.tax_amount) AS total,
    po.currency_id,
    c.symbol AS currency_symbol,
    c.code AS currency_code,
    po.provider_id,
    COALESCE(prov.company_name, ((prov.first_name || ' '::text) || prov.last_name)) AS provider_name,
    p.name AS project_name,
    po.created_at,
    po.updated_at,
    po.is_deleted,
    COALESCE(items.item_count, (0)::bigint) AS item_count
   FROM ((((finance.material_purchase_orders po
     LEFT JOIN finance.currencies c ON ((c.id = po.currency_id)))
     LEFT JOIN projects.contacts prov ON ((prov.id = po.provider_id)))
     LEFT JOIN projects.projects p ON ((p.id = po.project_id)))
     LEFT JOIN LATERAL ( SELECT count(*) AS item_count
           FROM finance.material_purchase_order_items poi
          WHERE (poi.purchase_order_id = po.id)) items ON (true))
  WHERE (po.is_deleted = false);
```

### `finance.organization_currencies_view`

```sql
SELECT oc.id,
    oc.organization_id,
    oc.currency_id,
    oc.is_active,
    oc.is_default,
    oc.is_deleted,
    oc.deleted_at,
    oc.created_at,
    oc.updated_at,
    c.code AS currency_code,
    c.name AS currency_name,
    c.symbol AS currency_symbol,
    c.country AS currency_country
   FROM (finance.organization_currencies oc
     LEFT JOIN finance.currencies c ON ((oc.currency_id = c.id)));
```

### `finance.organization_wallets_view`

```sql
SELECT ow.id,
    ow.organization_id,
    ow.wallet_id,
    ow.is_active,
    ow.is_default,
    ow.is_deleted,
    ow.deleted_at,
    ow.created_at,
    ow.updated_at,
    ow.created_by,
    w.name AS wallet_name,
    w.is_active AS wallet_is_active,
    w.created_at AS wallet_created_at
   FROM (finance.organization_wallets ow
     LEFT JOIN finance.wallets w ON ((ow.wallet_id = w.id)));
```

### `finance.subcontract_payments_view`

```sql
SELECT sp.id,
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
    date_trunc('month'::text, (sp.payment_date)::timestamp with time zone) AS payment_month,
    s.title AS subcontract_title,
    s.code AS subcontract_code,
    s.status AS subcontract_status,
    s.amount_total AS subcontract_amount_total,
    c.id AS provider_id,
    c.full_name AS provider_name,
    c.first_name AS provider_first_name,
    c.last_name AS provider_last_name,
    c.company_name AS provider_company_name,
    c.email AS provider_email,
    c.phone AS provider_phone,
    c.image_url AS provider_image_url,
    c.linked_user_id AS provider_linked_user_id,
    COALESCE(u.avatar_url, c.image_url) AS provider_avatar_url,
    w.name AS wallet_name,
    cur.symbol AS currency_symbol,
    cur.code AS currency_code,
    cur.name AS currency_name
   FROM ((((((finance.subcontract_payments sp
     LEFT JOIN finance.subcontracts s ON ((s.id = sp.subcontract_id)))
     LEFT JOIN projects.contacts c ON ((c.id = s.contact_id)))
     LEFT JOIN iam.users u ON ((u.id = c.linked_user_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = sp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.currencies cur ON ((cur.id = sp.currency_id)))
  WHERE (sp.is_deleted = false);
```

### `finance.subcontracts_view`

```sql
SELECT s.id,
    s.organization_id,
    s.project_id,
    s.title,
    s.amount_total,
    s.currency_id,
    c.code AS currency_code,
    c.symbol AS currency_symbol,
    s.exchange_rate,
    s.date,
    s.status,
    s.notes,
    ct.id AS provider_id,
    COALESCE(ct.full_name, ct.company_name) AS provider_name,
    ct.image_url AS provider_image,
    s.created_at,
    s.updated_at,
    s.is_deleted,
    s.adjustment_index_type_id,
    s.base_period_year,
    s.base_period_month,
    s.base_index_value
   FROM ((finance.subcontracts s
     LEFT JOIN projects.contacts ct ON ((s.contact_id = ct.id)))
     LEFT JOIN finance.currencies c ON ((s.currency_id = c.id)))
  WHERE (s.is_deleted = false);
```

### `finance.unified_financial_movements_view`

```sql
SELECT gcp.id,
    'general_cost'::text AS movement_type,
    gcp.organization_id,
    NULL::uuid AS project_id,
    gcp.payment_date,
    date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone) AS payment_month,
    gcp.amount,
    gcp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(gcp.exchange_rate, (1)::numeric) AS exchange_rate,
    (gcp.amount * COALESCE(gcp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    gcp.status,
    gcp.wallet_id,
    w.name AS wallet_name,
    gc.name AS concept_name,
    gcc.name AS category_name,
    NULL::text AS contact_name,
    gcp.notes,
    gcp.reference,
    gcp.created_at,
    gcp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.general_cost_payment_id = gcp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM (((((((finance.general_costs_payments gcp
     LEFT JOIN finance.currencies cur ON ((cur.id = gcp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = gcp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.general_costs gc ON ((gc.id = gcp.general_cost_id)))
     LEFT JOIN finance.general_cost_categories gcc ON ((gcc.id = gc.category_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = gcp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE (gcp.is_deleted = false)
UNION ALL
 SELECT mp.id,
    'material_payment'::text AS movement_type,
    mp.organization_id,
    mp.project_id,
    mp.payment_date,
    date_trunc('month'::text, (mp.payment_date)::timestamp with time zone) AS payment_month,
    mp.amount,
    mp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(mp.exchange_rate, (1)::numeric) AS exchange_rate,
    (mp.amount * COALESCE(mp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    mp.status,
    mp.wallet_id,
    w.name AS wallet_name,
    mt.name AS concept_name,
    NULL::text AS category_name,
    COALESCE(prov.company_name, ((prov.first_name || ' '::text) || prov.last_name)) AS contact_name,
    mp.notes,
    mp.reference,
    mp.created_at,
    mp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.material_payment_id = mp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM ((((((((finance.material_payments mp
     LEFT JOIN finance.currencies cur ON ((cur.id = mp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = mp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN material_types mt ON ((mt.id = mp.material_type_id)))
     LEFT JOIN finance.material_invoices mi ON ((mi.id = mp.purchase_id)))
     LEFT JOIN projects.contacts prov ON ((prov.id = mi.provider_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = mp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((mp.is_deleted = false) OR (mp.is_deleted IS NULL))
UNION ALL
 SELECT lp.id,
    'labor_payment'::text AS movement_type,
    lp.organization_id,
    lp.project_id,
    lp.payment_date,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    lp.amount,
    lp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(lp.exchange_rate, (1)::numeric) AS exchange_rate,
    (lp.amount * COALESCE(lp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    lp.status,
    lp.wallet_id,
    w.name AS wallet_name,
    lc.name AS concept_name,
    NULL::text AS category_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_name,
    lp.notes,
    lp.reference,
    lp.created_at,
    lp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.labor_payment_id = lp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM ((((((((finance.labor_payments lp
     LEFT JOIN finance.currencies cur ON ((cur.id = lp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = lp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN projects.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN projects.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = lp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((lp.is_deleted = false) OR (lp.is_deleted IS NULL))
UNION ALL
 SELECT sp.id,
    'subcontract_payment'::text AS movement_type,
    sp.organization_id,
    sp.project_id,
    sp.payment_date,
    date_trunc('month'::text, (sp.payment_date)::timestamp with time zone) AS payment_month,
    sp.amount,
    sp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(sp.exchange_rate, (1)::numeric) AS exchange_rate,
    (sp.amount * COALESCE(sp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    sp.status,
    sp.wallet_id,
    w.name AS wallet_name,
    s.title AS concept_name,
    NULL::text AS category_name,
    COALESCE(ct.full_name, ct.company_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_name,
    sp.notes,
    sp.reference,
    sp.created_at,
    sp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.subcontract_payment_id = sp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM (((((((finance.subcontract_payments sp
     LEFT JOIN finance.currencies cur ON ((cur.id = sp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = sp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.subcontracts s ON ((s.id = sp.subcontract_id)))
     LEFT JOIN projects.contacts ct ON ((ct.id = s.contact_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = sp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((sp.is_deleted = false) OR (sp.is_deleted IS NULL))
UNION ALL
 SELECT cp.id,
    'client_payment'::text AS movement_type,
    cp.organization_id,
    cp.project_id,
    cp.payment_date,
    date_trunc('month'::text, (cp.payment_date)::timestamp with time zone) AS payment_month,
    cp.amount,
    cp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(cp.exchange_rate, (1)::numeric) AS exchange_rate,
    (cp.amount * COALESCE(cp.exchange_rate, (1)::numeric)) AS functional_amount,
    1 AS amount_sign,
    cp.status,
    cp.wallet_id,
    w.name AS wallet_name,
    cc.concept AS concept_name,
    NULL::text AS category_name,
    COALESCE(ct.full_name, ct.company_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_name,
    cp.notes,
    cp.reference,
    cp.created_at,
    cp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.client_payment_id = cp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM ((((((((finance.client_payments cp
     LEFT JOIN finance.currencies cur ON ((cur.id = cp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = cp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN projects.project_clients pc ON ((pc.id = cp.client_id)))
     LEFT JOIN projects.contacts ct ON ((ct.id = pc.contact_id)))
     LEFT JOIN finance.client_commitments cc ON ((cc.id = cp.commitment_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = cp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((cp.is_deleted = false) OR (cp.is_deleted IS NULL))
UNION ALL
 SELECT fo.id,
    'currency_exchange'::text AS movement_type,
    fo.organization_id,
    fo.project_id,
    fo.operation_date AS payment_date,
    date_trunc('month'::text, (fo.operation_date)::timestamp with time zone) AS payment_month,
    fom_out.amount,
    fom_out.currency_id,
    cur_out.code AS currency_code,
    cur_out.symbol AS currency_symbol,
    COALESCE(fom_out.exchange_rate, (1)::numeric) AS exchange_rate,
    (fom_out.amount * COALESCE(fom_out.exchange_rate, (1)::numeric)) AS functional_amount,
    0 AS amount_sign,
    'confirmed'::text AS status,
    fom_out.wallet_id,
    w_out.name AS wallet_name,
    concat(w_out.name, ' → ', w_in.name) AS concept_name,
    NULL::text AS category_name,
    NULL::text AS contact_name,
    fo.description AS notes,
    NULL::text AS reference,
    fo.created_at,
    fo.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    false AS has_attachments,
    fom_in.amount AS to_amount,
    cur_in.code AS to_currency_code,
    cur_in.symbol AS to_currency_symbol,
    w_in.name AS to_wallet_name
   FROM ((((((((((financial_operations fo
     LEFT JOIN financial_operation_movements fom_out ON (((fom_out.financial_operation_id = fo.id) AND (fom_out.direction = 'out'::text) AND ((fom_out.is_deleted = false) OR (fom_out.is_deleted IS NULL)))))
     LEFT JOIN financial_operation_movements fom_in ON (((fom_in.financial_operation_id = fo.id) AND (fom_in.direction = 'in'::text) AND ((fom_in.is_deleted = false) OR (fom_in.is_deleted IS NULL)))))
     LEFT JOIN finance.currencies cur_out ON ((cur_out.id = fom_out.currency_id)))
     LEFT JOIN finance.currencies cur_in ON ((cur_in.id = fom_in.currency_id)))
     LEFT JOIN finance.organization_wallets ow_out ON ((ow_out.id = fom_out.wallet_id)))
     LEFT JOIN finance.wallets w_out ON ((w_out.id = ow_out.wallet_id)))
     LEFT JOIN finance.organization_wallets ow_in ON ((ow_in.id = fom_in.wallet_id)))
     LEFT JOIN finance.wallets w_in ON ((w_in.id = ow_in.wallet_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = fo.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((fo.type = 'currency_exchange'::text) AND (fo.is_deleted = false))
UNION ALL
 SELECT fo.id,
    'wallet_transfer'::text AS movement_type,
    fo.organization_id,
    fo.project_id,
    fo.operation_date AS payment_date,
    date_trunc('month'::text, (fo.operation_date)::timestamp with time zone) AS payment_month,
    fom_out.amount,
    fom_out.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(fom_out.exchange_rate, (1)::numeric) AS exchange_rate,
    (fom_out.amount * COALESCE(fom_out.exchange_rate, (1)::numeric)) AS functional_amount,
    0 AS amount_sign,
    'confirmed'::text AS status,
    fom_out.wallet_id,
    w_out.name AS wallet_name,
    concat(w_out.name, ' → ', w_in.name) AS concept_name,
    NULL::text AS category_name,
    NULL::text AS contact_name,
    fo.description AS notes,
    NULL::text AS reference,
    fo.created_at,
    fo.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    false AS has_attachments,
    fom_in.amount AS to_amount,
    cur.code AS to_currency_code,
    cur.symbol AS to_currency_symbol,
    w_in.name AS to_wallet_name
   FROM (((((((((financial_operations fo
     LEFT JOIN financial_operation_movements fom_out ON (((fom_out.financial_operation_id = fo.id) AND (fom_out.direction = 'out'::text) AND ((fom_out.is_deleted = false) OR (fom_out.is_deleted IS NULL)))))
     LEFT JOIN financial_operation_movements fom_in ON (((fom_in.financial_operation_id = fo.id) AND (fom_in.direction = 'in'::text) AND ((fom_in.is_deleted = false) OR (fom_in.is_deleted IS NULL)))))
     LEFT JOIN finance.currencies cur ON ((cur.id = fom_out.currency_id)))
     LEFT JOIN finance.organization_wallets ow_out ON ((ow_out.id = fom_out.wallet_id)))
     LEFT JOIN finance.wallets w_out ON ((w_out.id = ow_out.wallet_id)))
     LEFT JOIN finance.organization_wallets ow_in ON ((ow_in.id = fom_in.wallet_id)))
     LEFT JOIN finance.wallets w_in ON ((w_in.id = ow_in.wallet_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = fo.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((fo.type = 'wallet_transfer'::text) AND (fo.is_deleted = false));
```
