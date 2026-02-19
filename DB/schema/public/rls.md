# Database Schema (Auto-generated)
> Generated: 2026-02-19T12:56:55.329Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] RLS Policies (371)

### `app_settings` (4 policies)

#### ADMIN EDITA CONFIGURACION DE LA APP

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMINS GESTIONAN APP_SETTINGS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN APP_SETTINGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

#### TODOS VEN CONFIGURACION DE LA APP

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `bank_transfer_payments` (3 policies)

#### ADMIN GESTIONAN USUARIOS CREAN BANK_TRANSFER_PAYMENTS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS CREAN BANK_TRANSFER_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS VEN USUARIOS CREAN BANK_TRANSFER_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `billing_profiles` (3 policies)

#### USUARIOS ACTUALIZAN BILLING_PROFILES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

#### USUARIOS CREAN BILLING_PROFILES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS VEN BILLING_PROFILES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `calendar_event_attendees` (3 policies)

#### MIEMBROS CREAN CALENDAR_EVENT_ATTENDEES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM calendar_events e
  WHERE ((e.id = calendar_event_attendees.event_id) AND can_mutate_org(e.organization_id, 'calendar.manage'::text))))
```

#### MIEMBROS EDITAN CALENDAR_EVENT_ATTENDEES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM calendar_events e
  WHERE ((e.id = calendar_event_attendees.event_id) AND can_mutate_org(e.organization_id, 'calendar.manage'::text))))
```

#### MIEMBROS VEN CALENDAR_EVENT_ATTENDEES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM calendar_events e
  WHERE ((e.id = calendar_event_attendees.event_id) AND can_view_org(e.organization_id, 'calendar.view'::text))))
```

### `calendar_event_reminders` (2 policies)

#### MIEMBROS CREAN CALENDAR_EVENT_REMINDERS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM calendar_events e
  WHERE ((e.id = calendar_event_reminders.event_id) AND can_mutate_org(e.organization_id, 'calendar.manage'::text))))
```

#### MIEMBROS VEN CALENDAR_EVENT_REMINDERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM calendar_events e
  WHERE ((e.id = calendar_event_reminders.event_id) AND can_view_org(e.organization_id, 'calendar.view'::text))))
```

### `calendar_events` (4 policies)

#### ACTORES VEN EVENTOS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((project_id IS NOT NULL) AND can_view_project(project_id))
```

#### MIEMBROS CREAN CALENDAR_EVENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'calendar.manage'::text)
```

#### MIEMBROS EDITAN CALENDAR_EVENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'calendar.manage'::text)
```

#### MIEMBROS VEN CALENDAR_EVENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'calendar.view'::text)
```

### `changelog_entries` (3 policies)

#### ADMIN ACTUALIZA CHANGELOG

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

#### ADMIN CREA CHANGELOG

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS VEN CHANGELOG PUBLICO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR (is_public = true))
```

### `client_commitments` (4 policies)

#### ACTORES VEN COMPROMISOS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN CLIENT_COMMITMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS EDITAN CLIENT_COMMITMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS VEN CLIENT_COMMITMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'clients.view'::text)
```

### `client_payment_schedule` (3 policies)

#### MIEMBROS CREAN CLIENT_PAYMENT_SCHEDULE

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS EDITAN CLIENT_PAYMENT_SCHEDULE

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS VEN CLIENT_PAYMENT_SCHEDULE

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'clients.view'::text)
```

### `client_payments` (4 policies)

#### ACTORES VEN PAGOS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN CLIENT_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS EDITAN CLIENT_PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS VEN CLIENT_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'clients.view'::text)
```

### `client_portal_settings` (3 policies)

#### MIEMBROS CREAN CLIENT_PORTAL_SETTINGS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS EDITAN CLIENT_PORTAL_SETTINGS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS VEN CLIENT_PORTAL_SETTINGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'clients.view'::text)
```

### `client_roles` (3 policies)

#### MIEMBROS CREAN CLIENT_ROLES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'clients.manage'::text))
```

#### MIEMBROS EDITAN CLIENT_ROLES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'clients.manage'::text))
```

#### MIEMBROS VEN CLIENT_ROLES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NULL) OR can_view_org(organization_id, 'clients.view'::text))
```

### `construction_dependencies` (4 policies)

#### MIEMBROS BORRAN CONSTRUCTION_DEPENDENCIES

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS CREAN CONSTRUCTION_DEPENDENCIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN CONSTRUCTION_DEPENDENCIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN CONSTRUCTION_DEPENDENCIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'projects.view'::text)
```

### `construction_task_material_snapshots` (3 policies)

#### MIEMBROS CREAN CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'projects.view'::text)
```

### `construction_tasks` (4 policies)

#### ACTORES VEN TAREAS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN CONSTRUCTION_TASKS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN CONSTRUCTION_TASKS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN CONSTRUCTION_TASKS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'projects.view'::text)
```

### `contact_categories` (3 policies)

#### MIEMBROS CREAN CONTACT_TYPES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS EDITAN CONTACT_TYPES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'contacts.manage'::text))
```

#### MIEMBROS VEN CONTACT_TYPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NULL) OR can_view_org(organization_id, 'contacts.view'::text))
```

### `contact_category_links` (4 policies)

#### MIEMBROS BORRAN CONTACT_TYPE_LINKS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS CREAN CONTACT_TYPE_LINKS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS EDITAN CONTACT_TYPE_LINKS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS VEN CONTACT_TYPE_LINKS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'contacts.view'::text)
```

### `contacts` (3 policies)

#### MIEMBROS CREAN CONTACTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS EDITAN CONTACTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'contacts.manage'::text)
```

#### MIEMBROS VEN CONTACTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_view_org(organization_id, 'contacts.view'::text) AND (is_deleted = false))
```

### `countries` (1 policies)

#### TODOS VEN COUNTRIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `coupon_courses` (3 policies)

#### ADMIN ACTUALIZA COUPON_COURSES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMIN CREA COUPON_COURSES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS VEN COUPON_COURSES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `coupon_plans` (3 policies)

#### ADMIN ACTUALIZA COUPON_PLANS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMIN CREA COUPON_PLANS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS VEN COUPON_PLANS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `coupon_redemptions` (3 policies)

#### ADMIN CREA COUPON_REDEMPTIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS ACTUALIZAN COUPON_REDEMPTIONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```
- **WITH CHECK**:
```sql
(is_self(user_id) OR is_admin())
```

#### USUARIOS VEN COUPON_REDEMPTIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `coupons` (4 policies)

#### ADMIN BORRA COUPONS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMIN CREA COUPONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN EDITA COUPONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN COUPONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

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

### `currencies` (1 policies)

#### TODOS VEN CURRENCIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `debug_signup_log` (1 policies)

#### Service role can do everything on debug_signup_log

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {service_role}
- **USING**:
```sql
true
```
- **WITH CHECK**:
```sql
true
```

### `exchange_rates` (2 policies)

#### ADMINS EDITAN EXCHANGE_RATES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN EXCHANGE_RATES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `external_actor_scopes` (2 policies)

#### ACTORES VEN SUS SCOPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM organization_external_actors ea
  WHERE ((ea.id = external_actor_scopes.external_actor_id) AND (ea.user_id = current_user_id()) AND (ea.is_active = true) AND (ea.is_deleted = false))))
```

#### MIEMBROS GESTIONAN SCOPES

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM organization_external_actors ea
  WHERE ((ea.id = external_actor_scopes.external_actor_id) AND can_mutate_org(ea.organization_id, 'team.manage'::text))))
```
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM organization_external_actors ea
  WHERE ((ea.id = external_actor_scopes.external_actor_id) AND can_mutate_org(ea.organization_id, 'team.manage'::text))))
```

### `feature_flag_categories` (3 policies)

#### ADMIN ACTUALIZA FEATURE_FLAG_CATEGORIES

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

#### ADMIN CREA FEATURE_FLAG_CATEGORIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN FEATURE_FLAG_CATEGORIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `feature_flags` (2 policies)

#### ADMIN ACTUALIZA FEATURE_FLAGS

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

#### TODOS VEN FEATURE_FLAGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `feedback` (2 policies)

#### USUARIOS CREAN FEEDBACK

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS VEN FEEDBACK

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `forum_categories` (3 policies)

#### ADMIN CREA FORUM_CATEGORIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN EDITA FORUM_CATEGORIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN FORUM_CATEGORIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_active = true)
```

### `forum_posts` (1 policies)

#### TODOS VEN FORUM_POSTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `general_cost_categories` (3 policies)

#### MIEMBROS ACTUALIZAN GENERAL_COST_CATEGORIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND can_mutate_org(organization_id, 'general_costs.manage'::text)))
```
- **WITH CHECK**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND can_mutate_org(organization_id, 'general_costs.manage'::text)))
```

#### MIEMBROS CREAN GENERAL_COST_CATEGORIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((is_system = false) AND can_mutate_org(organization_id, 'general_costs.manage'::text))
```

#### MIEMBROS VEN GENERAL_COST_CATEGORIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR ((is_deleted = false) AND ((is_system = true) OR can_view_org(organization_id, 'general_costs.view'::text))))
```

### `general_costs` (3 policies)

#### MIEMBROS ACTUALIZAN GENERAL_COSTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'general_costs.manage'::text)
```

#### MIEMBROS CREAN GENERAL_COSTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'general_costs.manage'::text)
```

#### MIEMBROS VEN GENERAL_COSTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_deleted = false) AND can_view_org(organization_id, 'general_costs.view'::text))
```

### `general_costs_payments` (4 policies)

#### MIEMBROS ACTUALIZAN GENERAL_COSTS_PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'general_costs.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'general_costs.manage'::text)
```

#### MIEMBROS CREAN GENERAL_COSTS_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'general_costs.manage'::text)
```

#### MIEMBROS ELIMINAN GENERAL_COSTS_PAYMENTS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'general_costs.manage'::text)
```

#### MIEMBROS VEN GENERAL_COSTS_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_deleted = false) AND can_view_org(organization_id, 'general_costs.view'::text))
```

### `global_announcements` (3 policies)

#### ADMIN ACTUALIZAN GLOBAL_ANNOUNCEMENTS

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

#### ADMIN CREAN GLOBAL_ANNOUNCEMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS VEN GLOBAL_ANNOUNCEMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_active = true) AND (starts_at <= now()) AND ((ends_at IS NULL) OR (ends_at >= now()))) OR is_admin())
```

### `hero_sections` (3 policies)

#### ADMIN ACTUALIZAN HERO_SECTIONS

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

#### ADMIN CREAN HERO_SECTIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN HERO_SECTIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_active = true) OR is_admin())
```

### `ia_import_mapping_patterns` (3 policies)

#### MIEMBROS CREAN IMPORT_PATTERNS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS EDITAN IMPORT_PATTERNS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN IMPORT_PATTERNS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `ia_import_value_patterns` (3 policies)

#### MIEMBROS CREAN VALUE_PATTERNS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS EDITAN VALUE_PATTERNS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

#### TODOS VEN VALUE_PATTERNS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `kanban_boards` (3 policies)

#### MIEMBROS CREAN KANBAN_BOARDS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'kanban.manage'::text)
```

#### MIEMBROS EDITAN KANBAN_BOARDS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'kanban.manage'::text)
```

#### MIEMBROS VEN KANBAN_BOARDS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'kanban.view'::text)
```

### `kanban_cards` (3 policies)

#### MIEMBROS CREAN KANBAN_CARDS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'kanban.manage'::text)
```

#### MIEMBROS EDITAN KANBAN_CARDS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'kanban.manage'::text)
```

#### MIEMBROS VEN KANBAN_CARDS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_view_org(organization_id, 'kanban.view'::text) AND (is_deleted = false))
```

### `kanban_lists` (3 policies)

#### MIEMBROS CREAN KANBAN_LISTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM kanban_boards b
  WHERE ((b.id = kanban_lists.board_id) AND can_mutate_org(b.organization_id, 'kanban.manage'::text))))
```

#### MIEMBROS EDITAN KANBAN_LISTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM kanban_boards b
  WHERE ((b.id = kanban_lists.board_id) AND can_mutate_org(b.organization_id, 'kanban.manage'::text))))
```

#### MIEMBROS VEN KANBAN_LISTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM kanban_boards b
  WHERE ((b.id = kanban_lists.board_id) AND can_view_org(b.organization_id, 'kanban.view'::text))))
```

### `labor_categories` (3 policies)

#### MIEMBROS CREAN LABOR_CATEGORIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((is_system = false) AND can_mutate_org(organization_id, 'labor.manage'::text))
```

#### MIEMBROS EDITAN LABOR_CATEGORIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = false) AND can_mutate_org(organization_id, 'labor.manage'::text))
```

#### MIEMBROS VEN LABOR_CATEGORIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = true) OR can_view_org(organization_id, 'labor.view'::text))
```

### `labor_levels` (2 policies)

#### ADMINS GESTIONAN LABOR_LEVELS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN LABOR_LEVELS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `labor_payments` (3 policies)

#### MIEMBROS CREAN LABOR_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'labor.manage'::text)
```

#### MIEMBROS EDITAN LABOR_PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'labor.manage'::text)
```

#### MIEMBROS VEN LABOR_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'labor.view'::text)
```

### `labor_prices` (4 policies)

#### MIEMBROS BORRAN LABOR_PRICES

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'catalog.manage'::text)
```

#### MIEMBROS CREAN LABOR_PRICES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'catalog.manage'::text)
```

#### MIEMBROS EDITAN LABOR_PRICES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'catalog.manage'::text)
```

#### MIEMBROS VEN LABOR_PRICES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'catalog.view'::text)
```

### `labor_roles` (2 policies)

#### ADMINS GESTIONAN LABOR_ROLES

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN LABOR_ROLES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `labor_types` (2 policies)

#### ADMINS GESTIONAN LABOR_TYPES

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN LABOR_TYPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `material_categories` (3 policies)

#### ADMIN ACTUALIZA MATERIAL_CATEGORIES

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

#### ADMIN CREA MATERIAL_CATEGORIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN MATERIAL_CATEGORIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `material_payments` (3 policies)

#### MIEMBROS CREAN MATERIAL_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'materials.manage'::text)
```

#### MIEMBROS EDITAN MATERIAL_PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'materials.manage'::text)
```

#### MIEMBROS VEN MATERIAL_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'materials.view'::text)
```

### `material_types` (3 policies)

#### MIEMBROS CREAN MATERIAL_TYPES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((is_system = false) AND can_mutate_org(organization_id, 'materials.manage'::text))
```

#### MIEMBROS EDITAN MATERIAL_TYPES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = false) AND can_mutate_org(organization_id, 'materials.manage'::text))
```

#### MIEMBROS VEN MATERIAL_TYPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = true) OR is_org_member(organization_id))
```

### `materials` (3 policies)

#### MIEMBROS CREAN MATERIALS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'materials.manage'::text)) OR ((organization_id IS NULL) AND (is_system = true) AND is_admin()))
```

#### MIEMBROS EDITAN MATERIALS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'materials.manage'::text)) OR ((is_system = true) AND is_admin()))
```

#### MIEMBROS VEN MATERIALS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NULL) AND (is_system = true)) OR can_view_org(organization_id, 'materials.view'::text))
```

### `media_file_folders` (4 policies)

#### MIEMBROS BORRAN MEDIA_FILE_FOLDERS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'media.manage'::text)
```

#### MIEMBROS CREAN MEDIA_FILE_FOLDERS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'media.manage'::text)
```

#### MIEMBROS EDITAN MEDIA_FILE_FOLDERS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'media.manage'::text)
```

#### MIEMBROS VEN MEDIA_FILE_FOLDERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'media.view'::text)
```

### `media_files` (3 policies)

#### MIEMBROS CREAN MEDIA_FILES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'media.manage'::text)) OR is_admin())
```

#### MIEMBROS EDITAN MEDIA_FILES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'media.manage'::text)) OR is_admin())
```

#### MIEMBROS Y PUBLICO VEN MEDIA_FILES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_public = true) OR ((organization_id IS NOT NULL) AND can_view_org(organization_id, 'media.view'::text)))
```

### `media_links` (4 policies)

#### MIEMBROS CREAN MEDIA_LINKS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'media.manage'::text)) OR is_admin())
```

#### MIEMBROS EDITAN MEDIA_LINKS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'media.manage'::text)) OR is_admin())
```

#### MIEMBROS ELIMINAN MEDIA_LINKS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'media.manage'::text)) OR is_admin())
```

#### MIEMBROS Y PUBLICO VEN MEDIA_LINKS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_public = true) OR ((organization_id IS NOT NULL) AND can_view_org(organization_id, 'media.view'::text)))
```

### `mp_preferences` (3 policies)

#### USUARIOS CREAN MP_PREFERENCES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(user_id = current_user_id())
```

#### USUARIOS EDITAN MP_PREFERENCES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((user_id = current_user_id()) AND (status = 'pending'::text)) OR is_admin())
```

#### USUARIOS VEN MP_PREFERENCES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((user_id = current_user_id()) OR is_admin())
```

### `notification_settings` (3 policies)

#### USUARIOS CREAN SUS NOTIFICATION_SETTINGS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS EDITAN SUS NOTIFICATION_SETTINGS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_self(user_id)
```
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS VEN SUS NOTIFICATION_SETTINGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_self(user_id)
```

### `notifications` (2 policies)

#### ADMINS GESTIONAN NOTIFICATIONS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS VEN NOTIFICATIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM user_notifications un
  WHERE ((un.notification_id = un.id) AND is_self(un.user_id))))
```

### `ops_alerts` (6 policies)

#### ADMIN ACTUALIZA ALERTAS OPS

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

#### ADMIN CREA ALERTAS OPS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN VE ALERTAS OPS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMINISTRADORES ACTUALIZAN ALERTAS DE OPS

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

#### ADMINISTRADORES INSERTAN ALERTAS DE OPS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMINISTRADORES VEN TODAS LAS ALERTAS DE OPS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

### `ops_check_runs` (5 policies)

#### ADMIN ACTUALIZA OPS CHECK RUNS

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

#### ADMIN CREA OPS CHECK RUNS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN VE OPS CHECK RUNS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMINISTRADORES INSERTAN EJECUCIONES DE CHECKS DE OPS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMINISTRADORES VEN EJECUCIONES DE CHECKS DE OPS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

### `ops_repair_actions` (3 policies)

#### ADMIN ACTUALIZA ACCIONES OPS

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

#### ADMIN CREA ACCIONES OPS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN VE ACCIONES OPS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

### `ops_repair_logs` (3 policies)

#### ADMIN ACTUALIZA LOGS OPS

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

#### ADMIN CREA LOGS OPS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN VE LOGS OPS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

### `organization_activity_logs` (1 policies)

#### MIEMBROS VEN ACTIVITY_LOGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR is_org_member(organization_id))
```

### `organization_billing_cycles` (2 policies)

#### ADMINS GESTIONAN BILLING_CYCLES

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'billing.manage'::text)
```

#### MIEMBROS VEN BILLING_CYCLES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'billing.view'::text)
```

### `organization_external_actors` (3 policies)

#### MIEMBROS CREAN EXTERNAL_ACTORS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'team.manage'::text)
```

#### MIEMBROS EDITAN EXTERNAL_ACTORS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'team.manage'::text)
```

#### MIEMBROS Y ACTORES VEN EXTERNAL_ACTORS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_view_org(organization_id, 'team.view'::text) OR is_self(user_id))
```

### `organization_member_events` (2 policies)

#### MIEMBROS VEN MEMBER_EVENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'billing.view'::text)
```

#### SISTEMA CREA MEMBER_EVENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'members.manage'::text)
```

### `organization_members` (3 policies)

#### MIEMBROS  EDITAN ORGANIZATION_MEMBERS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_mutate_org(organization_id, 'members.manage'::text) OR is_self(user_id))
```

#### MIEMBROS CREAN ORGANIZATION_MEMBERS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'members.manage'::text)
```

#### MIEMBROS VEN ORGANIZATION_MEMBERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_org_member(organization_id) OR is_admin() OR is_self(user_id))
```

### `organization_subscriptions` (2 policies)

#### ADMINS GESTIONAN SUBSCRIPTIONS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'billing.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'billing.manage'::text)
```

#### MIEMBROS VEN SUBSCRIPTIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'billing.view'::text)
```

### `organizations` (2 policies)

#### DUEÑOS EDITAN SU ORGANIZACION

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_deleted = false) AND ((owner_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = auth.uid()))) OR is_admin()))
```
- **WITH CHECK**:
```sql
((owner_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = auth.uid()))) OR is_admin())
```

#### USUARIOS VEN ORGANIZACIONES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_deleted = false) OR (owner_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = auth.uid()))) OR is_admin())
```

### `payment_events` (2 policies)

#### ADMINS EDITAN PAYMENT_EVENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMINS VEN PAYMENT_EVENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

### `payments` (4 policies)

#### ADMIN BORRAN PAYMENTS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMINS CREAN PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMINS EDITAN PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### USUARIOS VEN SUS PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR ((organization_id IS NOT NULL) AND can_view_org(organization_id, 'billing.view'::text)) OR is_admin())
```

### `paypal_preferences` (3 policies)

#### USUARIOS CREAN PAYPAL_PREFERENCES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(user_id = current_user_id())
```

#### USUARIOS EDITAN PAYPAL_PREFERENCES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(user_id = current_user_id())
```
- **WITH CHECK**:
```sql
(user_id = current_user_id())
```

#### USUARIOS VEN PAYPAL_PREFERENCES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(user_id = current_user_id())
```

### `permissions` (1 policies)

#### TODOS VEN PERMISSIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `plans` (2 policies)

#### ADMINS GESTIONAN PLANS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN PLANS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `project_access` (2 policies)

#### MIEMBROS GESTIONAN ACCESO

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'team.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'team.manage'::text)
```

#### USUARIOS VEN SU ACCESO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(user_id = current_user_id())
```

### `project_clients` (4 policies)

#### ACTORES VEN CLIENTES DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN PROJECT_CLIENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS EDITAN PROJECT_CLIENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'clients.manage'::text)
```

#### MIEMBROS VEN PROJECT_CLIENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'clients.view'::text)
```

### `project_data` (4 policies)

#### ACTORES VEN DATOS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS ACTUALIZAN PROJECT_DATA

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS CREAN PROJECT_DATA

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN PROJECT_DATA

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_view_org(organization_id, 'projects.view'::text) OR (is_public = true))
```

### `project_labor` (3 policies)

#### MIEMBROS CREAN PROJECT_LABOR

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'labor.manage'::text)
```

#### MIEMBROS EDITAN PROJECT_LABOR

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'labor.manage'::text)
```

#### MIEMBROS VEN PROJECT_LABOR

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'labor.view'::text)
```

### `project_modalities` (3 policies)

#### MIEMBROS ACTUALIZAN PROJECT_MODALITIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS CREAN PROJECT_MODALITIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN PROJECT_MODALITIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR ((is_deleted = false) AND ((organization_id IS NULL) OR can_view_org(organization_id, 'projects.view'::text))))
```

### `project_types` (3 policies)

#### MIEMBROS ACTUALIZAN PROJECT_TYPES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS CREAN PROJECT_TYPES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN PROJECT_TYPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR ((is_deleted = false) AND ((organization_id IS NULL) OR can_view_org(organization_id, 'projects.view'::text))))
```

### `projects` (4 policies)

#### ACTORES VEN PROYECTOS CON ACCESO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(id)
```

#### MIEMBROS CREAN PROJECTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN PROJECTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN PROJECTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_view_org(organization_id, 'projects.view'::text) OR (EXISTS ( SELECT 1
   FROM project_data pd
  WHERE ((pd.project_id = projects.id) AND (pd.is_public = true)))))
```

### `quote_items` (4 policies)

#### ACTORES VEN ITEMS PRESUPUESTO DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN QUOTE_ITEMS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'quotes.manage'::text)
```

#### MIEMBROS EDITAN QUOTE_ITEMS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'quotes.manage'::text)
```
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'quotes.manage'::text)
```

#### MIEMBROS VEN QUOTE_ITEMS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'quotes.view'::text)
```

### `quotes` (4 policies)

#### ACTORES VEN PRESUPUESTOS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS ACTUALIZAN QUOTES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'quotes.manage'::text)
```

#### MIEMBROS CREAN QUOTES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'quotes.manage'::text)
```

#### MIEMBROS VEN QUOTES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'quotes.view'::text)
```

### `role_permissions` (4 policies)

#### MIEMBROS BORRAN ROLE_PERMISSIONS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'roles.manage'::text)
```

#### MIEMBROS CREAN ROLE_PERMISSIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'roles.manage'::text)
```

#### MIEMBROS EDITAN ROLE_PERMISSIONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'roles.manage'::text)
```

#### MIEMBROS VEN ROLE_PERMISSIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'roles.view'::text)
```

### `roles` (4 policies)

#### INVITADOS VEN ROLES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(id IN ( SELECT oi.role_id
   FROM (iam.organization_invitations oi
     JOIN users u ON ((u.auth_id = auth.uid())))
  WHERE ((oi.email = u.email) AND (oi.status = 'pending'::text) AND (oi.role_id IS NOT NULL))))
```

#### MIEMBROS CREAN ROLES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
((is_system = false) AND (organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'roles.manage'::text))
```

#### MIEMBROS EDITAN ROLES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = false) AND (organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'roles.manage'::text))
```

#### MIEMBROS VEN ROLES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = true) OR can_view_org(organization_id, 'roles.view'::text))
```

### `site_log_types` (3 policies)

#### MIEMBROS CREAN SITE_LOG_TYPES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((organization_id IS NULL) AND is_admin()) OR ((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'sitelog.manage'::text)))
```

#### MIEMBROS EDITAN SITE_LOG_TYPES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NULL) AND is_admin()) OR ((organization_id IS NOT NULL) AND can_mutate_org(organization_id, 'sitelog.manage'::text)))
```

#### MIEMBROS VEN SITE_LOG_TYPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((organization_id IS NULL) OR can_view_org(organization_id, 'sitelog.view'::text))
```

### `site_logs` (4 policies)

#### ACTORES VEN BITACORAS DEL PROYECTO

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_project(project_id)
```

#### MIEMBROS CREAN SITE_LOGS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'sitelog.manage'::text)
```

#### MIEMBROS EDITAN SITE_LOGS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'sitelog.manage'::text)
```

#### MIEMBROS VEN SITE_LOGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'sitelog.view'::text)
```

### `subcontract_payments` (3 policies)

#### MIEMBROS CREAN SUBCONTRACT_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'subcontracts.manage'::text)
```

#### MIEMBROS EDITAN SUBCONTRACT_PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'subcontracts.manage'::text)
```

#### MIEMBROS VEN SUBCONTRACT_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'subcontracts.view'::text)
```

### `subcontracts` (3 policies)

#### MIEMBROS CREAN SUBCONTRACTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'subcontracts.manage'::text)
```

#### MIEMBROS EDITAN SUBCONTRACTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'subcontracts.manage'::text)
```

#### MIEMBROS VEN SUBCONTRACTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'subcontracts.view'::text)
```

### `subscription_notifications_log` (2 policies)

#### ADMINS VEN SUBSCRIPTION_NOTIFICATIONS_LOG

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### SISTEMA CREA SUBSCRIPTION_NOTIFICATIONS_LOG

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

### `support_messages` (6 policies)

#### ADMINS CREAN SUPPORT_MESSAGES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(is_admin() AND (sender = 'admin'::text))
```

#### ADMINS EDITAN SUPPORT_MESSAGES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMINS VEN SUPPORT_MESSAGES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### USUARIOS CREAN SUS SUPPORT_MESSAGES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(is_self(user_id) AND (sender = 'user'::text))
```

#### USUARIOS EDITAN SUS SUPPORT_MESSAGES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_self(user_id)
```

#### USUARIOS VEN SUS SUPPORT_MESSAGES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_self(user_id)
```

### `system_error_logs` (1 policies)

#### ADMINS VEN SYSTEM_ERROR_LOGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

### `system_job_logs` (3 policies)

#### ADMIN ACTUALIZA SYSTEM JOB LOGS

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

#### ADMIN CREA SYSTEM JOB LOGS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN VE SYSTEM JOB LOGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

### `task_actions` (2 policies)

#### ADMINS GESTIONAN TASK_KIND

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_KIND

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_division_actions` (2 policies)

#### ADMINS GESTIONAN TASK_DIVISION_KINDS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_DIVISION_KINDS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_division_elements` (2 policies)

#### ADMINS GESTIONAN TASK_DIVISION_ELEMENTS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_DIVISION_ELEMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_divisions` (3 policies)

#### MIEMBROS CREAN TASK_DIVISIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND can_mutate_org(organization_id, 'projects.manage'::text)))
```

#### MIEMBROS EDITAN TASK_DIVISIONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND can_mutate_org(organization_id, 'projects.manage'::text)))
```

#### MIEMBROS VEN TASK_DIVISIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = true) OR can_view_org(organization_id, 'projects.view'::text))
```

### `task_element_actions` (2 policies)

#### ADMINS GESTIONAN TASK_KIND_ELEMENTS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_KIND_ELEMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_element_parameters` (2 policies)

#### ADMINS GESTIONAN TASK_ELEMENT_PARAMETERS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_ELEMENT_PARAMETERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_elements` (2 policies)

#### ADMINS GESTIONAN TASK_ELEMENTS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_ELEMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_parameter_options` (2 policies)

#### ADMINS GESTIONAN TASK_PARAMETER_OPTIONS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_PARAMETER_OPTIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_parameters` (2 policies)

#### ADMINS GESTIONAN TASK_PARAMETERS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_PARAMETERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `task_recipe_labor` (3 policies)

#### MIEMBROS CREAN TASK_RECIPE_LABOR

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN TASK_RECIPE_LABOR

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN TASK_RECIPE_LABOR

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'projects.view'::text)
```

### `task_recipe_materials` (3 policies)

#### MIEMBROS CREAN TASK_RECIPE_MATERIALS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN TASK_RECIPE_MATERIALS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN TASK_RECIPE_MATERIALS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'projects.view'::text)
```

### `task_recipes` (3 policies)

#### MIEMBROS CREAN TASK_RECIPES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS EDITAN TASK_RECIPES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'projects.manage'::text)
```

#### MIEMBROS VEN TASK_RECIPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_view_org(organization_id, 'projects.view'::text) OR ((is_public = true) AND (is_deleted = false)))
```

### `task_task_parameters` (2 policies)

#### ADMINS GESTIONAN TASK_TASK_PARAMETERS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN TASK_TASK_PARAMETERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `tasks` (4 policies)

#### MIEMBROS VEN TASKS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = true) OR can_view_org(organization_id, 'tasks.view'::text))
```

#### MIEMBROS Y ADMINS ACTUALIZAN TASKS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = false) AND can_mutate_org(organization_id, 'tasks.manage'::text)) OR ((is_system = true) AND is_admin()))
```

#### MIEMBROS Y ADMINS CREAN TASKS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((is_system = false) AND can_mutate_org(organization_id, 'tasks.manage'::text)) OR ((is_system = true) AND is_admin()))
```

#### MIEMBROS Y ADMINS ELIMINAN TASKS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = false) AND can_mutate_org(organization_id, 'tasks.manage'::text)) OR ((is_system = true) AND is_admin()))
```

### `tax_labels` (2 policies)

#### ADMINS GESTIONAN TAX_LABELS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN TAX_LABELS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
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

### `unit_categories` (2 policies)

#### ADMINS GESTIONAN UNIT_CATEGORIES

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN UNIT_CATEGORIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `units` (3 policies)

#### MIEMBROS CREAN UNITS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND is_org_member(organization_id)))
```

#### MIEMBROS EDITAN UNITS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_system = true) AND is_admin()) OR ((is_system = false) AND is_org_member(organization_id)))
```

#### TODOS VEN UNITS SISTEMA O DE SU ORG

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_system = true) OR is_org_member(organization_id) OR is_admin())
```

### `user_acquisition` (3 policies)

#### ADMINS VEN USER_ACQUISITION

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### USUARIOS CREAN SU USER_ACQUISITION

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS VEN SU USER_ACQUISITION

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_self(user_id)
```

### `user_data` (2 policies)

#### USUARIOS EDITAN USER_DATA

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

#### USUARIOS VEN USER_DATA

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `user_notifications` (3 policies)

#### ADMIN CREAN USER_NOTIFICATIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS ACTUALIZAN USER_NOTIFICATIONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```
- **WITH CHECK**:
```sql
(is_self(user_id) OR is_admin())
```

#### USUARIOS VEN USER_NOTIFICATIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `user_organization_preferences` (3 policies)

#### USUARIOS ACTUALIZAN USER_ORGANIZATION_PREFERENCES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_self(user_id)
```
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS INSERTAN USER_ORGANIZATION_PREFERENCES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS VEN USER_ORGANIZATION_PREFERENCES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_self(user_id)
```

### `user_preferences` (2 policies)

#### USUARIOS ACTUALIZAN SUS PREFERENCIAS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```
- **WITH CHECK**:
```sql
(is_self(user_id) OR is_admin())
```

#### USUARIOS VEN SUS PREFERENCIAS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `user_view_history` (3 policies)

#### ADMINISTRADORES ACTUALIZAN HISTORIAL DE VISTAS

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

#### USUARIOS CREAN SU HISTORIAL DE VISTAS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS VEN SU HISTORIAL DE VISTAS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `users` (2 policies)

#### USUARIOS EDITAN USERS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(auth_id = auth.uid())
```

#### USUARIOS VEN USERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(auth_id = auth.uid())
```

### `wallets` (2 policies)

#### ADMINS GESTIONAN WALLETS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS AUTENTICADOS VEN WALLETS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
true
```
