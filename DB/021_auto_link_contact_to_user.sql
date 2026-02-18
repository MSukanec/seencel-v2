-- ============================================================
-- AUTO-LINK: SOLO DROPEAR EL TRIGGER
-- La vinculación se maneja en las server actions del frontend.
-- ============================================================

-- Dropear trigger si existe (pudo haberse creado en una versión anterior)
DROP TRIGGER IF EXISTS trg_auto_link_contact_to_user ON public.contacts;

-- Dropear función si existe
DROP FUNCTION IF EXISTS public.auto_link_contact_to_user();
