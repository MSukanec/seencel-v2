# Database Schema (Auto-generated)
> Generated: 2026-02-26T22:25:46.213Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [ACADEMY] Indexes (24, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| course_details | course_details_course_id_uniq | `CREATE UNIQUE INDEX course_details_course_id_uniq ON academy.course_details U...` |
| course_enrollments | enroll_unique | `CREATE UNIQUE INDEX enroll_unique ON academy.course_enrollments USING btree (...` |
| course_enrollments | idx_course_enrollments_user | `CREATE INDEX idx_course_enrollments_user ON academy.course_enrollments USING ...` |
| course_faqs | course_faqs_course_id_sort_idx | `CREATE INDEX course_faqs_course_id_sort_idx ON academy.course_faqs USING btre...` |
| course_instructors | course_instructors_not_deleted_idx | `CREATE INDEX course_instructors_not_deleted_idx ON academy.course_instructors...` |
| course_instructors | idx_course_instructors_user | `CREATE INDEX idx_course_instructors_user ON academy.course_instructors USING ...` |
| course_lesson_notes | lesson_markers_idx | `CREATE INDEX lesson_markers_idx ON academy.course_lesson_notes USING btree (l...` |
| course_lesson_notes | lesson_notes_by_user_lesson | `CREATE INDEX lesson_notes_by_user_lesson ON academy.course_lesson_notes USING...` |
| course_lesson_notes | uniq_summary_per_user_lesson | `CREATE UNIQUE INDEX uniq_summary_per_user_lesson ON academy.course_lesson_not...` |
| course_lesson_progress | idx_course_lesson_progress_user_completed | `CREATE INDEX idx_course_lesson_progress_user_completed ON academy.course_less...` |
| course_lesson_progress | idx_lesson_progress_favorites | `CREATE INDEX idx_lesson_progress_favorites ON academy.course_lesson_progress ...` |
| course_lesson_progress | idx_progress_user_updated_at | `CREATE INDEX idx_progress_user_updated_at ON academy.course_lesson_progress U...` |
| course_lesson_progress | lesson_progress_unique | `CREATE UNIQUE INDEX lesson_progress_unique ON academy.course_lesson_progress ...` |
| course_lessons | idx_course_lessons_module_active | `CREATE INDEX idx_course_lessons_module_active ON academy.course_lessons USING...` |
| course_lessons | lessons_module_id_sort_index_idx | `CREATE INDEX lessons_module_id_sort_index_idx ON academy.course_lessons USING...` |
| course_modules | course_modules_course_id_sort_index_idx | `CREATE INDEX course_modules_course_id_sort_index_idx ON academy.course_module...` |
| course_modules | course_modules_not_deleted_idx | `CREATE INDEX course_modules_not_deleted_idx ON academy.course_modules USING b...` |
| courses | courses_not_deleted_idx | `CREATE INDEX courses_not_deleted_idx ON academy.courses USING btree (is_delet...` |
| courses | courses_slug_key | `CREATE UNIQUE INDEX courses_slug_key ON academy.courses USING btree (slug)` |
| testimonials | idx_testimonials_active | `CREATE INDEX idx_testimonials_active ON academy.testimonials USING btree (is_...` |
| testimonials | idx_testimonials_course | `CREATE INDEX idx_testimonials_course ON academy.testimonials USING btree (cou...` |
| testimonials | idx_testimonials_course_user | `CREATE INDEX idx_testimonials_course_user ON academy.testimonials USING btree...` |
| testimonials | idx_testimonials_org | `CREATE INDEX idx_testimonials_org ON academy.testimonials USING btree (organi...` |
| testimonials | idx_testimonials_user | `CREATE INDEX idx_testimonials_user ON academy.testimonials USING btree (user_...` |
