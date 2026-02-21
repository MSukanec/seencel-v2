# Database Schema (Auto-generated)
> Generated: 2026-02-21T03:04:42.923Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [BILLING] Triggers (7)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| bank_transfer_payments | notify_new_transfer | AFTER | INSERT | EXECUTE FUNCTION notifications.notify_new_transfer() |
| bank_transfer_payments | trg_btp_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| billing_profiles | trg_billing_profiles_user_id_immutable | BEFORE | UPDATE | EXECUTE FUNCTION iam.forbid_user_id_change() |
| coupons | trg_coupons_set_updated | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| organization_subscriptions | trg_notify_subscription_activated | AFTER | INSERT | EXECUTE FUNCTION notifications.notify_subscription_activa... |
| payments | notify_payment | AFTER | INSERT, UPDATE | EXECUTE FUNCTION notifications.notify_admin_on_payment() |
| payments | notify_user_payment_completed | AFTER | UPDATE, INSERT | EXECUTE FUNCTION notifications.notify_user_payment_comple... |
