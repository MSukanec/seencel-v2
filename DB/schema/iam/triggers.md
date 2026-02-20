# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Triggers (1)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| organization_invitations | trigger_create_contact_on_registered_invitation | AFTER | INSERT | EXECUTE FUNCTION handle_registered_invitation() |
