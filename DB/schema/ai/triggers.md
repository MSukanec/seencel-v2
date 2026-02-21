# Database Schema (Auto-generated)
> Generated: 2026-02-21T13:42:37.043Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AI] Triggers (1)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| ai_user_preferences | trg_set_updated_at_ia_user_preferences | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at_ia_user_preferences() |
