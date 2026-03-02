-- ============================================================================
-- ADD import_batch_id TO general_costs_payments
-- ============================================================================
-- Prerequisite for bulk import functionality.
-- Allows tracking which records were imported in each batch,
-- enabling batch revert (soft delete all records from a batch).
-- ============================================================================

ALTER TABLE finance.general_costs_payments
ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES import_batches(id) ON DELETE SET NULL;

-- Optional: index for faster batch lookups during revert
CREATE INDEX IF NOT EXISTS idx_gc_payments_import_batch
ON finance.general_costs_payments (import_batch_id)
WHERE import_batch_id IS NOT NULL;
