# Database Schema (Auto-generated)
> Generated: 2026-02-22T20:08:16.861Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] Triggers (27)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| attachments | attachments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| attachments | set_updated_by_attachments | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| attendees | attendees_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| attendees | set_updated_by_attendees | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| board_permissions | board_permissions_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| board_permissions | set_updated_by_board_permissions | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| boards | boards_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| boards | set_updated_by_boards | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| boards | trg_audit_boards | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION planner.log_board_activity() |
| checklist_items | checklist_items_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| checklist_items | set_updated_by_checklist_items | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| checklists | checklists_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| checklists | set_updated_by_checklists | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| comments | comments_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| comments | set_updated_by_comments | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| comments | trg_audit_comments | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION planner.log_comment_activity() |
| items | items_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| items | set_updated_by_items | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| items | trg_audit_items | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION planner.log_item_activity() |
| items | trg_auto_complete_item | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION planner.auto_complete_item() |
| items | trg_set_item_board_id | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION planner.set_item_board_id() |
| labels | labels_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| labels | set_updated_by_labels | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| lists | lists_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| lists | set_updated_by_lists | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| reminders | reminders_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| reminders | set_updated_by_reminders | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
