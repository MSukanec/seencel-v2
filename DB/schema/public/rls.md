# Database Schema (Auto-generated)
> Generated: 2026-02-27T17:03:38.530Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] RLS Policies (30)

### `app_settings` (2 policies)

#### ADMINS MANAGE APP_SETTINGS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.is_admin()
```
- **WITH CHECK**:
```sql
iam.is_admin()
```

#### ANYONE SELECTS APP_SETTINGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `countries` (1 policies)

#### ANYONE SELECTS COUNTRIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `feature_flag_categories` (3 policies)

#### ADMINS INSERT FEATURE_FLAG_CATEGORIES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.is_admin()
```

#### ADMINS UPDATE FEATURE_FLAG_CATEGORIES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.is_admin()
```
- **WITH CHECK**:
```sql
iam.is_admin()
```

#### ANYONE SELECTS FEATURE_FLAG_CATEGORIES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `feature_flags` (3 policies)

#### ADMINS INSERT FEATURE_FLAGS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.is_admin()
```

#### ADMINS UPDATE FEATURE_FLAGS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.is_admin()
```
- **WITH CHECK**:
```sql
iam.is_admin()
```

#### ANYONE SELECTS FEATURE_FLAGS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `global_announcements` (3 policies)

#### ADMINS INSERT GLOBAL_ANNOUNCEMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.is_admin()
```

#### ADMINS UPDATE GLOBAL_ANNOUNCEMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.is_admin()
```
- **WITH CHECK**:
```sql
iam.is_admin()
```

#### ANYONE SELECTS GLOBAL_ANNOUNCEMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((is_active = true) AND (starts_at <= now()) AND ((ends_at IS NULL) OR (ends_at >= now()))) OR iam.is_admin())
```

### `hero_sections` (3 policies)

#### ADMINS INSERT HERO_SECTIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.is_admin()
```

#### ADMINS UPDATE HERO_SECTIONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.is_admin()
```
- **WITH CHECK**:
```sql
iam.is_admin()
```

#### ANYONE SELECTS HERO_SECTIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_active = true) OR iam.is_admin())
```

### `import_batches` (4 policies)

#### MEMBERS DELETE IMPORT_BATCHES

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.is_org_member(organization_id)
```

#### MEMBERS INSERT IMPORT_BATCHES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.is_org_member(organization_id)
```

#### MEMBERS SELECT IMPORT_BATCHES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.is_org_member(organization_id)
```

#### MEMBERS UPDATE IMPORT_BATCHES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.is_org_member(organization_id)
```

### `media_file_folders` (4 policies)

#### MEMBERS DELETE MEDIA_FILE_FOLDERS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.is_org_member(organization_id)
```

#### MEMBERS INSERT MEDIA_FILE_FOLDERS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
iam.is_org_member(organization_id)
```

#### MEMBERS SELECT MEDIA_FILE_FOLDERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.is_org_member(organization_id)
```

#### MEMBERS UPDATE MEDIA_FILE_FOLDERS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
iam.is_org_member(organization_id)
```

### `media_files` (3 policies)

#### MEMBERS INSERT MEDIA_FILES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((organization_id IS NOT NULL) AND iam.is_org_member(organization_id)) OR iam.is_admin())
```

#### MEMBERS UPDATE MEDIA_FILES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NOT NULL) AND iam.is_org_member(organization_id)) OR iam.is_admin())
```

#### MEMBERS_OR_PUBLIC SELECT MEDIA_FILES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_public = true) OR ((organization_id IS NOT NULL) AND iam.is_org_member(organization_id)) OR iam.is_admin())
```

### `media_links` (4 policies)

#### MEMBERS DELETE MEDIA_LINKS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NOT NULL) AND iam.is_org_member(organization_id)) OR iam.is_admin())
```

#### MEMBERS INSERT MEDIA_LINKS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(((organization_id IS NOT NULL) AND iam.is_org_member(organization_id)) OR iam.is_admin())
```

#### MEMBERS UPDATE MEDIA_LINKS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((organization_id IS NOT NULL) AND iam.is_org_member(organization_id)) OR iam.is_admin())
```

#### MEMBERS_OR_PUBLIC SELECT MEDIA_LINKS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_public = true) OR ((organization_id IS NOT NULL) AND iam.is_org_member(organization_id)) OR iam.is_admin())
```
