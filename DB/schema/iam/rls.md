# Database Schema (Auto-generated)
> Generated: 2026-02-21T14:12:15.483Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] RLS Policies (49)

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

### `external_actor_scopes` (2 policies)

#### ACTORES VEN SUS SCOPES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM iam.organization_external_actors ea
  WHERE ((ea.id = external_actor_scopes.external_actor_id) AND (ea.user_id = current_user_id()) AND (ea.is_active = true) AND (ea.is_deleted = false))))
```

#### MIEMBROS GESTIONAN SCOPES

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM iam.organization_external_actors ea
  WHERE ((ea.id = external_actor_scopes.external_actor_id) AND can_mutate_org(ea.organization_id, 'team.manage'::text))))
```
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM iam.organization_external_actors ea
  WHERE ((ea.id = external_actor_scopes.external_actor_id) AND can_mutate_org(ea.organization_id, 'team.manage'::text))))
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

### `organization_invitations` (4 policies)

#### INVITADOS VEN SU INVITACION

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text))
```

#### MIEMBROS CREAN INVITATIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'members.manage'::text)
```

#### MIEMBROS EDITAN INVITATIONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'members.manage'::text)
```

#### MIEMBROS VEN INVITATIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'members.view'::text)
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

### `organizations` (2 policies)

#### DUEÑOS EDITAN SU ORGANIZACION

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_deleted = false) AND ((owner_id = ( SELECT users.id
   FROM iam.users
  WHERE (users.auth_id = auth.uid()))) OR is_admin()))
```
- **WITH CHECK**:
```sql
((owner_id = ( SELECT users.id
   FROM iam.users
  WHERE (users.auth_id = auth.uid()))) OR is_admin())
```

#### USUARIOS VEN ORGANIZACIONES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((is_deleted = false) OR (owner_id = ( SELECT users.id
   FROM iam.users
  WHERE (users.auth_id = auth.uid()))) OR is_admin())
```

### `permissions` (1 policies)

#### TODOS VEN PERMISSIONS

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
     JOIN iam.users u ON ((u.auth_id = auth.uid())))
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
