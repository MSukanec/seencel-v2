# Database Schema (Auto-generated)
> Generated: 2026-02-22T15:06:00.294Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [OPS] Triggers (2)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| ops_alerts | ops_alerts_set_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| system_error_logs | trg_notify_system_error | AFTER | INSERT | EXECUTE FUNCTION notifications.notify_system_error() |
