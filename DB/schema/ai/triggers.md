# Database Schema (Auto-generated)
> Generated: 2026-03-20T17:04:16.493Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AI] Triggers (3)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| ai_organization_usage_limits | on_ai_org_limit_audit | AFTER | INSERT, DELETE, UPDATE | EXECUTE FUNCTION log_ai_org_limit_activity() |
| ai_organization_usage_limits | set_updated_by_ai_organization_usage_limits | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
| ai_usage_logs | set_updated_by_ai_usage_logs | BEFORE | UPDATE, INSERT | EXECUTE FUNCTION handle_updated_by() |
