-- ============================================================
-- 085: Eliminar función y triggers duplicados de kanban_set_updated_at
-- ============================================================
-- Las tablas kanban_boards, kanban_cards y kanban_lists ya tienen
-- triggers que usan set_timestamp() de public (genérica).
-- planner.kanban_set_updated_at() hace exactamente lo mismo,
-- así que los 3 triggers y la función son redundantes.
-- ============================================================

-- 1. Drop triggers duplicados
DROP TRIGGER IF EXISTS kanban_set_updated_at ON planner.kanban_boards;
DROP TRIGGER IF EXISTS kanban_set_updated_at ON planner.kanban_cards;
DROP TRIGGER IF EXISTS kanban_set_updated_at ON planner.kanban_lists;

-- 2. Drop función redundante
DROP FUNCTION IF EXISTS planner.kanban_set_updated_at();
