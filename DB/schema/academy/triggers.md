# Database Schema (Auto-generated)
> Generated: 2026-02-21T21:03:12.424Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [ACADEMY] Triggers (10)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| course_details | course_details_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_enrollments | course_enrollments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_enrollments | notify_course_enrollment | AFTER | INSERT | EXECUTE FUNCTION notifications.notify_course_enrollment() |
| course_faqs | course_faqs_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_instructors | course_instructors_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_lesson_notes | course_lesson_notes_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_lesson_progress | trg_progress_fill_user | BEFORE | INSERT | EXECUTE FUNCTION academy.fill_progress_user_id_from_auth() |
| course_lessons | course_lessons_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| course_modules | course_modules_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
| courses | courses_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_timestamp() |
