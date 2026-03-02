# Database Schema (Auto-generated)
> Generated: 2026-03-01T21:32:52.143Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [ACADEMY] RLS Policies (33)

### `course_details` (3 policies)

#### ADMIN ACTUALIZA COURSE_DETAILS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN CREA COURSE_DETAILS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN COURSE_DETAILS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `course_enrollments` (4 policies)

#### ADMIN ACTUALIZA COURSE_ENROLLMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMIN CREA COURSE_ENROLLMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN ELIMINA COURSE_ENROLLMENTS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### USUARIOS Y ADMIN VEN COURSE_ENROLLMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `course_faqs` (3 policies)

#### ADMIN ACTUALIZA COURSE_FAQS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMIN CREA COURSE_FAQS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN COURSE_FAQS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `course_instructors` (3 policies)

#### ADMIN ACTUALIZAN COURSE_INSTRUCTORS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN CREAN COURSE_INSTRUCTORS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN  COURSE_INSTRUCTORS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `course_lesson_notes` (4 policies)

#### USUARIOS ACTUALIZAN COURSE_LESSON_NOTES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_self(user_id)
```

#### USUARIOS BORRAN COURSE_LESSON_NOTES

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_self(user_id)
```

#### USUARIOS CREAN COURSE_LESSON_NOTES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS VEN COURSE_LESSON_NOTES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `course_lesson_progress` (3 policies)

#### USUARIOS ACTUALIZAN COURSE_LESSON_PROGRESS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_self(user_id)
```

#### USUARIOS CREAN COURSE_LESSON_PROGRESS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS Y ADMIN VEN COURSE_LESSON_PROGRESS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `course_lessons` (3 policies)

#### ADMIN ACTUALIZA COURSE_LESSONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMIN CREA COURSE_LESSONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN COURSE_LESSONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `course_modules` (3 policies)

#### ADMIN ACTUALIZA COURSE_MODULES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMIN CREA COURSE_MODULES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN COURSE_MODULES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_deleted = false)
```

### `courses` (4 policies)

#### ADMIN ACTUALIZA COURSES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN CREA COURSES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN VE COURSES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN COURSES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_deleted = false) AND (is_active = true) AND (visibility = 'public'::text))
```

### `testimonials` (3 policies)

#### ADMIN ACTUALIZAN TESTIMONIALS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN TESTIMONIALS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_active = true) AND (is_deleted = false)) OR is_admin())
```

#### USUARIOS CREAN TESTIMONIALS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(is_self(user_id) OR is_admin())
```
