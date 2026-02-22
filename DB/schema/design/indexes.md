# Database Schema (Auto-generated)
> Generated: 2026-02-22T22:05:48.801Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [DESIGN] Indexes (8, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| pin_board_items | idx_pin_board_items_board | `CREATE INDEX idx_pin_board_items_board ON design.pin_board_items USING btree ...` |
| pin_board_items | idx_pin_board_items_pin | `CREATE INDEX idx_pin_board_items_pin ON design.pin_board_items USING btree (p...` |
| pin_board_items | pin_board_items_unique | `CREATE UNIQUE INDEX pin_board_items_unique ON design.pin_board_items USING bt...` |
| pin_boards | idx_pin_boards_organization | `CREATE INDEX idx_pin_boards_organization ON design.pin_boards USING btree (or...` |
| pin_boards | idx_pin_boards_project | `CREATE INDEX idx_pin_boards_project ON design.pin_boards USING btree (project...` |
| pins | idx_pins_media_file | `CREATE INDEX idx_pins_media_file ON design.pins USING btree (media_file_id) W...` |
| pins | idx_pins_organization | `CREATE INDEX idx_pins_organization ON design.pins USING btree (organization_i...` |
| pins | idx_pins_project | `CREATE INDEX idx_pins_project ON design.pins USING btree (project_id) WHERE (...` |
