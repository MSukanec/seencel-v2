-- Migration: Add media columns to hero_sections
-- =============================================

ALTER TABLE public.hero_sections 
ADD COLUMN IF NOT EXISTS media_url text NULL;

ALTER TABLE public.hero_sections 
ADD COLUMN IF NOT EXISTS media_type text NULL DEFAULT 'image';

COMMENT ON COLUMN public.hero_sections.media_url IS 'URL del media (imagen/video/gif) almacenado en Storage: public-assets/app-ui/carousels/';
COMMENT ON COLUMN public.hero_sections.media_type IS 'Tipo de media: image, video, gif';
