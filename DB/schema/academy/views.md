# Database Schema (Auto-generated)
> Generated: 2026-02-21T03:04:42.923Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [ACADEMY] Views (7)

### `academy.course_lesson_completions_view`

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
   FROM (((academy.course_lesson_progress clp
     JOIN academy.course_lessons cl ON (((cl.id = clp.lesson_id) AND (cl.is_active = true))))
     JOIN academy.course_modules cm ON (((cm.id = cl.module_id) AND (cm.is_deleted = false))))
     JOIN academy.courses c ON ((c.id = cm.course_id)));
```

### `academy.course_lessons_total_view`

```sql
SELECT c.id AS course_id,
    (count(l.id))::integer AS total_lessons
   FROM ((academy.courses c
     JOIN academy.course_modules m ON (((m.course_id = c.id) AND (m.is_deleted = false))))
     JOIN academy.course_lessons l ON (((l.module_id = m.id) AND (l.is_active = true))))
  GROUP BY c.id;
```

### `academy.course_progress_view`

```sql
SELECT t.course_id,
    d.user_id,
    round(((100.0 * (d.done_lessons)::numeric) / (NULLIF(t.total_lessons, 0))::numeric), 2) AS progress_pct,
    d.done_lessons,
    t.total_lessons
   FROM (academy.course_lessons_total_view t
     JOIN academy.course_user_course_done_view d ON ((d.course_id = t.course_id)));
```

### `academy.course_user_active_days_view`

```sql
SELECT DISTINCT p.user_id,
    date(COALESCE(p.completed_at, p.updated_at)) AS day
   FROM academy.course_lesson_progress p;
```

### `academy.course_user_course_done_view`

```sql
SELECT m.course_id,
    p.user_id,
    (count(*) FILTER (WHERE (COALESCE(p.is_completed, false) OR (p.progress_pct >= (95)::numeric))))::integer AS done_lessons
   FROM ((academy.course_lesson_progress p
     JOIN academy.course_lessons l ON (((l.id = p.lesson_id) AND (l.is_active = true))))
     JOIN academy.course_modules m ON (((m.id = l.module_id) AND (m.is_deleted = false))))
  GROUP BY m.course_id, p.user_id;
```

### `academy.course_user_global_progress_view`

```sql
SELECT cpv.user_id,
    (sum(cpv.done_lessons))::integer AS done_lessons_total,
    (sum(cpv.total_lessons))::integer AS total_lessons_total,
    round(((100.0 * (sum(cpv.done_lessons))::numeric) / (NULLIF(sum(cpv.total_lessons), 0))::numeric), 1) AS progress_pct
   FROM academy.course_progress_view cpv
  GROUP BY cpv.user_id;
```

### `academy.course_user_study_time_view`

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
   FROM (academy.course_lesson_progress p
     JOIN academy.course_lessons l ON (((l.id = p.lesson_id) AND (l.is_active = true))))
  GROUP BY p.user_id;
```
