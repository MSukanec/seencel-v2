# Detalle de TABLAS y VISTAS del modulo de CURSOS en DB:

# Tabla course_details:

create table public.course_details (
  id uuid not null default gen_random_uuid (),
  course_id uuid not null,
  badge_text text null,
  highlights text[] null,
  preview_video_id text null,
  seo_keywords text[] null,
  landing_sections jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  instructor_id uuid null,
  endorsement_image_path text null,
  endorsement_title text null default 'Avalado por...'::text,
  endorsement_description text null,
  constraint course_details_pkey primary key (id),
  constraint course_details_course_id_uniq unique (course_id),
  constraint course_details_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint course_details_instructor_id_fkey foreign KEY (instructor_id) references course_instructors (id) on delete set null
) TABLESPACE pg_default;

create trigger course_details_set_updated_at BEFORE
update on course_details for EACH row
execute FUNCTION update_timestamp ();


# Tabla course_enrollments:

create table public.course_enrollments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  course_id uuid not null,
  status text not null default 'active'::text,
  started_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint course_enrollments_pkey primary key (id),
  constraint enroll_unique unique (user_id, course_id),
  constraint course_enrollments_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint course_enrollments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint course_enrollments_status_chk check (
    (
      status = any (
        array[
          'active'::text,
          'completed'::text,
          'cancelled'::text,
          'expired'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_course_enrollments_user on public.course_enrollments using btree (user_id) TABLESPACE pg_default;

create trigger course_enrollments_set_updated_at BEFORE
update on course_enrollments for EACH row
execute FUNCTION update_timestamp ();

# Tabla course_faqs:

create table public.course_faqs (
  id uuid not null default gen_random_uuid (),
  course_id uuid not null,
  question text not null,
  answer text not null,
  sort_index integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint course_faqs_pkey primary key (id),
  constraint course_faqs_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists course_faqs_course_id_sort_idx on public.course_faqs using btree (course_id, sort_index) TABLESPACE pg_default;

create trigger course_faqs_set_updated_at BEFORE
update on course_faqs for EACH row
execute FUNCTION update_timestamp ();

# Tabla course_instructors:

create table public.course_instructors (
  id uuid not null default gen_random_uuid (),
  name text not null,
  title text null,
  bio text null,
  avatar_path text null,
  credentials text[] null,
  linkedin_url text null,
  youtube_url text null,
  instagram_url text null,
  website_url text null,
  user_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint course_instructors_pkey primary key (id),
  constraint course_instructors_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint course_instructors_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_course_instructors_user on public.course_instructors using btree (user_id) TABLESPACE pg_default
where
  (user_id is not null);

create index IF not exists course_instructors_not_deleted_idx on public.course_instructors using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger course_instructors_set_updated_at BEFORE
update on course_instructors for EACH row
execute FUNCTION update_timestamp ();

# Vista course_lesson_completions_view:

create view public.course_lesson_completions_view as
select
  clp.id as progress_id,
  clp.user_id,
  clp.lesson_id,
  clp.is_completed,
  clp.completed_at,
  clp.last_position_sec,
  clp.updated_at,
  cl.title as lesson_title,
  cm.id as module_id,
  cm.title as module_title,
  cm.course_id,
  c.title as course_title,
  c.slug as course_slug
from
  course_lesson_progress clp
  join course_lessons cl on cl.id = clp.lesson_id
  and cl.is_active = true
  join course_modules cm on cm.id = cl.module_id
  and cm.is_deleted = false
  join courses c on c.id = cm.course_id;

# Tabla course_lesson_notes:

create table public.course_lesson_notes (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  lesson_id uuid not null,
  body text not null,
  time_sec integer null,
  is_pinned boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  note_type text not null default 'marker'::text,
  constraint course_lesson_notes_pkey primary key (id),
  constraint course_lesson_notes_lesson_id_fkey foreign KEY (lesson_id) references course_lessons (id) on delete CASCADE,
  constraint course_lesson_notes_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint course_lesson_notes_time_nonneg_chk check (
    (
      (time_sec is null)
      or (time_sec >= 0)
    )
  ),
  constraint course_lesson_notes_type_chk check (
    (
      note_type = any (
        array[
          'summary'::text,
          'marker'::text,
          'todo'::text,
          'question'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_summary_per_user_lesson on public.course_lesson_notes using btree (user_id, lesson_id) TABLESPACE pg_default
where
  (note_type = 'summary'::text);

create index IF not exists lesson_notes_by_user_lesson on public.course_lesson_notes using btree (user_id, lesson_id, created_at desc) TABLESPACE pg_default;

create index IF not exists lesson_markers_idx on public.course_lesson_notes using btree (lesson_id, user_id, time_sec) TABLESPACE pg_default
where
  (note_type = 'marker'::text);

create trigger course_lesson_notes_set_updated_at BEFORE
update on course_lesson_notes for EACH row
execute FUNCTION update_timestamp ();

# Tabla course_lesson_progress:

create table public.course_lesson_progress (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  lesson_id uuid not null,
  progress_pct numeric(5, 2) not null default 0,
  last_position_sec integer not null default 0,
  completed_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  is_completed boolean not null default false,
  is_favorite boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint lesson_progress_pkey primary key (id),
  constraint lesson_progress_unique unique (user_id, lesson_id),
  constraint lesson_progress_lesson_id_fkey foreign KEY (lesson_id) references course_lessons (id) on delete CASCADE,
  constraint lesson_progress_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_lesson_progress_favorites on public.course_lesson_progress using btree (user_id, is_favorite) TABLESPACE pg_default
where
  (is_favorite = true);

create index IF not exists idx_progress_user_updated_at on public.course_lesson_progress using btree (user_id, updated_at) TABLESPACE pg_default;

create index IF not exists idx_course_lesson_progress_user_completed on public.course_lesson_progress using btree (user_id, is_completed, completed_at desc) TABLESPACE pg_default;

create trigger trg_progress_fill_user BEFORE INSERT on course_lesson_progress for EACH row
execute FUNCTION fill_progress_user_id_from_auth ();
 
# Tabla course_lessons:

create table public.course_lessons (
  id uuid not null default gen_random_uuid (),
  module_id uuid null,
  title text not null,
  duration_sec integer null,
  free_preview boolean not null default false,
  sort_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  video_provider public.video_provider_t not null default 'vimeo'::video_provider_t,
  video_id text null,
  constraint lessons_pkey primary key (id),
  constraint course_lessons_module_id_fkey foreign KEY (module_id) references course_modules (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists lessons_module_id_sort_index_idx on public.course_lessons using btree (module_id, sort_index) TABLESPACE pg_default;

create index IF not exists idx_course_lessons_module_active on public.course_lessons using btree (module_id, is_active) TABLESPACE pg_default;

create trigger course_lessons_set_updated_at BEFORE
update on course_lessons for EACH row
execute FUNCTION update_timestamp ();

# Vista course_lessons_total_view:

create view public.course_lessons_total_view as
select
  c.id as course_id,
  count(l.id)::integer as total_lessons
from
  courses c
  join course_modules m on m.course_id = c.id
  and m.is_deleted = false
  join course_lessons l on l.module_id = m.id
  and l.is_active = true
group by
  c.id;

# Tabla course_modules:

create table public.course_modules (
  id uuid not null default gen_random_uuid (),
  course_id uuid not null,
  title text not null,
  sort_index integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  description text null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  image_path text null,
  constraint course_modules_pkey primary key (id),
  constraint course_modules_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists course_modules_course_id_sort_index_idx on public.course_modules using btree (course_id, sort_index) TABLESPACE pg_default;

create index IF not exists course_modules_not_deleted_idx on public.course_modules using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger course_modules_set_updated_at BEFORE
update on course_modules for EACH row
execute FUNCTION update_timestamp ();

# Vista course_progress_view:

create view public.course_progress_view as
select
  t.course_id,
  d.user_id,
  round(
    100.0 * d.done_lessons::numeric / NULLIF(t.total_lessons, 0)::numeric,
    2
  ) as progress_pct,
  d.done_lessons,
  t.total_lessons
from
  course_lessons_total_view t
  join course_user_course_done_view d on d.course_id = t.course_id;

# Vista course_user_active_days_view:

create view public.course_user_active_days_view as
select distinct
  p.user_id,
  date (COALESCE(p.completed_at, p.updated_at)) as day
from
  course_lesson_progress p;

# Vista course_user_course_done_view:

create view public.course_user_course_done_view as
select
  m.course_id,
  p.user_id,
  count(*) filter (
    where
      COALESCE(p.is_completed, false)
      or p.progress_pct >= 95::numeric
  )::integer as done_lessons
from
  course_lesson_progress p
  join course_lessons l on l.id = p.lesson_id
  join course_modules m on m.id = l.module_id
where
  l.is_active = true
group by
  m.course_id,
  p.user_id;

# Vista course_user_global_progress_view:

create view public.course_user_global_progress_view as
select
  course_progress_view.user_id,
  sum(course_progress_view.done_lessons)::integer as done_lessons_total,
  sum(course_progress_view.total_lessons)::integer as total_lessons_total,
  round(
    100.0 * sum(course_progress_view.done_lessons)::numeric / NULLIF(sum(course_progress_view.total_lessons), 0)::numeric,
    1
  ) as progress_pct
from
  course_progress_view
group by
  course_progress_view.user_id;

# Vista course_user_study_time_view:

create view public.course_user_study_time_view as
select
  p.user_id,
  sum(
    case
      when COALESCE(p.is_completed, false) then COALESCE(l.duration_sec, 0)
      else LEAST(
        COALESCE(l.duration_sec, 0),
        COALESCE(p.last_position_sec, 0)
      )
    end
  ) as seconds_lifetime,
  sum(
    case
      when date_trunc(
        'month'::text,
        COALESCE(p.completed_at, p.updated_at)
      ) = date_trunc('month'::text, now()) then case
        when COALESCE(p.is_completed, false) then COALESCE(l.duration_sec, 0)
        else LEAST(
          COALESCE(l.duration_sec, 0),
          COALESCE(p.last_position_sec, 0)
        )
      end
      else 0
    end
  ) as seconds_this_month
from
  course_lesson_progress p
  join course_lessons l on l.id = p.lesson_id
group by
  p.user_id;

# Tabla courses:

create table public.courses (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  title text not null,
  short_description text null,
  is_active boolean not null default true,
  visibility text not null default 'public'::text,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  price numeric null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  status text not null default 'available'::text,
  image_path text null,
  constraint courses_pkey primary key (id),
  constraint courses_slug_key unique (slug),
  constraint courses_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint courses_status_check check (
    (
      status = any (
        array[
          'available'::text,
          'coming_soon'::text,
          'maintenance'::text
        ]
      )
    )
  ),
  constraint courses_visibility_check check (
    (
      visibility = any (
        array['public'::text, 'private'::text, 'unlisted'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists courses_not_deleted_idx on public.courses using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger courses_set_updated_at BEFORE
update on courses for EACH row
execute FUNCTION update_timestamp ();