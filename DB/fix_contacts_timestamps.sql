-- ==============================================================================
-- Fix: Triggers set_timestamp faltantes en esquema contacts
-- Generado durante la auditoría de características.
-- ==============================================================================

-- 1. Trigger para contacts.contacts
DROP TRIGGER IF EXISTS trigger_contacts_updated_at ON contacts.contacts;
CREATE TRIGGER trigger_contacts_updated_at
BEFORE UPDATE ON contacts.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- 2. Trigger para contacts.contact_categories
DROP TRIGGER IF EXISTS trigger_contact_categories_updated_at ON contacts.contact_categories;
CREATE TRIGGER trigger_contact_categories_updated_at
BEFORE UPDATE ON contacts.contact_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();
