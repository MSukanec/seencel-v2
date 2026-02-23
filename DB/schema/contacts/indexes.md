# Database Schema (Auto-generated)
> Generated: 2026-02-23T12:14:47.276Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONTACTS] Indexes (9, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| contact_categories | idx_contact_categories_global_name_active | `CREATE UNIQUE INDEX idx_contact_categories_global_name_active ON contacts.con...` |
| contact_categories | idx_contact_categories_org_name_active | `CREATE UNIQUE INDEX idx_contact_categories_org_name_active ON contacts.contac...` |
| contact_category_links | contact_category_links_contact_id_contact_category_id_key | `CREATE UNIQUE INDEX contact_category_links_contact_id_contact_category_id_key...` |
| contacts | contacts_national_id_org_key | `CREATE UNIQUE INDEX contacts_national_id_org_key ON contacts.contacts USING b...` |
| contacts | idx_contacts_company_id | `CREATE INDEX idx_contacts_company_id ON contacts.contacts USING btree (compan...` |
| contacts | idx_contacts_import_batch_id | `CREATE INDEX idx_contacts_import_batch_id ON contacts.contacts USING btree (i...` |
| contacts | idx_contacts_is_deleted_org | `CREATE INDEX idx_contacts_is_deleted_org ON contacts.contacts USING btree (or...` |
| contacts | idx_contacts_org_email | `CREATE UNIQUE INDEX idx_contacts_org_email ON contacts.contacts USING btree (...` |
| contacts | uniq_contacts_org_linked_user | `CREATE UNIQUE INDEX uniq_contacts_org_linked_user ON contacts.contacts USING ...` |
