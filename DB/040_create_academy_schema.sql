-- ============================================================
-- 040_create_academy_schema.sql
-- Migra el dominio "academy" desde public a un schema dedicado.
--
-- Después de ejecutar:
--   1. Agregar 'academy' al Extra Search Path en Supabase Dashboard
--      (Settings > API > Extra Search Path)
--   2. Ejecutar `npm run db:schema` para regenerar DB/schema/
-- ============================================================

-- ============================================================
-- PASO 1: Crear schema y permisos
-- ============================================================

CREATE SCHEMA IF NOT EXISTS academy;

GRANT USAGE ON SCHEMA academy TO anon, authenticated, service_role;

-- ============================================================
-- PASO 2: Mover tablas (en orden de dependencias FK)
-- ============================================================

-- 2.1 Tablas base (sin dependencias internas al dominio)
ALTER TABLE IF EXISTS public.course_instructors     SET SCHEMA academy;
ALTER TABLE IF EXISTS public.courses                SET SCHEMA academy;

-- 2.2 Tablas que dependen de courses / course_instructors
ALTER TABLE IF EXISTS public.course_details         SET SCHEMA academy;  -- → courses, course_instructors
ALTER TABLE IF EXISTS public.course_modules         SET SCHEMA academy;  -- → courses
ALTER TABLE IF EXISTS public.course_faqs            SET SCHEMA academy;  -- → courses
ALTER TABLE IF EXISTS public.course_enrollments     SET SCHEMA academy;  -- → courses

-- 2.3 Tablas que dependen de course_modules
ALTER TABLE IF EXISTS public.course_lessons         SET SCHEMA academy;  -- → course_modules

-- 2.4 Tablas que dependen de course_lessons
ALTER TABLE IF EXISTS public.course_lesson_progress SET SCHEMA academy;  -- → course_lessons
ALTER TABLE IF EXISTS public.course_lesson_notes    SET SCHEMA academy;  -- → course_lessons

-- Grants sobre tablas
GRANT ALL ON ALL TABLES    IN SCHEMA academy TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA academy TO anon, authenticated, service_role;

-- ============================================================
-- PASO 3: Reemplazar vistas (DROP en public + CREATE en academy)
-- Orden: de menor a mayor número de dependencias.
-- ============================================================

-- 3.1 course_user_active_days_view
DROP VIEW IF EXISTS public.course_user_active_days_view CASCADE;
CREATE OR REPLACE VIEW academy.course_user_active_days_view AS
SELECT DISTINCT p.user_id,
    date(COALESCE(p.completed_at, p.updated_at)) AS day
FROM academy.course_lesson_progress p;

-- 3.2 course_user_study_time_view
DROP VIEW IF EXISTS public.course_user_study_time_view CASCADE;
CREATE OR REPLACE VIEW academy.course_user_study_time_view AS
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
    JOIN academy.course_lessons l ON ((l.id = p.lesson_id) AND (l.is_active = true)))
GROUP BY p.user_id;

-- 3.3 course_user_course_done_view
DROP VIEW IF EXISTS public.course_user_course_done_view CASCADE;
CREATE OR REPLACE VIEW academy.course_user_course_done_view AS
SELECT m.course_id,
    p.user_id,
    (count(*) FILTER (WHERE (COALESCE(p.is_completed, false) OR (p.progress_pct >= (95)::numeric))))::integer AS done_lessons
FROM ((academy.course_lesson_progress p
    JOIN academy.course_lessons l ON ((l.id = p.lesson_id) AND (l.is_active = true)))
    JOIN academy.course_modules m ON ((m.id = l.module_id) AND (m.is_deleted = false)))
GROUP BY m.course_id, p.user_id;

-- 3.4 course_lessons_total_view
DROP VIEW IF EXISTS public.course_lessons_total_view CASCADE;
CREATE OR REPLACE VIEW academy.course_lessons_total_view AS
SELECT c.id AS course_id,
    (count(l.id))::integer AS total_lessons
FROM ((academy.courses c
    JOIN academy.course_modules m ON ((m.course_id = c.id) AND (m.is_deleted = false)))
    JOIN academy.course_lessons l ON ((l.module_id = m.id) AND (l.is_active = true)))
GROUP BY c.id;

-- 3.5 course_lesson_completions_view
DROP VIEW IF EXISTS public.course_lesson_completions_view CASCADE;
CREATE OR REPLACE VIEW academy.course_lesson_completions_view AS
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
    JOIN academy.course_lessons cl ON ((cl.id = clp.lesson_id) AND (cl.is_active = true)))
    JOIN academy.course_modules cm ON ((cm.id = cl.module_id) AND (cm.is_deleted = false)))
    JOIN academy.courses c ON (c.id = cm.course_id));

-- 3.6 course_progress_view (depende de 3.3 y 3.4)
DROP VIEW IF EXISTS public.course_progress_view CASCADE;
CREATE OR REPLACE VIEW academy.course_progress_view AS
SELECT t.course_id,
    d.user_id,
    round(((100.0 * (d.done_lessons)::numeric) / (NULLIF(t.total_lessons, 0))::numeric), 2) AS progress_pct,
    d.done_lessons,
    t.total_lessons
FROM (academy.course_lessons_total_view t
    JOIN academy.course_user_course_done_view d ON (d.course_id = t.course_id));

-- 3.7 course_user_global_progress_view (depende de 3.6)
DROP VIEW IF EXISTS public.course_user_global_progress_view CASCADE;
CREATE OR REPLACE VIEW academy.course_user_global_progress_view AS
SELECT cpv.user_id,
    (sum(cpv.done_lessons))::integer AS done_lessons_total,
    (sum(cpv.total_lessons))::integer AS total_lessons_total,
    round(((100.0 * (sum(cpv.done_lessons))::numeric) / (NULLIF(sum(cpv.total_lessons), 0))::numeric), 1) AS progress_pct
FROM academy.course_progress_view cpv
GROUP BY cpv.user_id;

-- Grants sobre vistas
GRANT SELECT ON ALL TABLES IN SCHEMA academy TO anon, authenticated, service_role;

-- ============================================================
-- PASO 4: Verificación (ejecutar manualmente después)
-- ============================================================

-- Debe mostrar 9 tablas:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'academy'
ORDER BY table_name;

-- Debe mostrar 7 vistas:
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'academy'
ORDER BY table_name;
