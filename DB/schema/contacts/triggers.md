# Database Schema (Auto-generated)
> Generated: 2026-03-20T17:04:16.493Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONTACTS] Triggers (8)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| contact_categories | on_contact_category_audit | AFTER | DELETE, UPDATE, INSERT | EXECUTE FUNCTION audit.log_contact_category_activity() |
| contact_categories | set_updated_by_contact_categories | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| contact_categories | trigger_contact_categories_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| contact_category_links | trigger_contact_category_links_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| contacts | on_contact_audit | AFTER | INSERT, UPDATE, DELETE | EXECUTE FUNCTION audit.log_contact_activity() |
| contacts | set_updated_by_contacts | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| contacts | trigger_contacts_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| contacts | trigger_protect_linked_contact_delete | BEFORE | UPDATE | EXECUTE FUNCTION contacts.protect_linked_contact_delete() |
