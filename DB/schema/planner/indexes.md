# Database Schema (Auto-generated)
> Generated: 2026-02-27T17:03:38.530Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] Indexes (19, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| attachments | idx_attachments_item | `CREATE INDEX idx_attachments_item ON planner.attachments USING btree (item_id)` |
| attachments | idx_attachments_org | `CREATE INDEX idx_attachments_org ON planner.attachments USING btree (organiza...` |
| attendees | attendees_item_id_member_id_key | `CREATE UNIQUE INDEX attendees_item_id_member_id_key ON planner.attendees USIN...` |
| boards | idx_boards_org | `CREATE INDEX idx_boards_org ON planner.boards USING btree (organization_id) W...` |
| checklist_items | idx_checklist_items_checklist | `CREATE INDEX idx_checklist_items_checklist ON planner.checklist_items USING b...` |
| checklists | idx_checklists_item | `CREATE INDEX idx_checklists_item ON planner.checklists USING btree (item_id)` |
| checklists | idx_checklists_org | `CREATE INDEX idx_checklists_org ON planner.checklists USING btree (organizati...` |
| comments | idx_comments_item | `CREATE INDEX idx_comments_item ON planner.comments USING btree (item_id, crea...` |
| comments | idx_comments_org | `CREATE INDEX idx_comments_org ON planner.comments USING btree (organization_i...` |
| items | idx_items_assigned | `CREATE INDEX idx_items_assigned ON planner.items USING btree (assigned_to, du...` |
| items | idx_items_board_list | `CREATE INDEX idx_items_board_list ON planner.items USING btree (board_id, lis...` |
| items | idx_items_calendar | `CREATE INDEX idx_items_calendar ON planner.items USING btree (organization_id...` |
| items | idx_items_org_type | `CREATE INDEX idx_items_org_type ON planner.items USING btree (organization_id...` |
| items | idx_items_project | `CREATE INDEX idx_items_project ON planner.items USING btree (project_id, item...` |
| items | idx_items_source | `CREATE INDEX idx_items_source ON planner.items USING btree (source_type, sour...` |
| labels | idx_labels_org | `CREATE INDEX idx_labels_org ON planner.labels USING btree (organization_id)` |
| labels | labels_organization_id_name_key | `CREATE UNIQUE INDEX labels_organization_id_name_key ON planner.labels USING b...` |
| lists | idx_lists_board | `CREATE INDEX idx_lists_board ON planner.lists USING btree (board_id, "positio...` |
| reminders | idx_reminders_pending | `CREATE INDEX idx_reminders_pending ON planner.reminders USING btree (remind_a...` |
