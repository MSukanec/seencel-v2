# Database Schema (Auto-generated)
> Generated: 2026-02-22T15:06:00.294Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [NOTIFICATIONS] RLS Policies (8)

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
   FROM notifications.user_notifications un
  WHERE ((un.notification_id = un.id) AND is_self(un.user_id))))
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
