# Database Schema (Auto-generated)
> Generated: 2026-02-21T12:04:42.647Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] Triggers (29)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| calendar_events | on_calendar_event_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION audit.log_calendar_event_activity() |
| calendar_events | set_updated_by_calendar_events | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_attachments | kanban_attachments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_attachments | set_updated_by_kanban_attachments | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_boards | kanban_boards_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_boards | kanban_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION planner.kanban_set_updated_at() |
| kanban_boards | on_kanban_board_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION audit.log_kanban_board_activity() |
| kanban_boards | set_updated_by_kanban_boards | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| kanban_cards | kanban_auto_complete_card | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION planner.kanban_auto_complete_card() |
| kanban_cards | kanban_cards_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_cards | kanban_set_card_board_id | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION planner.kanban_set_card_board_id() |
| kanban_cards | kanban_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION planner.kanban_set_updated_at() |
| kanban_cards | on_kanban_card_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION audit.log_kanban_child_activity() |
| kanban_cards | set_updated_by_kanban_cards | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_cards | trg_notify_kanban_card_assigned | AFTER | INSERT, UPDATE | EXECUTE FUNCTION notifications.notify_kanban_card_assigned() |
| kanban_checklist_items | kanban_checklist_items_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_checklist_items | set_updated_by_kanban_checklist_items | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_checklists | kanban_checklists_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_checklists | set_updated_by_kanban_checklists | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_comments | kanban_comments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_comments | on_kanban_comment_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION audit.log_kanban_comment_activity() |
| kanban_comments | set_updated_by_kanban_comments | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_labels | kanban_labels_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_labels | on_kanban_label_audit | AFTER | UPDATE, DELETE, INSERT | EXECUTE FUNCTION audit.log_kanban_label_activity() |
| kanban_labels | set_updated_by_kanban_labels | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| kanban_lists | kanban_lists_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| kanban_lists | kanban_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION planner.kanban_set_updated_at() |
| kanban_lists | on_kanban_list_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION audit.log_kanban_child_activity() |
| kanban_lists | set_updated_by_kanban_lists | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
