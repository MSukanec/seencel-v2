# Database Schema (Auto-generated)
> Generated: 2026-02-21T13:42:37.043Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] Indexes (32, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| calendar_event_attendees | calendar_event_attendees_event_id_member_id_key | `CREATE UNIQUE INDEX calendar_event_attendees_event_id_member_id_key ON planne...` |
| calendar_event_attendees | idx_event_attendees_event_id | `CREATE INDEX idx_event_attendees_event_id ON planner.calendar_event_attendees...` |
| calendar_event_attendees | idx_event_attendees_member_id | `CREATE INDEX idx_event_attendees_member_id ON planner.calendar_event_attendee...` |
| calendar_event_reminders | idx_event_reminders_event_id | `CREATE INDEX idx_event_reminders_event_id ON planner.calendar_event_reminders...` |
| calendar_event_reminders | idx_event_reminders_remind_at | `CREATE INDEX idx_event_reminders_remind_at ON planner.calendar_event_reminder...` |
| calendar_events | idx_calendar_events_org_id | `CREATE INDEX idx_calendar_events_org_id ON planner.calendar_events USING btre...` |
| calendar_events | idx_calendar_events_project_id | `CREATE INDEX idx_calendar_events_project_id ON planner.calendar_events USING ...` |
| calendar_events | idx_calendar_events_source | `CREATE INDEX idx_calendar_events_source ON planner.calendar_events USING btre...` |
| calendar_events | idx_calendar_events_start_at | `CREATE INDEX idx_calendar_events_start_at ON planner.calendar_events USING bt...` |
| calendar_events | idx_calendar_events_status | `CREATE INDEX idx_calendar_events_status ON planner.calendar_events USING btre...` |
| kanban_boards | idx_kanban_boards_active | `CREATE INDEX idx_kanban_boards_active ON planner.kanban_boards USING btree (o...` |
| kanban_boards | idx_kanban_boards_org | `CREATE INDEX idx_kanban_boards_org ON planner.kanban_boards USING btree (orga...` |
| kanban_boards | idx_kanban_boards_org_project | `CREATE INDEX idx_kanban_boards_org_project ON planner.kanban_boards USING btr...` |
| kanban_boards | idx_kanban_boards_project | `CREATE INDEX idx_kanban_boards_project ON planner.kanban_boards USING btree (...` |
| kanban_boards | idx_kanban_boards_template | `CREATE INDEX idx_kanban_boards_template ON planner.kanban_boards USING btree ...` |
| kanban_card_labels | idx_kanban_card_labels_card | `CREATE INDEX idx_kanban_card_labels_card ON planner.kanban_card_labels USING ...` |
| kanban_card_labels | idx_kanban_card_labels_label | `CREATE INDEX idx_kanban_card_labels_label ON planner.kanban_card_labels USING...` |
| kanban_cards | idx_kanban_cards_assigned | `CREATE INDEX idx_kanban_cards_assigned ON planner.kanban_cards USING btree (a...` |
| kanban_cards | idx_kanban_cards_board | `CREATE INDEX idx_kanban_cards_board ON planner.kanban_cards USING btree (boar...` |
| kanban_cards | idx_kanban_cards_completed | `CREATE INDEX idx_kanban_cards_completed ON planner.kanban_cards USING btree (...` |
| kanban_cards | idx_kanban_cards_due | `CREATE INDEX idx_kanban_cards_due ON planner.kanban_cards USING btree (due_da...` |
| kanban_cards | idx_kanban_cards_list | `CREATE INDEX idx_kanban_cards_list ON planner.kanban_cards USING btree (list_id)` |
| kanban_cards | idx_kanban_cards_org | `CREATE INDEX idx_kanban_cards_org ON planner.kanban_cards USING btree (organi...` |
| kanban_cards | idx_kanban_cards_priority | `CREATE INDEX idx_kanban_cards_priority ON planner.kanban_cards USING btree (p...` |
| kanban_cards | idx_kanban_cards_project | `CREATE INDEX idx_kanban_cards_project ON planner.kanban_cards USING btree (pr...` |
| kanban_checklist_items | idx_kanban_checklist_items_checklist | `CREATE INDEX idx_kanban_checklist_items_checklist ON planner.kanban_checklist...` |
| kanban_checklist_items | idx_kanban_checklist_items_incomplete | `CREATE INDEX idx_kanban_checklist_items_incomplete ON planner.kanban_checklis...` |
| kanban_checklists | idx_kanban_checklists_card | `CREATE INDEX idx_kanban_checklists_card ON planner.kanban_checklists USING bt...` |
| kanban_labels | idx_kanban_labels_org | `CREATE INDEX idx_kanban_labels_org ON planner.kanban_labels USING btree (orga...` |
| kanban_labels | kanban_labels_name_org_unique | `CREATE UNIQUE INDEX kanban_labels_name_org_unique ON planner.kanban_labels US...` |
| kanban_lists | idx_kanban_lists_active | `CREATE INDEX idx_kanban_lists_active ON planner.kanban_lists USING btree (boa...` |
| kanban_lists | idx_kanban_lists_org | `CREATE INDEX idx_kanban_lists_org ON planner.kanban_lists USING btree (organi...` |
