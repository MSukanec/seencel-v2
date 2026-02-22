# Database Schema (Auto-generated)
> Generated: 2026-02-22T20:08:16.861Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [OPS] Triggers (1)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| system_error_logs | trg_notify_system_error | AFTER | INSERT | EXECUTE FUNCTION notifications.notify_system_error() |
