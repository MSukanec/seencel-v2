# Database Schema (Auto-generated)
> Generated: 2026-02-26T22:25:46.213Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] RLS Policies (38)

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

### `boards` (3 policies)

#### MEMBERS INSERT BOARDS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MEMBERS SELECT BOARDS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
((is_deleted = false) AND is_org_member(organization_id))
```

#### MEMBERS UPDATE BOARDS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
is_org_member(organization_id)
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

### `item_labels` (3 policies)

#### MIEMBROS BORRAN ITEM_LABELS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

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

### `items` (3 policies)

#### MEMBERS INSERT ITEMS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MEMBERS SELECT ITEMS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
((is_deleted = false) AND is_org_member(organization_id))
```

#### MEMBERS UPDATE ITEMS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
is_org_member(organization_id)
```

### `labels` (3 policies)

#### MEMBERS INSERT LABELS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MEMBERS SELECT LABELS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
is_org_member(organization_id)
```

#### MEMBERS UPDATE LABELS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
is_org_member(organization_id)
```

### `lists` (3 policies)

#### MEMBERS INSERT LISTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **WITH CHECK**:
```sql
is_org_member(organization_id)
```

#### MEMBERS SELECT LISTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
((is_deleted = false) AND is_org_member(organization_id))
```

#### MEMBERS UPDATE LISTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {authenticated}
- **USING**:
```sql
is_org_member(organization_id)
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
