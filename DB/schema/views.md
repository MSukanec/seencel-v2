# Database Schema (Auto-generated)
> Generated: 2026-02-18T00:12:14.206Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Views (77)

### `admin_organizations_view`

```sql
SELECT o.id,
    o.name,
    o.logo_url,
    o.created_at,
    o.updated_at,
    o.is_active,
    o.is_deleted,
    o.is_demo,
    o.settings,
    o.purchased_seats,
    ow.full_name AS owner_name,
    ow.email AS owner_email,
    pl.name AS plan_name,
    pl.slug AS plan_slug,
    COALESCE(mc.member_count, 0) AS member_count,
    COALESCE(pc.project_count, 0) AS project_count,
    al.last_activity_at
   FROM (((((organizations o
     LEFT JOIN users ow ON ((ow.id = o.owner_id)))
     LEFT JOIN plans pl ON ((pl.id = o.plan_id)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS member_count
           FROM organization_members om
          WHERE ((om.organization_id = o.id) AND (om.is_active = true))) mc ON (true))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS project_count
           FROM projects p
          WHERE ((p.organization_id = o.id) AND (p.is_deleted = false))) pc ON (true))
     LEFT JOIN LATERAL ( SELECT max(oal.created_at) AS last_activity_at
           FROM organization_activity_logs oal
          WHERE (oal.organization_id = o.id)) al ON (true))
  WHERE (o.is_deleted = false);
```

### `admin_users`

```sql
SELECT users.auth_id
   FROM users
  WHERE (users.role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid);
```

### `analytics_at_risk_users_view`

```sql
SELECT analytics_user_session_summary_view.id,
    analytics_user_session_summary_view.full_name,
    analytics_user_session_summary_view.avatar_url,
    analytics_user_session_summary_view.created_at,
    analytics_user_session_summary_view.session_count,
    analytics_user_session_summary_view.last_activity_at
   FROM analytics_user_session_summary_view
  WHERE ((analytics_user_session_summary_view.created_at < (now() - '7 days'::interval)) AND (analytics_user_session_summary_view.session_count < 3))
  ORDER BY analytics_user_session_summary_view.session_count, analytics_user_session_summary_view.last_activity_at NULLS FIRST
 LIMIT 10;
```

### `analytics_bounce_rate_view`

```sql
WITH session_pages AS (
         SELECT h.session_id,
            count(*) AS page_count
           FROM (user_view_history h
             JOIN users u ON ((u.id = h.user_id)))
          WHERE ((h.session_id IS NOT NULL) AND (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid))
          GROUP BY h.session_id
        )
 SELECT count(*) FILTER (WHERE (session_pages.page_count = 1)) AS bounced_sessions,
    count(*) AS total_sessions,
    round((((count(*) FILTER (WHERE (session_pages.page_count = 1)))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 1) AS bounce_rate_percent
   FROM session_pages;
```

### `analytics_general_kpis_view`

```sql
SELECT ( SELECT count(*) AS count
           FROM organizations
          WHERE (organizations.is_active = true)) AS total_organizations,
    ( SELECT count(*) AS count
           FROM projects
          WHERE (projects.is_deleted = false)) AS total_projects,
    ( SELECT count(*) AS count
           FROM users
          WHERE ((users.is_active = true) AND (users.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid))) AS total_users;
```

### `analytics_hourly_activity_view`

```sql
SELECT EXTRACT(hour FROM up.last_seen_at) AS hour_of_day,
    count(*) AS activity_count
   FROM (user_presence up
     JOIN users u ON ((u.id = up.user_id)))
  WHERE ((up.last_seen_at > (now() - '7 days'::interval)) AND (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid))
  GROUP BY (EXTRACT(hour FROM up.last_seen_at))
  ORDER BY (EXTRACT(hour FROM up.last_seen_at));
```

### `analytics_page_engagement_view`

```sql
SELECT h.view_name,
    count(*) AS visits,
    avg(h.duration_seconds) AS avg_duration,
    count(DISTINCT h.session_id) AS unique_sessions
   FROM (user_view_history h
     JOIN users u ON ((u.id = h.user_id)))
  WHERE (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)
  GROUP BY h.view_name;
```

### `analytics_realtime_overview_view`

```sql
SELECT count(*) AS active_users
   FROM (user_presence up
     JOIN users u ON ((u.id = up.user_id)))
  WHERE ((up.last_seen_at > (now() - '00:05:00'::interval)) AND (up.status = 'online'::text) AND (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid));
```

### `analytics_session_duration_view`

```sql
SELECT round(avg(sessions.total_duration), 0) AS avg_duration_seconds,
    round((avg(sessions.total_duration) / (60)::numeric), 1) AS avg_duration_minutes,
    count(*) AS total_sessions
   FROM ( SELECT h.session_id,
            sum(h.duration_seconds) AS total_duration
           FROM (user_view_history h
             JOIN users u ON ((u.id = h.user_id)))
          WHERE ((h.session_id IS NOT NULL) AND (h.duration_seconds IS NOT NULL) AND (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid))
          GROUP BY h.session_id) sessions;
```

### `analytics_session_quality_view`

```sql
WITH session_stats AS (
         SELECT h.session_id,
            h.user_id,
            min(h.entered_at) AS session_start,
            max(h.exited_at) AS session_end,
            count(*) AS views_count,
            sum(h.duration_seconds) AS total_duration
           FROM (user_view_history h
             JOIN users u ON ((u.id = h.user_id)))
          WHERE ((h.session_id IS NOT NULL) AND (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid))
          GROUP BY h.session_id, h.user_id
        )
 SELECT session_stats.session_id,
    session_stats.user_id,
    session_stats.session_start,
    session_stats.total_duration,
    session_stats.views_count,
        CASE
            WHEN ((session_stats.views_count = 1) AND (session_stats.total_duration < 10)) THEN true
            ELSE false
        END AS is_bounce
   FROM session_stats;
```

### `analytics_top_users_view`

```sql
SELECT u.id,
    u.full_name,
    u.avatar_url,
    count(DISTINCT h.session_id) AS total_sessions,
    count(*) AS total_pageviews,
    COALESCE(sum(h.duration_seconds), (0)::bigint) AS total_time_seconds
   FROM (users u
     JOIN user_view_history h ON ((h.user_id = u.id)))
  WHERE (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)
  GROUP BY u.id, u.full_name, u.avatar_url
  ORDER BY (count(*)) DESC;
```

### `analytics_user_growth_view`

```sql
SELECT date_trunc('day'::text, users.created_at) AS date,
    count(*) AS new_users
   FROM users
  WHERE (users.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)
  GROUP BY (date_trunc('day'::text, users.created_at))
  ORDER BY (date_trunc('day'::text, users.created_at)) DESC;
```

### `analytics_user_journeys_view`

```sql
SELECT h.session_id,
    u.id AS user_id,
    u.full_name,
    u.avatar_url,
    h.view_name,
    h.entered_at,
    h.exited_at,
    h.duration_seconds,
    row_number() OVER (PARTITION BY h.session_id ORDER BY h.entered_at) AS step_number
   FROM (user_view_history h
     JOIN users u ON ((u.id = h.user_id)))
  WHERE ((h.session_id IS NOT NULL) AND (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid) AND (h.entered_at > (now() - '7 days'::interval)))
  ORDER BY h.session_id, h.entered_at;
```

### `analytics_user_session_summary_view`

```sql
SELECT u.id,
    u.full_name,
    u.avatar_url,
    u.created_at,
    count(DISTINCT h.session_id) AS session_count,
    max(h.entered_at) AS last_activity_at,
    sum(h.duration_seconds) AS total_time_seconds
   FROM (users u
     LEFT JOIN user_view_history h ON ((h.user_id = u.id)))
  WHERE ((u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid) AND (u.is_active = true))
  GROUP BY u.id, u.full_name, u.avatar_url, u.created_at;
```

### `analytics_users_by_country_view`

```sql
SELECT c.id AS country_id,
    c.name AS country_name,
    c.alpha_2 AS country_code,
    count(ud.user_id) AS user_count
   FROM (user_data ud
     JOIN countries c ON ((c.id = ud.country)))
  WHERE (ud.country IS NOT NULL)
  GROUP BY c.id, c.name, c.alpha_2
  ORDER BY (count(ud.user_id)) DESC;
```

### `budget_items_view`

```sql
SELECT bi.id,
    bi.quote_id AS budget_id,
    bi.organization_id,
    bi.project_id,
    bi.task_id,
    bi.created_at,
    bi.updated_at,
    bi.created_by,
    t.custom_name,
    td.name AS division_name,
    td."order" AS division_order,
    u.name AS unit,
    bi.description,
    bi.quantity,
    bi.unit_price,
    bi.currency_id,
    bi.markup_pct,
    bi.tax_pct,
    bi.cost_scope,
        CASE bi.cost_scope
            WHEN 'materials_and_labor'::cost_scope_enum THEN 'Materiales + Mano de obra'::text
            WHEN 'materials_only'::cost_scope_enum THEN 'Sólo materiales'::text
            WHEN 'labor_only'::cost_scope_enum THEN 'Sólo mano de obra'::text
            ELSE initcap(replace((bi.cost_scope)::text, '_'::text, ' '::text))
        END AS cost_scope_label,
    bi.sort_key AS "position"
   FROM (((quote_items bi
     LEFT JOIN tasks t ON ((t.id = bi.task_id)))
     LEFT JOIN task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN units u ON ((u.id = t.unit_id)));
```

### `capital_ledger_view`

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
   FROM partner_contributions pc
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
   FROM partner_withdrawals pw
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

### `capital_organization_totals_view`

```sql
SELECT org.id AS organization_id,
    COALESCE(contributions.total, (0)::numeric) AS total_contributions,
    COALESCE(withdrawals.total, (0)::numeric) AS total_withdrawals,
    COALESCE(adjustments.total, (0)::numeric) AS total_adjustments,
    ((COALESCE(contributions.total, (0)::numeric) - COALESCE(withdrawals.total, (0)::numeric)) + COALESCE(adjustments.total, (0)::numeric)) AS total_net_capital,
    COALESCE(contributions.count, (0)::bigint) AS contributions_count,
    COALESCE(withdrawals.count, (0)::bigint) AS withdrawals_count,
    COALESCE(adjustments.count, (0)::bigint) AS adjustments_count
   FROM (((organizations org
     LEFT JOIN ( SELECT partner_contributions.organization_id,
            sum(partner_contributions.amount) AS total,
            count(*) AS count
           FROM partner_contributions
          WHERE ((partner_contributions.status = 'confirmed'::text) AND ((partner_contributions.is_deleted = false) OR (partner_contributions.is_deleted IS NULL)))
          GROUP BY partner_contributions.organization_id) contributions ON ((contributions.organization_id = org.id)))
     LEFT JOIN ( SELECT partner_withdrawals.organization_id,
            sum(partner_withdrawals.amount) AS total,
            count(*) AS count
           FROM partner_withdrawals
          WHERE ((partner_withdrawals.status = 'confirmed'::text) AND ((partner_withdrawals.is_deleted = false) OR (partner_withdrawals.is_deleted IS NULL)))
          GROUP BY partner_withdrawals.organization_id) withdrawals ON ((withdrawals.organization_id = org.id)))
     LEFT JOIN ( SELECT capital_adjustments.organization_id,
            sum(capital_adjustments.amount) AS total,
            count(*) AS count
           FROM capital_adjustments
          WHERE ((capital_adjustments.status = 'confirmed'::text) AND (capital_adjustments.is_deleted = false))
          GROUP BY capital_adjustments.organization_id) adjustments ON ((adjustments.organization_id = org.id)));
```

### `capital_participants_summary_view`

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
   FROM (capital_participants cp
     LEFT JOIN capital_partner_balances_view pb ON ((pb.partner_id = cp.id)))
  WHERE (cp.is_deleted = false);
```

### `capital_partner_balances_view`

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
   FROM (((capital_participants cp
     LEFT JOIN ( SELECT partner_contributions.partner_id,
            sum(partner_contributions.amount) AS total,
            count(*) AS count,
            max(partner_contributions.contribution_date) AS last_date
           FROM partner_contributions
          WHERE ((partner_contributions.status = 'confirmed'::text) AND ((partner_contributions.is_deleted = false) OR (partner_contributions.is_deleted IS NULL)))
          GROUP BY partner_contributions.partner_id) contributions ON ((contributions.partner_id = cp.id)))
     LEFT JOIN ( SELECT partner_withdrawals.partner_id,
            sum(partner_withdrawals.amount) AS total,
            count(*) AS count,
            max(partner_withdrawals.withdrawal_date) AS last_date
           FROM partner_withdrawals
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

### `capital_partner_kpi_view`

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
   FROM (capital_partner_balances_view pb
     LEFT JOIN capital_organization_totals_view ot ON ((ot.organization_id = pb.organization_id)));
```

### `client_financial_summary_view`

```sql
WITH commitment_totals AS (
         SELECT client_commitments.client_id,
            client_commitments.currency_id,
            sum(client_commitments.amount) AS total_committed,
            max(client_commitments.exchange_rate) AS exchange_rate
           FROM client_commitments
          WHERE (client_commitments.is_deleted = false)
          GROUP BY client_commitments.client_id, client_commitments.currency_id
        ), payment_totals AS (
         SELECT client_payments.client_id,
            client_payments.currency_id,
            sum(client_payments.amount) AS total_paid
           FROM client_payments
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
   FROM (((project_clients pc
     CROSS JOIN currencies cur)
     LEFT JOIN commitment_totals ct ON (((ct.client_id = pc.id) AND (ct.currency_id = cur.id))))
     LEFT JOIN payment_totals pt ON (((pt.client_id = pc.id) AND (pt.currency_id = cur.id))))
  WHERE ((pc.is_deleted = false) AND ((ct.total_committed > (0)::numeric) OR (pt.total_paid > (0)::numeric)));
```

### `client_payments_view`

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
    date_trunc('month'::text, (cp.payment_date)::timestamp with time zone) AS payment_month,
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
    cps.notes AS schedule_notes,
    u.full_name AS creator_full_name,
    u.avatar_url AS creator_avatar_url
   FROM ((((((((client_payments cp
     LEFT JOIN project_clients_view pcv ON ((pcv.id = cp.client_id)))
     LEFT JOIN organization_wallets ow ON ((ow.id = cp.wallet_id)))
     LEFT JOIN wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN currencies cur ON ((cur.id = cp.currency_id)))
     LEFT JOIN client_commitments cc ON ((cc.id = cp.commitment_id)))
     LEFT JOIN client_payment_schedule cps ON ((cps.id = cp.schedule_id)))
     LEFT JOIN organization_members om ON ((om.id = cp.created_by)))
     LEFT JOIN users u ON ((u.id = om.user_id)))
  WHERE (cp.is_deleted = false);
```

### `construction_tasks_view`

```sql
SELECT ct.id,
    ct.organization_id,
    ct.project_id,
    ct.task_id,
    ct.recipe_id,
    ct.quote_item_id,
    COALESCE(t.custom_name, t.name, ct.custom_name) AS task_name,
    COALESCE(u.name, ct.custom_unit) AS unit,
    td.name AS division_name,
    ct.cost_scope,
        CASE ct.cost_scope
            WHEN 'materials_and_labor'::cost_scope_enum THEN 'M.O. + MAT.'::text
            WHEN 'labor_only'::cost_scope_enum THEN 'M.O.'::text
            WHEN 'materials_only'::cost_scope_enum THEN 'MAT'::text
            ELSE 'M.O. + MAT.'::text
        END AS cost_scope_label,
    ct.quantity,
    ct.original_quantity,
        CASE
            WHEN ((ct.original_quantity IS NOT NULL) AND (ct.original_quantity > (0)::double precision)) THEN (ct.quantity - ct.original_quantity)
            ELSE NULL::real
        END AS quantity_variance,
    ct.planned_start_date,
    ct.planned_end_date,
    ct.actual_start_date,
    ct.actual_end_date,
        CASE
            WHEN ((ct.actual_end_date IS NOT NULL) AND (ct.planned_end_date IS NOT NULL)) THEN (ct.actual_end_date - ct.planned_end_date)
            ELSE NULL::integer
        END AS schedule_variance_days,
    ct.duration_in_days,
    ct.progress_percent,
    ct.status,
    ct.description,
    ct.notes,
    ct.custom_name,
    ct.custom_unit,
    ct.created_at,
    ct.updated_at,
    ct.created_by,
    ct.updated_by,
    ct.is_deleted,
    qi.quote_id,
    q.name AS quote_name,
    qi.markup_pct AS quote_markup_pct,
    ph.phase_name,
    tr.name AS recipe_name
   FROM (((((((construction_tasks ct
     LEFT JOIN tasks t ON ((t.id = ct.task_id)))
     LEFT JOIN units u ON ((u.id = t.unit_id)))
     LEFT JOIN task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN quote_items qi ON ((qi.id = ct.quote_item_id)))
     LEFT JOIN quotes q ON ((q.id = qi.quote_id)))
     LEFT JOIN task_recipes tr ON ((tr.id = ct.recipe_id)))
     LEFT JOIN LATERAL ( SELECT cp.name AS phase_name
           FROM (construction_phase_tasks cpt
             JOIN construction_phases cp ON ((cp.id = cpt.project_phase_id)))
          WHERE (cpt.construction_task_id = ct.id)
          ORDER BY cpt.created_at DESC
         LIMIT 1) ph ON (true))
  WHERE (ct.is_deleted = false);
```

### `contacts_summary_view`

```sql
SELECT c.organization_id,
    count(*) AS total_contacts,
    count(c.linked_user_id) AS linked_contacts,
    count(
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM organization_members om
              WHERE ((om.user_id = c.linked_user_id) AND (om.organization_id = c.organization_id)))) THEN 1
            ELSE NULL::integer
        END) AS member_contacts
   FROM contacts c
  WHERE (c.is_deleted = false)
  GROUP BY c.organization_id;
```

### `contacts_view`

```sql
SELECT c.id,
    c.organization_id,
    c.contact_type,
    c.first_name,
    c.last_name,
    c.full_name,
    c.email,
    c.phone,
    c.company_name,
    c.company_id,
    c.location,
    c.notes,
    c.national_id,
    c.image_url,
    c.avatar_updated_at,
    c.is_local,
    c.display_name_override,
    c.linked_user_id,
    c.linked_at,
    c.sync_status,
    c.created_at,
    c.updated_at,
    c.is_deleted,
    c.deleted_at,
    u.avatar_url AS linked_user_avatar_url,
    u.full_name AS linked_user_full_name,
    u.email AS linked_user_email,
    COALESCE(u.avatar_url, c.image_url) AS resolved_avatar_url,
    company.full_name AS linked_company_name,
    COALESCE(company.full_name, c.company_name) AS resolved_company_name,
    COALESCE(( SELECT json_agg(json_build_object('id', cc.id, 'name', cc.name)) AS json_agg
           FROM (contact_category_links ccl
             JOIN contact_categories cc ON ((cc.id = ccl.contact_category_id)))
          WHERE ((ccl.contact_id = c.id) AND (cc.is_deleted = false))), '[]'::json) AS contact_categories,
    (EXISTS ( SELECT 1
           FROM organization_members om
          WHERE ((om.user_id = c.linked_user_id) AND (om.organization_id = c.organization_id)))) AS is_organization_member
   FROM ((contacts c
     LEFT JOIN users u ON ((u.id = c.linked_user_id)))
     LEFT JOIN contacts company ON (((company.id = c.company_id) AND (company.is_deleted = false))))
  WHERE (c.is_deleted = false);
```

### `contract_summary_view`

```sql
SELECT c.id,
    c.name,
    c.project_id,
    c.organization_id,
    c.client_id,
    c.status,
    c.currency_id,
    c.original_contract_value,
    c.created_at,
    c.updated_at,
    COALESCE(co_stats.total_cos, (0)::bigint) AS change_order_count,
    COALESCE(co_stats.approved_cos, (0)::bigint) AS approved_change_order_count,
    COALESCE(co_stats.pending_cos, (0)::bigint) AS pending_change_order_count,
    COALESCE(co_stats.approved_changes_value, (0)::numeric) AS approved_changes_value,
    COALESCE(co_stats.pending_changes_value, (0)::numeric) AS pending_changes_value,
    (COALESCE(c.original_contract_value, (0)::numeric) + COALESCE(co_stats.approved_changes_value, (0)::numeric)) AS revised_contract_value,
    ((COALESCE(c.original_contract_value, (0)::numeric) + COALESCE(co_stats.approved_changes_value, (0)::numeric)) + COALESCE(co_stats.pending_changes_value, (0)::numeric)) AS potential_contract_value
   FROM (quotes c
     LEFT JOIN ( SELECT co.parent_quote_id,
            count(*) AS total_cos,
            count(*) FILTER (WHERE (co.status = 'approved'::text)) AS approved_cos,
            count(*) FILTER (WHERE (co.status = ANY (ARRAY['draft'::text, 'sent'::text]))) AS pending_cos,
            COALESCE(sum(qv.total_with_tax) FILTER (WHERE (co.status = 'approved'::text)), (0)::numeric) AS approved_changes_value,
            COALESCE(sum(qv.total_with_tax) FILTER (WHERE (co.status = ANY (ARRAY['draft'::text, 'sent'::text]))), (0)::numeric) AS pending_changes_value
           FROM (quotes co
             JOIN quotes_view qv ON ((qv.id = co.id)))
          WHERE ((co.quote_type = 'change_order'::text) AND (co.is_deleted = false))
          GROUP BY co.parent_quote_id) co_stats ON ((co_stats.parent_quote_id = c.id)))
  WHERE ((c.quote_type = 'contract'::text) AND (c.is_deleted = false));
```

### `course_lesson_completions_view`

```sql
SELECT clp.id AS progress_id,
    clp.user_id,
    clp.lesson_id,
    clp.is_completed,
    clp.completed_at,
    clp.last_position_sec,
    clp.updated_at,
    cl.title AS lesson_title,
    cm.id AS module_id,
    cm.title AS module_title,
    cm.course_id,
    c.title AS course_title,
    c.slug AS course_slug
   FROM (((course_lesson_progress clp
     JOIN course_lessons cl ON (((cl.id = clp.lesson_id) AND (cl.is_active = true))))
     JOIN course_modules cm ON (((cm.id = cl.module_id) AND (cm.is_deleted = false))))
     JOIN courses c ON ((c.id = cm.course_id)));
```

### `course_lessons_total_view`

```sql
SELECT c.id AS course_id,
    (count(l.id))::integer AS total_lessons
   FROM ((courses c
     JOIN course_modules m ON (((m.course_id = c.id) AND (m.is_deleted = false))))
     JOIN course_lessons l ON (((l.module_id = m.id) AND (l.is_active = true))))
  GROUP BY c.id;
```

### `course_progress_view`

```sql
SELECT t.course_id,
    d.user_id,
    round(((100.0 * (d.done_lessons)::numeric) / (NULLIF(t.total_lessons, 0))::numeric), 2) AS progress_pct,
    d.done_lessons,
    t.total_lessons
   FROM (course_lessons_total_view t
     JOIN course_user_course_done_view d ON ((d.course_id = t.course_id)));
```

### `course_user_active_days_view`

```sql
SELECT DISTINCT p.user_id,
    date(COALESCE(p.completed_at, p.updated_at)) AS day
   FROM course_lesson_progress p;
```

### `course_user_course_done_view`

```sql
SELECT m.course_id,
    p.user_id,
    (count(*) FILTER (WHERE (COALESCE(p.is_completed, false) OR (p.progress_pct >= (95)::numeric))))::integer AS done_lessons
   FROM ((course_lesson_progress p
     JOIN course_lessons l ON (((l.id = p.lesson_id) AND (l.is_active = true))))
     JOIN course_modules m ON (((m.id = l.module_id) AND (m.is_deleted = false))))
  GROUP BY m.course_id, p.user_id;
```

### `course_user_global_progress_view`

```sql
SELECT course_progress_view.user_id,
    (sum(course_progress_view.done_lessons))::integer AS done_lessons_total,
    (sum(course_progress_view.total_lessons))::integer AS total_lessons_total,
    round(((100.0 * (sum(course_progress_view.done_lessons))::numeric) / (NULLIF(sum(course_progress_view.total_lessons), 0))::numeric), 1) AS progress_pct
   FROM course_progress_view
  GROUP BY course_progress_view.user_id;
```

### `course_user_study_time_view`

```sql
SELECT p.user_id,
    sum(
        CASE
            WHEN COALESCE(p.is_completed, false) THEN COALESCE(l.duration_sec, 0)
            ELSE LEAST(COALESCE(l.duration_sec, 0), COALESCE(p.last_position_sec, 0))
        END) AS seconds_lifetime,
    sum(
        CASE
            WHEN (date_trunc('month'::text, COALESCE(p.completed_at, p.updated_at)) = date_trunc('month'::text, now())) THEN
            CASE
                WHEN COALESCE(p.is_completed, false) THEN COALESCE(l.duration_sec, 0)
                ELSE LEAST(COALESCE(l.duration_sec, 0), COALESCE(p.last_position_sec, 0))
            END
            ELSE 0
        END) AS seconds_this_month
   FROM (course_lesson_progress p
     JOIN course_lessons l ON (((l.id = p.lesson_id) AND (l.is_active = true))))
  GROUP BY p.user_id;
```

### `general_costs_by_category_view`

```sql
SELECT gcp.organization_id,
    date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone) AS payment_month,
    gc.category_id,
    gcc.name AS category_name,
    sum(gcp.amount) AS total_amount
   FROM ((general_costs_payments gcp
     LEFT JOIN general_costs gc ON ((gc.id = gcp.general_cost_id)))
     LEFT JOIN general_cost_categories gcc ON ((gcc.id = gc.category_id)))
  WHERE (gcp.is_deleted = false)
  GROUP BY gcp.organization_id, (date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone)), gc.category_id, gcc.name;
```

### `general_costs_monthly_summary_view`

```sql
SELECT gcp.organization_id,
    date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone) AS payment_month,
    sum(gcp.amount) AS total_amount,
    count(*) AS payments_count
   FROM general_costs_payments gcp
  WHERE (gcp.is_deleted = false)
  GROUP BY gcp.organization_id, (date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone));
```

### `general_costs_payments_view`

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
   FROM ((((((general_costs_payments gcp
     LEFT JOIN general_costs gc ON ((gc.id = gcp.general_cost_id)))
     LEFT JOIN general_cost_categories gcc ON ((gcc.id = gc.category_id)))
     LEFT JOIN organization_members om ON ((om.id = gcp.created_by)))
     LEFT JOIN users u ON ((u.id = om.user_id)))
     LEFT JOIN wallets w ON ((w.id = gcp.wallet_id)))
     LEFT JOIN currencies cur ON ((cur.id = gcp.currency_id)))
  WHERE (gcp.is_deleted = false);
```

### `kanban_boards_view`

```sql
SELECT b.id,
    b.name,
    b.description,
    b.color,
    b.icon,
    b.organization_id,
    b.project_id,
    b.is_template,
    b.is_archived,
    b.created_at,
    b.updated_at,
    b.created_by,
    p.name AS project_name,
    ( SELECT count(*) AS count
           FROM kanban_lists
          WHERE (kanban_lists.board_id = b.id)) AS list_count,
    ( SELECT count(*) AS count
           FROM (kanban_cards c
             JOIN kanban_lists l ON ((l.id = c.list_id)))
          WHERE ((l.board_id = b.id) AND (c.is_archived = false))) AS card_count,
    ( SELECT count(*) AS count
           FROM (kanban_cards c
             JOIN kanban_lists l ON ((l.id = c.list_id)))
          WHERE ((l.board_id = b.id) AND (c.is_completed = true) AND (c.is_archived = false))) AS completed_card_count
   FROM (kanban_boards b
     LEFT JOIN projects p ON ((p.id = b.project_id)))
  WHERE (b.is_deleted = false);
```

### `kanban_cards_view`

```sql
SELECT c.id,
    c.title,
    c.description,
    c.priority,
    c.due_date,
    c.start_date,
    c.is_completed,
    c.completed_at,
    c."position",
    c.cover_color,
    c.cover_image_url,
    c.estimated_hours,
    c.actual_hours,
    c.created_at,
    c.updated_at,
    c.list_id,
    c.board_id,
    l.name AS list_name,
    l."position" AS list_position,
    b.name AS board_name,
    b.organization_id,
    b.project_id,
    c.assigned_to,
    m.user_id AS assigned_to_user_id,
    ( SELECT count(*) AS count
           FROM kanban_comments
          WHERE (kanban_comments.card_id = c.id)) AS comment_count,
    ( SELECT count(*) AS count
           FROM kanban_attachments
          WHERE (kanban_attachments.card_id = c.id)) AS attachment_count,
    ( SELECT count(*) AS count
           FROM (kanban_checklist_items ci
             JOIN kanban_checklists ch ON ((ch.id = ci.checklist_id)))
          WHERE (ch.card_id = c.id)) AS total_checklist_items,
    ( SELECT count(*) AS count
           FROM (kanban_checklist_items ci
             JOIN kanban_checklists ch ON ((ch.id = ci.checklist_id)))
          WHERE ((ch.card_id = c.id) AND (ci.is_completed = true))) AS completed_checklist_items,
    ( SELECT array_agg(jsonb_build_object('id', lb.id, 'name', lb.name, 'color', lb.color)) AS array_agg
           FROM (kanban_card_labels cl
             JOIN kanban_labels lb ON ((lb.id = cl.label_id)))
          WHERE (cl.card_id = c.id)) AS labels
   FROM (((kanban_cards c
     JOIN kanban_lists l ON ((l.id = c.list_id)))
     JOIN kanban_boards b ON ((b.id = c.board_id)))
     LEFT JOIN organization_members m ON ((m.id = c.assigned_to)))
  WHERE (c.is_archived = false);
```

### `labor_by_type_view`

```sql
SELECT lp.organization_id,
    lp.project_id,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    pl.labor_type_id,
    lt.name AS labor_type_name,
    sum((lp.amount * lp.exchange_rate)) AS total_functional_amount,
    count(*) AS payments_count
   FROM ((labor_payments lp
     LEFT JOIN project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN labor_categories lt ON ((lt.id = pl.labor_type_id)))
  WHERE ((lp.status = 'confirmed'::text) AND ((lp.is_deleted IS NULL) OR (lp.is_deleted = false)))
  GROUP BY lp.organization_id, lp.project_id, (date_trunc('month'::text, (lp.payment_date)::timestamp with time zone)), pl.labor_type_id, lt.name;
```

### `labor_insurance_view`

```sql
SELECT li.id,
    li.organization_id,
    li.project_id,
    li.labor_id,
    pl.contact_id,
    li.insurance_type,
    li.policy_number,
    li.provider,
    li.coverage_start,
    li.coverage_end,
    li.reminder_days,
    li.certificate_attachment_id,
    li.notes,
    li.created_by,
    li.created_at,
    li.updated_at,
    (li.coverage_end - CURRENT_DATE) AS days_to_expiry,
        CASE
            WHEN (CURRENT_DATE > li.coverage_end) THEN 'vencido'::text
            WHEN ((li.coverage_end - CURRENT_DATE) <= 30) THEN 'por_vencer'::text
            ELSE 'vigente'::text
        END AS status,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    lt.name AS labor_type_name,
    proj.name AS project_name
   FROM ((((labor_insurances li
     LEFT JOIN project_labor pl ON ((pl.id = li.labor_id)))
     LEFT JOIN contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN labor_categories lt ON ((lt.id = pl.labor_type_id)))
     LEFT JOIN projects proj ON ((proj.id = li.project_id)));
```

### `labor_monthly_summary_view`

```sql
SELECT lp.organization_id,
    lp.project_id,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    sum((lp.amount * lp.exchange_rate)) AS total_functional_amount,
    count(*) AS payments_count,
    count(DISTINCT lp.labor_id) AS unique_workers_count
   FROM labor_payments lp
  WHERE ((lp.status = 'confirmed'::text) AND ((lp.is_deleted IS NULL) OR (lp.is_deleted = false)))
  GROUP BY lp.organization_id, lp.project_id, (date_trunc('month'::text, (lp.payment_date)::timestamp with time zone));
```

### `labor_payments_view`

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
   FROM (((((((((labor_payments lp
     LEFT JOIN currencies cur ON ((cur.id = lp.currency_id)))
     LEFT JOIN organization_wallets ow ON ((ow.id = lp.wallet_id)))
     LEFT JOIN wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN projects proj ON ((proj.id = lp.project_id)))
     LEFT JOIN organization_members om_created ON ((om_created.id = lp.created_by)))
     LEFT JOIN users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((lp.is_deleted = false) OR (lp.is_deleted IS NULL));
```

### `labor_view`

```sql
SELECT lt.id AS labor_id,
    lt.name AS labor_name,
    lt.description AS labor_description,
    lt.unit_id,
    u.name AS unit_name,
    u.symbol AS unit_symbol,
    lpc.organization_id,
    lpc.unit_price AS current_price,
    lpc.currency_id AS current_currency_id,
    c.code AS current_currency_code,
    c.symbol AS current_currency_symbol,
    lpc.valid_from,
    lpc.valid_to,
    lpc.updated_at,
    lap.avg_price,
    lap.price_count,
    lap.min_price,
    lap.max_price
   FROM ((((labor_types lt
     LEFT JOIN units u ON ((u.id = lt.unit_id)))
     LEFT JOIN ( SELECT DISTINCT ON (lp.labor_type_id, lp.organization_id) lp.labor_type_id AS labor_id,
            lp.organization_id,
            lp.currency_id,
            lp.unit_price,
            lp.valid_from,
            lp.valid_to,
            lp.updated_at
           FROM labor_prices lp
          WHERE ((lp.valid_to IS NULL) OR (lp.valid_to >= CURRENT_DATE))
          ORDER BY lp.labor_type_id, lp.organization_id, lp.valid_from DESC) lpc ON ((lpc.labor_id = lt.id)))
     LEFT JOIN currencies c ON ((c.id = lpc.currency_id)))
     LEFT JOIN labor_avg_prices lap ON ((lap.labor_id = lt.id)));
```

### `material_invoices_view`

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
   FROM (((((material_invoices inv
     LEFT JOIN currencies c ON ((c.id = inv.currency_id)))
     LEFT JOIN contacts prov ON ((prov.id = inv.provider_id)))
     LEFT JOIN projects p ON ((p.id = inv.project_id)))
     LEFT JOIN material_purchase_orders po ON ((po.id = inv.purchase_order_id)))
     LEFT JOIN LATERAL ( SELECT count(*) AS item_count
           FROM material_invoice_items ii
          WHERE (ii.invoice_id = inv.id)) items ON (true));
```

### `material_payments_view`

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
   FROM (((((((((material_payments mp
     LEFT JOIN material_invoices mi ON ((mi.id = mp.purchase_id)))
     LEFT JOIN contacts prov ON ((prov.id = mi.provider_id)))
     LEFT JOIN projects p ON ((p.id = mp.project_id)))
     LEFT JOIN organization_members om ON ((om.id = mp.created_by)))
     LEFT JOIN users u ON ((u.id = om.user_id)))
     LEFT JOIN organization_wallets ow ON ((ow.id = mp.wallet_id)))
     LEFT JOIN wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN currencies cur ON ((cur.id = mp.currency_id)))
     LEFT JOIN material_types mt ON ((mt.id = mp.material_type_id)))
  WHERE ((mp.is_deleted = false) OR (mp.is_deleted IS NULL));
```

### `material_purchase_orders_view`

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
   FROM ((((material_purchase_orders po
     LEFT JOIN currencies c ON ((c.id = po.currency_id)))
     LEFT JOIN contacts prov ON ((prov.id = po.provider_id)))
     LEFT JOIN projects p ON ((p.id = po.project_id)))
     LEFT JOIN LATERAL ( SELECT count(*) AS item_count
           FROM material_purchase_order_items poi
          WHERE (poi.purchase_order_id = po.id)) items ON (true))
  WHERE (po.is_deleted = false);
```

### `materials_view`

```sql
SELECT m.id,
    m.name,
    m.code,
    m.description,
    m.material_type,
    m.is_system,
    m.organization_id,
    m.is_deleted,
    m.created_at,
    m.updated_at,
    m.unit_id,
    u.name AS unit_of_computation,
    u.symbol AS unit_symbol,
    m.category_id,
    mc.name AS category_name,
    m.default_provider_id,
    m.default_sale_unit_id,
    m.default_sale_unit_quantity,
    su.name AS sale_unit_name,
    su.symbol AS sale_unit_symbol,
    mp.unit_price AS org_unit_price,
    mp.currency_id AS org_price_currency_id,
    mp.valid_from AS org_price_valid_from
   FROM ((((materials m
     LEFT JOIN units u ON ((m.unit_id = u.id)))
     LEFT JOIN material_categories mc ON ((m.category_id = mc.id)))
     LEFT JOIN units su ON ((m.default_sale_unit_id = su.id)))
     LEFT JOIN LATERAL ( SELECT mp_inner.unit_price,
            mp_inner.currency_id,
            mp_inner.valid_from
           FROM material_prices mp_inner
          WHERE ((mp_inner.material_id = m.id) AND (mp_inner.organization_id = m.organization_id) AND (mp_inner.valid_from <= CURRENT_DATE) AND ((mp_inner.valid_to IS NULL) OR (mp_inner.valid_to >= CURRENT_DATE)))
          ORDER BY mp_inner.valid_from DESC
         LIMIT 1) mp ON (true))
  WHERE (m.is_deleted = false);
```

### `ops_alerts_enriched_view`

```sql
SELECT oa.id,
    oa.created_at,
    oa.updated_at,
    oa.severity,
    oa.status,
    oa.alert_type,
    oa.title,
    oa.description,
    oa.provider,
    oa.provider_payment_id,
    oa.fingerprint,
    oa.evidence,
    oa.ack_at,
    oa.resolved_at,
    oa.user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    oa.organization_id,
    o.name AS org_name,
    pl.name AS org_plan_name,
    oa.payment_id,
    p.amount AS payment_amount,
    p.currency AS payment_currency,
    p.product_type AS payment_product_type,
    p.status AS payment_status,
    ack_u.full_name AS ack_by_name,
    res_u.full_name AS resolved_by_name
   FROM ((((((ops_alerts oa
     LEFT JOIN users u ON ((u.id = oa.user_id)))
     LEFT JOIN organizations o ON ((o.id = oa.organization_id)))
     LEFT JOIN plans pl ON ((pl.id = o.plan_id)))
     LEFT JOIN payments p ON ((p.id = oa.payment_id)))
     LEFT JOIN users ack_u ON ((ack_u.id = oa.ack_by)))
     LEFT JOIN users res_u ON ((res_u.id = oa.resolved_by)));
```

### `organization_activity_logs_view`

```sql
SELECT l.id,
    l.organization_id,
    l.member_id,
    m.user_id,
    l.action,
    l.target_table,
    l.target_id,
    l.metadata,
    l.created_at,
    u.full_name,
    u.avatar_url,
    u.email,
    r.name AS role_name
   FROM (((organization_activity_logs l
     JOIN organization_members m ON ((l.member_id = m.id)))
     JOIN users u ON ((m.user_id = u.id)))
     LEFT JOIN roles r ON ((m.role_id = r.id)))
  WHERE (l.member_id IS NOT NULL);
```

### `organization_currencies_view`

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
   FROM (organization_currencies oc
     LEFT JOIN currencies c ON ((oc.currency_id = c.id)));
```

### `organization_member_details`

```sql
SELECT om.id AS member_id,
    om.organization_id,
    om.user_id,
    om.role_id,
    om.is_active,
    om.joined_at,
    om.invited_by,
    u.full_name,
    u.email,
    u.avatar_url
   FROM (organization_members om
     JOIN users u ON ((om.user_id = u.id)));
```

### `organization_members_full_view`

```sql
SELECT om.id,
    om.user_id,
    om.organization_id,
    om.role_id,
    om.is_active,
    om.is_billable,
    om.is_over_limit,
    om.joined_at,
    om.last_active_at,
    om.invited_by,
    om.created_at,
    om.updated_at,
    u.full_name AS user_full_name,
    u.email AS user_email,
    u.avatar_url AS user_avatar_url,
    r.id AS role_id_ref,
    r.name AS role_name,
    r.type AS role_type
   FROM ((organization_members om
     LEFT JOIN users u ON ((om.user_id = u.id)))
     LEFT JOIN roles r ON ((om.role_id = r.id)));
```

### `organization_online_users`

```sql
SELECT up.org_id,
    up.user_id,
    up.last_seen_at,
    ((now() - up.last_seen_at) <= '00:01:30'::interval) AS is_online
   FROM user_presence up;
```

### `organization_task_prices_view`

```sql
SELECT p.id,
    p.organization_id,
    p.task_id,
    t.custom_name AS task_name,
    td.name AS division_name,
    td."order" AS division_order,
    u.name AS unit,
    p.labor_unit_cost,
    p.material_unit_cost,
    p.supply_unit_cost,
    COALESCE(p.total_unit_cost, ((COALESCE(p.labor_unit_cost, (0)::numeric) + COALESCE(p.material_unit_cost, (0)::numeric)) + COALESCE(p.supply_unit_cost, (0)::numeric))) AS total_unit_cost,
    p.currency_code,
    p.note,
    p.created_at,
    p.updated_at
   FROM (((organization_task_prices p
     LEFT JOIN tasks t ON ((t.id = p.task_id)))
     LEFT JOIN task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN units u ON ((u.id = t.unit_id)));
```

### `organization_wallets_view`

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
   FROM (organization_wallets ow
     LEFT JOIN wallets w ON ((ow.wallet_id = w.id)));
```

### `project_clients_view`

```sql
SELECT pc.id,
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
    c.full_name AS contact_full_name,
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    c.email AS contact_email,
    c.phone AS contact_phone,
    c.company_name AS contact_company_name,
    c.image_url AS contact_image_url,
    c.linked_user_id,
    u.avatar_url AS linked_user_avatar_url,
    COALESCE(u.avatar_url, c.image_url) AS contact_avatar_url,
    cr.name AS role_name
   FROM (((project_clients pc
     LEFT JOIN contacts c ON ((c.id = pc.contact_id)))
     LEFT JOIN users u ON ((u.id = c.linked_user_id)))
     LEFT JOIN client_roles cr ON ((cr.id = pc.client_role_id)))
  WHERE (pc.is_deleted = false);
```

### `project_labor_view`

```sql
SELECT pl.id,
    pl.project_id,
    pl.organization_id,
    pl.contact_id,
    pl.labor_type_id,
    pl.status,
    pl.notes,
    pl.start_date,
    pl.end_date,
    pl.created_at,
    pl.updated_at,
    pl.created_by,
    pl.updated_by,
    pl.is_deleted,
    pl.deleted_at,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    ct.full_name AS contact_full_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    ct.national_id AS contact_national_id,
    ct.phone AS contact_phone,
    ct.email AS contact_email,
    ct.image_url AS contact_image_url,
    lc.name AS labor_type_name,
    lc.description AS labor_type_description,
    proj.name AS project_name,
    om_created.id AS creator_member_id,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.contact_id = ct.id))) AS contact_has_attachments,
    COALESCE(payment_stats.total_payments, 0) AS total_payments_count,
    COALESCE(payment_stats.total_amount, (0)::numeric) AS total_amount_paid
   FROM ((((((project_labor pl
     LEFT JOIN contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN projects proj ON ((proj.id = pl.project_id)))
     LEFT JOIN organization_members om_created ON ((om_created.id = pl.created_by)))
     LEFT JOIN users u_created ON ((u_created.id = om_created.user_id)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS total_payments,
            sum(lp.amount) AS total_amount
           FROM labor_payments lp
          WHERE ((lp.labor_id = pl.id) AND ((lp.is_deleted = false) OR (lp.is_deleted IS NULL)) AND (lp.status = 'confirmed'::text))) payment_stats ON (true))
  WHERE (pl.is_deleted = false);
```

### `project_material_requirements_view`

```sql
SELECT ctms.project_id,
    ctms.organization_id,
    ctms.material_id,
    m.name AS material_name,
    u.name AS unit_name,
    m.category_id,
    mc.name AS category_name,
    (sum(ctms.quantity_planned))::numeric(20,4) AS total_required,
    count(DISTINCT ctms.construction_task_id) AS task_count,
    array_agg(DISTINCT ctms.construction_task_id) AS construction_task_ids
   FROM ((((construction_task_material_snapshots ctms
     JOIN construction_tasks ct ON ((ct.id = ctms.construction_task_id)))
     JOIN materials m ON ((m.id = ctms.material_id)))
     LEFT JOIN units u ON ((u.id = m.unit_id)))
     LEFT JOIN material_categories mc ON ((mc.id = m.category_id)))
  WHERE ((ct.is_deleted = false) AND (ct.status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'paused'::text])))
  GROUP BY ctms.project_id, ctms.organization_id, ctms.material_id, m.name, u.name, m.category_id, mc.name;
```

### `projects_view`

```sql
SELECT p.id,
    p.name,
    p.code,
    p.status,
    p.created_at,
    p.updated_at,
    p.last_active_at,
    p.is_active,
    p.is_deleted,
    p.deleted_at,
    p.organization_id,
    p.created_by,
    p.color,
    p.is_over_limit,
    p.image_url,
    p.image_palette,
    p.project_type_id,
    p.project_modality_id,
    COALESCE(pst.use_custom_color, false) AS use_custom_color,
    pst.custom_color_h,
    pst.custom_color_hex,
    COALESCE(pst.use_palette_theme, false) AS use_palette_theme,
    pd.is_public,
    pd.city,
    pd.country,
    pt.name AS project_type_name,
    pm.name AS project_modality_name
   FROM ((((projects p
     LEFT JOIN project_data pd ON ((pd.project_id = p.id)))
     LEFT JOIN project_settings pst ON ((pst.project_id = p.id)))
     LEFT JOIN project_types pt ON (((pt.id = p.project_type_id) AND (pt.is_deleted = false))))
     LEFT JOIN project_modalities pm ON (((pm.id = p.project_modality_id) AND (pm.is_deleted = false))))
  WHERE (p.is_deleted = false);
```

### `quotes_view`

```sql
SELECT q.id,
    q.organization_id,
    q.project_id,
    q.client_id,
    q.name,
    q.description,
    q.status,
    q.quote_type,
    q.version,
    q.currency_id,
    q.exchange_rate,
    q.tax_pct,
    q.tax_label,
    q.discount_pct,
    q.quote_date,
    q.valid_until,
    q.approved_at,
    q.approved_by,
    q.created_at,
    q.updated_at,
    q.created_by,
    q.is_deleted,
    q.deleted_at,
    q.updated_by,
    q.parent_quote_id,
    q.original_contract_value,
    q.change_order_number,
    c.name AS currency_name,
    c.symbol AS currency_symbol,
    p.name AS project_name,
    concat_ws(' '::text, cl.first_name, cl.last_name) AS client_name,
    parent.name AS parent_contract_name,
    COALESCE(stats.item_count, (0)::bigint) AS item_count,
    COALESCE(stats.subtotal, (0)::numeric) AS subtotal,
    COALESCE(stats.subtotal_with_markup, (0)::numeric) AS subtotal_with_markup,
    round((COALESCE(stats.subtotal_with_markup, (0)::numeric) * ((1)::numeric - (COALESCE(q.discount_pct, (0)::numeric) / 100.0))), 2) AS total_after_discount,
    round(((COALESCE(stats.subtotal_with_markup, (0)::numeric) * ((1)::numeric - (COALESCE(q.discount_pct, (0)::numeric) / 100.0))) * ((1)::numeric + (COALESCE(q.tax_pct, (0)::numeric) / 100.0))), 2) AS total_with_tax
   FROM (((((quotes q
     LEFT JOIN currencies c ON ((q.currency_id = c.id)))
     LEFT JOIN projects p ON ((q.project_id = p.id)))
     LEFT JOIN contacts cl ON ((q.client_id = cl.id)))
     LEFT JOIN quotes parent ON ((q.parent_quote_id = parent.id)))
     LEFT JOIN ( SELECT quote_items.quote_id,
            count(*) AS item_count,
            sum((quote_items.quantity * quote_items.unit_price)) AS subtotal,
            sum(((quote_items.quantity * quote_items.unit_price) * ((1)::numeric + (COALESCE(quote_items.markup_pct, (0)::numeric) / 100.0)))) AS subtotal_with_markup
           FROM quote_items
          WHERE (quote_items.is_deleted = false)
          GROUP BY quote_items.quote_id) stats ON ((q.id = stats.quote_id)))
  WHERE (q.is_deleted = false);
```

### `subcontract_payments_view`

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
   FROM ((((((subcontract_payments sp
     LEFT JOIN subcontracts s ON ((s.id = sp.subcontract_id)))
     LEFT JOIN contacts c ON ((c.id = s.contact_id)))
     LEFT JOIN users u ON ((u.id = c.linked_user_id)))
     LEFT JOIN organization_wallets ow ON ((ow.id = sp.wallet_id)))
     LEFT JOIN wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN currencies cur ON ((cur.id = sp.currency_id)))
  WHERE (sp.is_deleted = false);
```

### `subcontracts_view`

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
   FROM ((subcontracts s
     LEFT JOIN contacts ct ON ((s.contact_id = ct.id)))
     LEFT JOIN currencies c ON ((s.currency_id = c.id)))
  WHERE (s.is_deleted = false);
```

### `system_errors_enriched_view`

```sql
SELECT sel.id,
    sel.domain,
    sel.entity,
    sel.function_name,
    sel.error_message,
    sel.context,
    sel.severity,
    sel.created_at,
    ((sel.context ->> 'user_id'::text))::uuid AS context_user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    ((sel.context ->> 'organization_id'::text))::uuid AS context_org_id,
    o.name AS org_name,
    pl.name AS plan_name,
    ((sel.context ->> 'amount'::text))::numeric AS payment_amount,
    (sel.context ->> 'currency'::text) AS payment_currency,
    (sel.context ->> 'provider'::text) AS payment_provider,
    (sel.context ->> 'course_id'::text) AS context_course_id,
    (sel.context ->> 'step'::text) AS error_step
   FROM (((system_error_logs sel
     LEFT JOIN users u ON ((u.id = ((sel.context ->> 'user_id'::text))::uuid)))
     LEFT JOIN organizations o ON ((o.id = ((sel.context ->> 'organization_id'::text))::uuid)))
     LEFT JOIN plans pl ON ((pl.id = o.plan_id)));
```

### `task_costs_view`

```sql
WITH recipe_material_costs AS (
         SELECT trm.recipe_id,
            tr.task_id,
            tr.organization_id,
            sum(((trm.total_quantity * COALESCE(mp.unit_price, (0)::numeric)) / GREATEST(COALESCE(mat.default_sale_unit_quantity, (1)::numeric), (1)::numeric))) AS mat_cost,
            min(mp.valid_from) AS oldest_mat_price_date
           FROM (((task_recipe_materials trm
             JOIN task_recipes tr ON (((tr.id = trm.recipe_id) AND (tr.is_deleted = false))))
             LEFT JOIN materials mat ON ((mat.id = trm.material_id)))
             LEFT JOIN LATERAL ( SELECT mp_inner.unit_price,
                    mp_inner.valid_from
                   FROM material_prices mp_inner
                  WHERE ((mp_inner.material_id = trm.material_id) AND (mp_inner.organization_id = tr.organization_id) AND (mp_inner.valid_from <= CURRENT_DATE) AND ((mp_inner.valid_to IS NULL) OR (mp_inner.valid_to >= CURRENT_DATE)))
                  ORDER BY mp_inner.valid_from DESC
                 LIMIT 1) mp ON (true))
          WHERE (trm.is_deleted = false)
          GROUP BY trm.recipe_id, tr.task_id, tr.organization_id
        ), recipe_labor_costs AS (
         SELECT trl.recipe_id,
            tr.task_id,
            tr.organization_id,
            sum((trl.quantity * COALESCE(lp.unit_price, (0)::numeric))) AS lab_cost,
            min(lp.valid_from) AS oldest_lab_price_date
           FROM ((task_recipe_labor trl
             JOIN task_recipes tr ON (((tr.id = trl.recipe_id) AND (tr.is_deleted = false))))
             LEFT JOIN LATERAL ( SELECT lp_inner.unit_price,
                    lp_inner.valid_from
                   FROM labor_prices lp_inner
                  WHERE ((lp_inner.labor_type_id = trl.labor_type_id) AND (lp_inner.organization_id = tr.organization_id) AND ((lp_inner.valid_to IS NULL) OR (lp_inner.valid_to >= CURRENT_DATE)))
                  ORDER BY lp_inner.valid_from DESC
                 LIMIT 1) lp ON (true))
          WHERE (trl.is_deleted = false)
          GROUP BY trl.recipe_id, tr.task_id, tr.organization_id
        ), recipe_ext_service_costs AS (
         SELECT tres.recipe_id,
            tr.task_id,
            tr.organization_id,
            sum(tres.unit_price) AS ext_cost
           FROM (task_recipe_external_services tres
             JOIN task_recipes tr ON (((tr.id = tres.recipe_id) AND (tr.is_deleted = false))))
          WHERE (tres.is_deleted = false)
          GROUP BY tres.recipe_id, tr.task_id, tr.organization_id
        ), recipe_totals AS (
         SELECT tr.id AS recipe_id,
            tr.task_id,
            tr.organization_id,
            COALESCE(rmc.mat_cost, (0)::numeric) AS mat_cost,
            COALESCE(rlc.lab_cost, (0)::numeric) AS lab_cost,
            COALESCE(rec.ext_cost, (0)::numeric) AS ext_cost,
            ((COALESCE(rmc.mat_cost, (0)::numeric) + COALESCE(rlc.lab_cost, (0)::numeric)) + COALESCE(rec.ext_cost, (0)::numeric)) AS total_cost,
            LEAST(rmc.oldest_mat_price_date, rlc.oldest_lab_price_date) AS oldest_price_date
           FROM (((task_recipes tr
             LEFT JOIN recipe_material_costs rmc ON ((rmc.recipe_id = tr.id)))
             LEFT JOIN recipe_labor_costs rlc ON ((rlc.recipe_id = tr.id)))
             LEFT JOIN recipe_ext_service_costs rec ON ((rec.recipe_id = tr.id)))
          WHERE (tr.is_deleted = false)
        )
 SELECT rt.task_id,
    rt.organization_id,
    (round(avg(rt.total_cost), 2))::numeric(14,4) AS unit_cost,
    (round(avg(rt.mat_cost), 2))::numeric(14,4) AS mat_unit_cost,
    (round(avg(rt.lab_cost), 2))::numeric(14,4) AS lab_unit_cost,
    (round(avg(rt.ext_cost), 2))::numeric(14,4) AS ext_unit_cost,
    (count(rt.recipe_id))::integer AS recipe_count,
    (round(min(rt.total_cost), 2))::numeric(14,4) AS min_cost,
    (round(max(rt.total_cost), 2))::numeric(14,4) AS max_cost,
    min(rt.oldest_price_date) AS oldest_price_date
   FROM recipe_totals rt
  GROUP BY rt.task_id, rt.organization_id;
```

### `task_recipes_view`

```sql
SELECT tr.id,
    tr.task_id,
    tr.organization_id,
    tr.name,
    tr.is_public,
    tr.region,
    tr.rating_avg,
    tr.rating_count,
    tr.usage_count,
    tr.created_at,
    tr.updated_at,
    tr.is_deleted,
    tr.import_batch_id,
    t.name AS task_name,
    t.custom_name AS task_custom_name,
    COALESCE(t.custom_name, t.name) AS task_display_name,
    td.name AS division_name,
    u.name AS unit_name,
    o.name AS org_name,
    (( SELECT count(*) AS count
           FROM task_recipe_materials trm
          WHERE (trm.recipe_id = tr.id)) + ( SELECT count(*) AS count
           FROM task_recipe_labor trl
          WHERE (trl.recipe_id = tr.id))) AS item_count
   FROM ((((task_recipes tr
     LEFT JOIN tasks t ON ((t.id = tr.task_id)))
     LEFT JOIN task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN units u ON ((u.id = t.unit_id)))
     LEFT JOIN organizations o ON ((o.id = tr.organization_id)))
  WHERE (tr.is_deleted = false);
```

### `tasks_view`

```sql
SELECT t.id,
    t.code,
    t.name,
    t.custom_name,
    t.description,
    t.is_system,
    t.is_published,
    t.is_deleted,
    t.organization_id,
    t.unit_id,
    t.task_division_id,
    t.task_action_id,
    t.task_element_id,
    t.is_parametric,
    t.parameter_values,
    t.import_batch_id,
    t.created_at,
    t.updated_at,
    t.created_by,
    t.updated_by,
    u.name AS unit_name,
    u.symbol AS unit_symbol,
    d.name AS division_name,
    ta.name AS action_name,
    ta.short_code AS action_short_code,
    te.name AS element_name
   FROM ((((tasks t
     LEFT JOIN units u ON ((u.id = t.unit_id)))
     LEFT JOIN task_divisions d ON ((d.id = t.task_division_id)))
     LEFT JOIN task_actions ta ON ((ta.id = t.task_action_id)))
     LEFT JOIN task_elements te ON ((te.id = t.task_element_id)));
```

### `unified_financial_movements_view`

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
   FROM (((((((general_costs_payments gcp
     LEFT JOIN currencies cur ON ((cur.id = gcp.currency_id)))
     LEFT JOIN organization_wallets ow ON ((ow.id = gcp.wallet_id)))
     LEFT JOIN wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN general_costs gc ON ((gc.id = gcp.general_cost_id)))
     LEFT JOIN general_cost_categories gcc ON ((gcc.id = gc.category_id)))
     LEFT JOIN organization_members om_created ON ((om_created.id = gcp.created_by)))
     LEFT JOIN users u_created ON ((u_created.id = om_created.user_id)))
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
   FROM ((((((((material_payments mp
     LEFT JOIN currencies cur ON ((cur.id = mp.currency_id)))
     LEFT JOIN organization_wallets ow ON ((ow.id = mp.wallet_id)))
     LEFT JOIN wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN material_types mt ON ((mt.id = mp.material_type_id)))
     LEFT JOIN material_invoices mi ON ((mi.id = mp.purchase_id)))
     LEFT JOIN contacts prov ON ((prov.id = mi.provider_id)))
     LEFT JOIN organization_members om_created ON ((om_created.id = mp.created_by)))
     LEFT JOIN users u_created ON ((u_created.id = om_created.user_id)))
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
   FROM ((((((((labor_payments lp
     LEFT JOIN currencies cur ON ((cur.id = lp.currency_id)))
     LEFT JOIN organization_wallets ow ON ((ow.id = lp.wallet_id)))
     LEFT JOIN wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN organization_members om_created ON ((om_created.id = lp.created_by)))
     LEFT JOIN users u_created ON ((u_created.id = om_created.user_id)))
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
   FROM (((((((subcontract_payments sp
     LEFT JOIN currencies cur ON ((cur.id = sp.currency_id)))
     LEFT JOIN organization_wallets ow ON ((ow.id = sp.wallet_id)))
     LEFT JOIN wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN subcontracts s ON ((s.id = sp.subcontract_id)))
     LEFT JOIN contacts ct ON ((ct.id = s.contact_id)))
     LEFT JOIN organization_members om_created ON ((om_created.id = sp.created_by)))
     LEFT JOIN users u_created ON ((u_created.id = om_created.user_id)))
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
   FROM ((((((((client_payments cp
     LEFT JOIN currencies cur ON ((cur.id = cp.currency_id)))
     LEFT JOIN organization_wallets ow ON ((ow.id = cp.wallet_id)))
     LEFT JOIN wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN project_clients pc ON ((pc.id = cp.client_id)))
     LEFT JOIN contacts ct ON ((ct.id = pc.contact_id)))
     LEFT JOIN client_commitments cc ON ((cc.id = cp.commitment_id)))
     LEFT JOIN organization_members om_created ON ((om_created.id = cp.created_by)))
     LEFT JOIN users u_created ON ((u_created.id = om_created.user_id)))
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
     LEFT JOIN currencies cur_out ON ((cur_out.id = fom_out.currency_id)))
     LEFT JOIN currencies cur_in ON ((cur_in.id = fom_in.currency_id)))
     LEFT JOIN organization_wallets ow_out ON ((ow_out.id = fom_out.wallet_id)))
     LEFT JOIN wallets w_out ON ((w_out.id = ow_out.wallet_id)))
     LEFT JOIN organization_wallets ow_in ON ((ow_in.id = fom_in.wallet_id)))
     LEFT JOIN wallets w_in ON ((w_in.id = ow_in.wallet_id)))
     LEFT JOIN organization_members om_created ON ((om_created.id = fo.created_by)))
     LEFT JOIN users u_created ON ((u_created.id = om_created.user_id)))
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
     LEFT JOIN currencies cur ON ((cur.id = fom_out.currency_id)))
     LEFT JOIN organization_wallets ow_out ON ((ow_out.id = fom_out.wallet_id)))
     LEFT JOIN wallets w_out ON ((w_out.id = ow_out.wallet_id)))
     LEFT JOIN organization_wallets ow_in ON ((ow_in.id = fom_in.wallet_id)))
     LEFT JOIN wallets w_in ON ((w_in.id = ow_in.wallet_id)))
     LEFT JOIN organization_members om_created ON ((om_created.id = fo.created_by)))
     LEFT JOIN users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((fo.type = 'wallet_transfer'::text) AND (fo.is_deleted = false));
```

### `user_acquisition_distribution_view`

```sql
SELECT COALESCE(NULLIF(ua.source, ''::text), NULLIF(ua.medium, ''::text), 'directo'::text) AS acquisition_source,
    count(*) AS user_count
   FROM user_acquisition ua
  WHERE (NOT (ua.user_id IN ( SELECT users.id
           FROM users
          WHERE (users.role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid))))
  GROUP BY COALESCE(NULLIF(ua.source, ''::text), NULLIF(ua.medium, ''::text), 'directo'::text)
  ORDER BY (count(*)) DESC
 LIMIT 6;
```

### `user_drop_off_view`

```sql
SELECT uvh.user_id,
    u.full_name,
    u.avatar_url,
    count(*) AS session_count,
    (round((sum(COALESCE(uvh.duration_seconds, 0)))::numeric, 0))::integer AS total_seconds
   FROM (user_view_history uvh
     JOIN users u ON ((u.id = uvh.user_id)))
  WHERE (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)
  GROUP BY uvh.user_id, u.full_name, u.avatar_url
 HAVING (count(*) <= 2)
  ORDER BY (count(*))
 LIMIT 8;
```

### `user_engagement_by_view_view`

```sql
SELECT user_view_history.view_name,
    count(*) AS session_count,
    (round(avg(COALESCE(user_view_history.duration_seconds, 0)), 0))::integer AS avg_duration_seconds,
    (round((avg(COALESCE(user_view_history.duration_seconds, 0)) / 60.0), 2))::double precision AS avg_duration_minutes,
    max(user_view_history.entered_at) AS last_activity_at
   FROM user_view_history
  WHERE ((NOT (user_view_history.user_id IN ( SELECT users.id
           FROM users
          WHERE (users.role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)))) AND (user_view_history.duration_seconds IS NOT NULL))
  GROUP BY user_view_history.view_name
  ORDER BY ((round(avg(COALESCE(user_view_history.duration_seconds, 0)), 0))::integer) DESC;
```

### `user_hourly_activity_view`

```sql
SELECT (EXTRACT(hour FROM user_view_history.entered_at))::integer AS hour,
    (lpad((EXTRACT(hour FROM user_view_history.entered_at))::text, 2, '0'::text) || ':00'::text) AS hour_label,
    count(*) AS session_count
   FROM user_view_history
  WHERE (NOT (user_view_history.user_id IN ( SELECT users.id
           FROM users
          WHERE (users.role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid))))
  GROUP BY (EXTRACT(hour FROM user_view_history.entered_at))
  ORDER BY ((EXTRACT(hour FROM user_view_history.entered_at))::integer);
```

### `user_monthly_growth_view`

```sql
SELECT to_char(users.created_at, 'YYYY-MM'::text) AS month,
    count(*) AS new_users
   FROM users
  WHERE (users.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)
  GROUP BY (to_char(users.created_at, 'YYYY-MM'::text))
  ORDER BY (to_char(users.created_at, 'YYYY-MM'::text));
```

### `user_presence_activity_view`

```sql
SELECT up.user_id,
    u.full_name,
    u.avatar_url,
    up.last_seen_at,
    up.current_view,
    up.status
   FROM (user_presence up
     JOIN users u ON ((u.id = up.user_id)))
  WHERE (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)
  ORDER BY up.last_seen_at DESC
 LIMIT 20;
```

### `user_stats_summary_view`

```sql
SELECT (( SELECT count(*) AS count
           FROM organizations
          WHERE (organizations.is_deleted = false)))::integer AS total_organizations,
    (( SELECT count(*) AS count
           FROM organizations
          WHERE ((organizations.is_deleted = false) AND (organizations.is_active = true))))::integer AS active_organizations,
    (( SELECT count(*) AS count
           FROM organizations
          WHERE ((organizations.is_deleted = false) AND (organizations.created_at >= date_trunc('month'::text, now())))))::integer AS new_organizations_this_month,
    (( SELECT count(DISTINCT users.id) AS count
           FROM users
          WHERE (users.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)))::integer AS total_users,
    (( SELECT count(DISTINCT user_presence.user_id) AS count
           FROM user_presence
          WHERE ((user_presence.last_seen_at >= (now() - '00:01:30'::interval)) AND (NOT (user_presence.user_id IN ( SELECT users.id
                   FROM users
                  WHERE (users.role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)))))))::integer AS active_users_now,
    (( SELECT count(DISTINCT user_view_history.user_id) AS count
           FROM user_view_history
          WHERE ((user_view_history.entered_at >= date_trunc('day'::text, now())) AND (NOT (user_view_history.user_id IN ( SELECT users.id
                   FROM users
                  WHERE (users.role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)))))))::integer AS active_users_today,
    (( SELECT count(DISTINCT users.id) AS count
           FROM users
          WHERE ((users.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid) AND (users.created_at >= date_trunc('month'::text, now())))))::integer AS new_users_this_month,
    (( SELECT count(*) AS count
           FROM projects))::integer AS total_projects,
    (( SELECT count(*) AS count
           FROM projects
          WHERE (projects.created_at >= date_trunc('month'::text, now()))))::integer AS new_projects_this_month,
    (( SELECT count(DISTINCT user_view_history.user_id) AS count
           FROM user_view_history
          WHERE ((user_view_history.entered_at >= date_trunc('day'::text, now())) AND (NOT (user_view_history.user_id IN ( SELECT users.id
                   FROM users
                  WHERE (users.role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)))))))::integer AS sessions_today,
    COALESCE((round(avg(COALESCE(uvh.duration_seconds, 0)), 0))::integer, 0) AS avg_session_duration
   FROM user_view_history uvh
  WHERE ((date(uvh.entered_at) = CURRENT_DATE) AND (NOT (uvh.user_id IN ( SELECT users.id
           FROM users
          WHERE (users.role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)))));
```

### `user_top_performers_view`

```sql
SELECT uvh.user_id,
    u.full_name,
    u.avatar_url,
    count(*) AS session_count,
    (round((sum(COALESCE(uvh.duration_seconds, 0)))::numeric, 0))::integer AS total_seconds
   FROM (user_view_history uvh
     JOIN users u ON ((u.id = uvh.user_id)))
  WHERE (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)
  GROUP BY uvh.user_id, u.full_name, u.avatar_url
  ORDER BY (count(*)) DESC
 LIMIT 8;
```

### `users_public_profile_view`

```sql
SELECT users.id,
    users.full_name,
    users.avatar_url,
    users.role_id
   FROM users;
```
