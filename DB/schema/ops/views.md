# Database Schema (Auto-generated)
> Generated: 2026-02-21T12:04:42.647Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [OPS] Views (14)

### `ops.analytics_at_risk_users_view`

```sql
SELECT analytics_user_session_summary_view.id,
    analytics_user_session_summary_view.full_name,
    analytics_user_session_summary_view.avatar_url,
    analytics_user_session_summary_view.created_at,
    analytics_user_session_summary_view.session_count,
    analytics_user_session_summary_view.last_activity_at
   FROM ops.analytics_user_session_summary_view
  WHERE ((analytics_user_session_summary_view.created_at < (now() - '7 days'::interval)) AND (analytics_user_session_summary_view.session_count < 3))
  ORDER BY analytics_user_session_summary_view.session_count, analytics_user_session_summary_view.last_activity_at NULLS FIRST
 LIMIT 10;
```

### `ops.analytics_bounce_rate_view`

```sql
WITH session_pages AS (
         SELECT h.session_id,
            count(*) AS page_count
           FROM (iam.user_view_history h
             JOIN iam.users u ON ((u.id = h.user_id)))
          WHERE ((h.session_id IS NOT NULL) AND (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid))
          GROUP BY h.session_id
        )
 SELECT count(*) FILTER (WHERE (session_pages.page_count = 1)) AS bounced_sessions,
    count(*) AS total_sessions,
    round((((count(*) FILTER (WHERE (session_pages.page_count = 1)))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 1) AS bounce_rate_percent
   FROM session_pages;
```

### `ops.analytics_general_kpis_view`

```sql
SELECT ( SELECT count(*) AS count
           FROM iam.organizations
          WHERE (organizations.is_active = true)) AS total_organizations,
    ( SELECT count(*) AS count
           FROM projects.projects
          WHERE (projects.is_deleted = false)) AS total_projects,
    ( SELECT count(*) AS count
           FROM iam.users
          WHERE ((users.is_active = true) AND (users.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid))) AS total_users;
```

### `ops.analytics_hourly_activity_view`

```sql
SELECT (EXTRACT(hour FROM h.entered_at))::integer AS hour_of_day,
    count(*) AS activity_count
   FROM (iam.user_view_history h
     JOIN iam.users u ON ((u.id = h.user_id)))
  WHERE ((h.entered_at > (now() - '7 days'::interval)) AND (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid))
  GROUP BY (EXTRACT(hour FROM h.entered_at))
  ORDER BY (EXTRACT(hour FROM h.entered_at));
```

### `ops.analytics_page_engagement_view`

```sql
SELECT h.view_name,
    count(*) AS visits,
    avg(h.duration_seconds) AS avg_duration,
    count(DISTINCT h.session_id) AS unique_sessions
   FROM (iam.user_view_history h
     JOIN iam.users u ON ((u.id = h.user_id)))
  WHERE (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)
  GROUP BY h.view_name;
```

### `ops.analytics_realtime_overview_view`

```sql
SELECT count(*) AS active_users
   FROM (iam.user_presence up
     JOIN iam.users u ON ((u.id = up.user_id)))
  WHERE ((up.last_seen_at > (now() - '00:05:00'::interval)) AND (up.status = 'online'::text) AND (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid));
```

### `ops.analytics_session_duration_view`

```sql
SELECT round(avg(sessions.total_duration), 0) AS avg_duration_seconds,
    round((avg(sessions.total_duration) / (60)::numeric), 1) AS avg_duration_minutes,
    count(*) AS total_sessions
   FROM ( SELECT h.session_id,
            sum(h.duration_seconds) AS total_duration
           FROM (iam.user_view_history h
             JOIN iam.users u ON ((u.id = h.user_id)))
          WHERE ((h.session_id IS NOT NULL) AND (h.duration_seconds IS NOT NULL) AND (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid))
          GROUP BY h.session_id) sessions;
```

### `ops.analytics_top_users_view`

```sql
SELECT u.id,
    u.full_name,
    u.avatar_url,
    count(DISTINCT h.session_id) AS total_sessions,
    count(*) AS total_pageviews,
    COALESCE(sum(h.duration_seconds), (0)::bigint) AS total_time_seconds
   FROM (iam.users u
     JOIN iam.user_view_history h ON ((h.user_id = u.id)))
  WHERE (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)
  GROUP BY u.id, u.full_name, u.avatar_url
  ORDER BY (count(*)) DESC;
```

### `ops.analytics_user_growth_view`

```sql
SELECT date_trunc('day'::text, users.created_at) AS date,
    count(*) AS new_users
   FROM iam.users
  WHERE (users.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid)
  GROUP BY (date_trunc('day'::text, users.created_at))
  ORDER BY (date_trunc('day'::text, users.created_at)) DESC;
```

### `ops.analytics_user_journeys_view`

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
   FROM (iam.user_view_history h
     JOIN iam.users u ON ((u.id = h.user_id)))
  WHERE ((h.session_id IS NOT NULL) AND (u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid) AND (h.entered_at > (now() - '7 days'::interval)))
  ORDER BY h.session_id, h.entered_at;
```

### `ops.analytics_user_session_summary_view`

```sql
SELECT u.id,
    u.full_name,
    u.avatar_url,
    u.created_at,
    count(DISTINCT h.session_id) AS session_count,
    max(h.entered_at) AS last_activity_at,
    sum(h.duration_seconds) AS total_time_seconds
   FROM (iam.users u
     LEFT JOIN iam.user_view_history h ON ((h.user_id = u.id)))
  WHERE ((u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid) AND (u.is_active = true))
  GROUP BY u.id, u.full_name, u.avatar_url, u.created_at;
```

### `ops.analytics_users_by_country_view`

```sql
SELECT c.id AS country_id,
    c.name AS country_name,
    c.alpha_2 AS country_code,
    count(ud.user_id) AS user_count
   FROM (iam.user_data ud
     JOIN countries c ON ((c.id = ud.country)))
  WHERE (ud.country IS NOT NULL)
  GROUP BY c.id, c.name, c.alpha_2
  ORDER BY (count(ud.user_id)) DESC;
```

### `ops.ops_alerts_enriched_view`

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
   FROM ((((((ops.ops_alerts oa
     LEFT JOIN iam.users u ON ((u.id = oa.user_id)))
     LEFT JOIN iam.organizations o ON ((o.id = oa.organization_id)))
     LEFT JOIN billing.plans pl ON ((pl.id = o.plan_id)))
     LEFT JOIN billing.payments p ON ((p.id = oa.payment_id)))
     LEFT JOIN iam.users ack_u ON ((ack_u.id = oa.ack_by)))
     LEFT JOIN iam.users res_u ON ((res_u.id = oa.resolved_by)));
```

### `ops.system_errors_enriched_view`

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
   FROM (((audit.system_error_logs sel
     LEFT JOIN iam.users u ON ((u.id = ((sel.context ->> 'user_id'::text))::uuid)))
     LEFT JOIN iam.organizations o ON ((o.id = ((sel.context ->> 'organization_id'::text))::uuid)))
     LEFT JOIN billing.plans pl ON ((pl.id = o.plan_id)));
```
