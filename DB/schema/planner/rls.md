# Database Schema (Auto-generated)
> Generated: 2026-02-22T20:08:16.861Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] RLS Policies (25)

### `attachments` (3 policies)

#### MIEMBROS CREAN ATTACHMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS EDITAN ATTACHMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN ATTACHMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_org_member(organization_id) AND (is_deleted = false))
```

### `attendees` (3 policies)

#### MIEMBROS CREAN ATTENDEES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS EDITAN ATTENDEES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN ATTENDEES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_org_member(organization_id) AND (is_deleted = false))
```

### `board_permissions` (2 policies)

#### MIEMBROS CREAN BOARD_PERMISSIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN BOARD_PERMISSIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_org_member(organization_id) AND (is_deleted = false))
```

### `checklist_items` (3 policies)

#### MIEMBROS CREAN CHECKLIST_ITEMS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS EDITAN CHECKLIST_ITEMS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN CHECKLIST_ITEMS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_org_member(organization_id) AND (is_deleted = false))
```

### `checklists` (3 policies)

#### MIEMBROS CREAN CHECKLISTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS EDITAN CHECKLISTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN CHECKLISTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_org_member(organization_id) AND (is_deleted = false))
```

### `comments` (3 policies)

#### MIEMBROS CREAN COMMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS EDITAN COMMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN COMMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_org_member(organization_id) AND (is_deleted = false))
```

### `item_labels` (2 policies)

#### MIEMBROS CREAN ITEM_LABELS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN ITEM_LABELS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

### `item_watchers` (2 policies)

#### MIEMBROS CREAN ITEM_WATCHERS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN ITEM_WATCHERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_org_member(organization_id) AND (is_deleted = false))
```

### `mentions` (2 policies)

#### MIEMBROS CREAN MENTIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN MENTIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_org_member(organization_id) AND (is_deleted = false))
```

### `reminders` (2 policies)

#### MIEMBROS CREAN REMINDERS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MIEMBROS VEN REMINDERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_org_member(organization_id) AND (is_deleted = false))
```
