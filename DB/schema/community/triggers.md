# Database Schema (Auto-generated)
> Generated: 2026-03-19T17:08:39.512Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [COMMUNITY] Triggers (1)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| forum_posts | trg_update_thread_activity | AFTER | INSERT, DELETE | EXECUTE FUNCTION community.update_forum_thread_activity() |
