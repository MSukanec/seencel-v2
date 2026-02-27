# Database Schema (Auto-generated)
> Generated: 2026-02-27T17:03:38.530Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONTACTS] Triggers (6)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| contact_categories | on_contact_category_audit | AFTER | UPDATE, INSERT, DELETE | EXECUTE FUNCTION audit.log_contact_category_activity() |
| contact_categories | set_updated_by_contact_categories | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_by() |
| contact_category_links | trigger_contact_category_links_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION set_timestamp() |
| contacts | on_contact_audit | AFTER | DELETE, INSERT, UPDATE | EXECUTE FUNCTION audit.log_contact_activity() |
| contacts | set_updated_by_contacts | BEFORE | INSERT, UPDATE | EXECUTE FUNCTION handle_updated_by() |
| contacts | trigger_protect_linked_contact_delete | BEFORE | UPDATE | EXECUTE FUNCTION contacts.protect_linked_contact_delete() |
