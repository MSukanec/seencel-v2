-- ============================================================================
-- 092: DROP ALL LEGACY PLANNER OBJECTS
-- ============================================================================
-- Removes ALL old kanban_* and calendar_* tables, views, functions, triggers,
-- and related audit/notification functions that referenced the legacy schema.
--
-- The new schema uses:
--   planner.boards, planner.lists, planner.items (+ future extensions)
--
-- ⚠️  IRREVERSIBLE. Make sure the new V2 schema is working before running.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP VIEWS (depend on legacy tables)
-- ============================================================================

DROP VIEW IF EXISTS planner.kanban_boards_view CASCADE;
DROP VIEW IF EXISTS planner.kanban_cards_view CASCADE;

-- ============================================================================
-- STEP 2: DROP LEGACY PLANNER FUNCTIONS (trigger functions on old tables)
-- ============================================================================

DROP FUNCTION IF EXISTS planner.kanban_auto_complete_card() CASCADE;
DROP FUNCTION IF EXISTS planner.kanban_set_card_board_id() CASCADE;

-- ============================================================================
-- STEP 3: DROP LEGACY AUDIT FUNCTIONS (reference old table columns)
-- ============================================================================

DROP FUNCTION IF EXISTS audit.log_calendar_event_activity() CASCADE;
DROP FUNCTION IF EXISTS audit.log_kanban_board_activity() CASCADE;
DROP FUNCTION IF EXISTS audit.log_kanban_card_activity() CASCADE;
DROP FUNCTION IF EXISTS audit.log_kanban_child_activity() CASCADE;
DROP FUNCTION IF EXISTS audit.log_kanban_comment_activity() CASCADE;
DROP FUNCTION IF EXISTS audit.log_kanban_label_activity() CASCADE;

-- ============================================================================
-- STEP 4: DROP LEGACY NOTIFICATION FUNCTION (references kanban_cards)
-- ============================================================================

DROP FUNCTION IF EXISTS notifications.notify_kanban_card_assigned() CASCADE;

-- ============================================================================
-- STEP 5: DROP LEGACY TABLES (CASCADE handles triggers, RLS, indexes, FKs)
-- ============================================================================
-- Order: children first (tables with FKs to parents), then parents.

-- Calendar child tables
DROP TABLE IF EXISTS planner.calendar_event_attendees CASCADE;
DROP TABLE IF EXISTS planner.calendar_event_reminders CASCADE;

-- Calendar parent
DROP TABLE IF EXISTS planner.calendar_events CASCADE;

-- Kanban child tables (deepest dependencies first)
DROP TABLE IF EXISTS planner.kanban_mentions CASCADE;
DROP TABLE IF EXISTS planner.kanban_card_labels CASCADE;
DROP TABLE IF EXISTS planner.kanban_card_watchers CASCADE;
DROP TABLE IF EXISTS planner.kanban_checklist_items CASCADE;
DROP TABLE IF EXISTS planner.kanban_checklists CASCADE;
DROP TABLE IF EXISTS planner.kanban_comments CASCADE;
DROP TABLE IF EXISTS planner.kanban_attachments CASCADE;
DROP TABLE IF EXISTS planner.kanban_board_permissions CASCADE;

-- Kanban core (cards → lists → boards)
DROP TABLE IF EXISTS planner.kanban_cards CASCADE;
DROP TABLE IF EXISTS planner.kanban_labels CASCADE;
DROP TABLE IF EXISTS planner.kanban_lists CASCADE;
DROP TABLE IF EXISTS planner.kanban_boards CASCADE;

COMMIT;

-- ============================================================================
-- SUMMARY OF DROPPED OBJECTS
-- ============================================================================
-- Tables (15):
--   calendar_events, calendar_event_attendees, calendar_event_reminders
--   kanban_boards, kanban_lists, kanban_cards, kanban_labels
--   kanban_card_labels, kanban_card_watchers
--   kanban_checklists, kanban_checklist_items
--   kanban_comments, kanban_mentions, kanban_attachments
--   kanban_board_permissions
--
-- Views (2):
--   kanban_boards_view, kanban_cards_view
--
-- Planner Functions (2):
--   kanban_auto_complete_card, kanban_set_card_board_id
--
-- Audit Functions (6):
--   log_calendar_event_activity, log_kanban_board_activity
--   log_kanban_card_activity, log_kanban_child_activity
--   log_kanban_comment_activity, log_kanban_label_activity
--
-- Notification Functions (1):
--   notify_kanban_card_assigned
--
-- Triggers (26): auto-dropped via CASCADE on tables/functions
-- RLS Policies (18): auto-dropped via CASCADE on tables
-- Indexes: auto-dropped via CASCADE on tables
