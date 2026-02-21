# Database Schema (Auto-generated)
> Generated: 2026-02-21T12:04:42.647Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] RLS Policies (18)

### `calendar_event_attendees` (3 policies)

#### MIEMBROS CREAN CALENDAR_EVENT_ATTENDEES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM planner.calendar_events e
  WHERE ((e.id = calendar_event_attendees.event_id) AND can_mutate_org(e.organization_id, 'planner.manage'::text))))
```

#### MIEMBROS EDITAN CALENDAR_EVENT_ATTENDEES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM planner.calendar_events e
  WHERE ((e.id = calendar_event_attendees.event_id) AND can_mutate_org(e.organization_id, 'planner.manage'::text))))
```

#### MIEMBROS VEN CALENDAR_EVENT_ATTENDEES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM planner.calendar_events e
  WHERE ((e.id = calendar_event_attendees.event_id) AND can_view_org(e.organization_id, 'planner.view'::text))))
```

### `calendar_event_reminders` (2 policies)

#### MIEMBROS CREAN CALENDAR_EVENT_REMINDERS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM planner.calendar_events e
  WHERE ((e.id = calendar_event_reminders.event_id) AND can_mutate_org(e.organization_id, 'planner.manage'::text))))
```

#### MIEMBROS VEN CALENDAR_EVENT_REMINDERS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM planner.calendar_events e
  WHERE ((e.id = calendar_event_reminders.event_id) AND can_view_org(e.organization_id, 'planner.view'::text))))
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
can_mutate_org(organization_id, 'planner.manage'::text)
```

#### MIEMBROS EDITAN CALENDAR_EVENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'planner.manage'::text)
```

#### MIEMBROS VEN CALENDAR_EVENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'planner.view'::text)
```

### `kanban_boards` (3 policies)

#### MIEMBROS CREAN KANBAN_BOARDS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'planner.manage'::text)
```

#### MIEMBROS EDITAN KANBAN_BOARDS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'planner.manage'::text)
```

#### MIEMBROS VEN KANBAN_BOARDS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_view_org(organization_id, 'planner.view'::text)
```

### `kanban_cards` (3 policies)

#### MIEMBROS CREAN KANBAN_CARDS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'planner.manage'::text)
```

#### MIEMBROS EDITAN KANBAN_CARDS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
can_mutate_org(organization_id, 'planner.manage'::text)
```

#### MIEMBROS VEN KANBAN_CARDS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(can_view_org(organization_id, 'planner.view'::text) AND (is_deleted = false))
```

### `kanban_lists` (3 policies)

#### MIEMBROS CREAN KANBAN_LISTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(EXISTS ( SELECT 1
   FROM planner.kanban_boards b
  WHERE ((b.id = kanban_lists.board_id) AND can_mutate_org(b.organization_id, 'planner.manage'::text))))
```

#### MIEMBROS EDITAN KANBAN_LISTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM planner.kanban_boards b
  WHERE ((b.id = kanban_lists.board_id) AND can_mutate_org(b.organization_id, 'planner.manage'::text))))
```

#### MIEMBROS VEN KANBAN_LISTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(EXISTS ( SELECT 1
   FROM planner.kanban_boards b
  WHERE ((b.id = kanban_lists.board_id) AND can_view_org(b.organization_id, 'planner.view'::text))))
```
