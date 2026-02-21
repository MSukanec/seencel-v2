# Database Schema (Auto-generated)
> Generated: 2026-02-21T14:12:15.483Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] RLS Policies (43)

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

### `client_portal_settings` (3 policies)

#### MIEMBROS CREAN CLIENT_PORTAL_SETTINGS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS EDITAN CLIENT_PORTAL_SETTINGS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'commercial.manage'::text)
```

#### MIEMBROS VEN CLIENT_PORTAL_SETTINGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'commercial.view'::text)
```

### `countries` (1 policies)

#### TODOS VEN COUNTRIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
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
