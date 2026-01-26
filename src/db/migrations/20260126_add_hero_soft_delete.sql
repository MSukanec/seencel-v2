-- Migration: Add soft delete to hero_sections
-- =============================================

ALTER TABLE public.hero_sections 
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.hero_sections.is_deleted IS 'Soft delete flag';

-- Index for faster queries filtering deleted records
CREATE INDEX IF NOT EXISTS idx_hero_sections_is_deleted 
ON public.hero_sections(is_deleted) 
WHERE is_deleted = false;
