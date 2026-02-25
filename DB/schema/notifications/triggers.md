# Database Schema (Auto-generated)
> Generated: 2026-02-25T18:05:07.898Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [NOTIFICATIONS] Triggers (1)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| user_notifications | trg_push_on_notification | AFTER | INSERT | EXECUTE FUNCTION notifications.notify_push_on_notification() |
