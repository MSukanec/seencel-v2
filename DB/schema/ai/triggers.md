# Database Schema (Auto-generated)
> Generated: 2026-02-20T00:26:33.263Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AI] Triggers (1)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| ai_user_preferences | trg_set_updated_at_ia_user_preferences | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at_ia_user_preferences() |
