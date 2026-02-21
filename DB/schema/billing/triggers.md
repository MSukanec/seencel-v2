# Database Schema (Auto-generated)
> Generated: 2026-02-21T21:03:12.424Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [BILLING] Triggers (9)

| Table | Trigger | Timing | Events | Action |
|-------|---------|--------|--------|--------|
| bank_transfer_payments | notify_new_transfer | AFTER | INSERT | EXECUTE FUNCTION notifications.notify_new_transfer() |
| bank_transfer_payments | trg_btp_updated_at | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| billing_profiles | trg_billing_profiles_user_id_immutable | BEFORE | UPDATE | EXECUTE FUNCTION iam.forbid_user_id_change() |
| coupons | trg_coupons_set_updated | BEFORE | UPDATE | EXECUTE FUNCTION set_updated_at() |
| organization_subscriptions | trg_notify_subscription_activated | AFTER | INSERT | EXECUTE FUNCTION notifications.notify_subscription_activa... |
| payments | notify_payment | AFTER | UPDATE, INSERT | EXECUTE FUNCTION notifications.notify_admin_on_payment() |
| payments | notify_user_payment_completed | AFTER | INSERT, UPDATE | EXECUTE FUNCTION notifications.notify_user_payment_comple... |
| payments | trg_log_payment_activity | AFTER | INSERT | EXECUTE FUNCTION audit.log_payment_activity() |
| payments | trg_queue_purchase_email | AFTER | INSERT | EXECUTE FUNCTION notifications.queue_purchase_email() |
