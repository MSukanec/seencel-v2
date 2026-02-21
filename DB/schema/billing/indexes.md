# Database Schema (Auto-generated)
> Generated: 2026-02-21T21:03:12.424Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [BILLING] Indexes (40, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| bank_transfer_payments | bank_transfer_payments_order_idx | `CREATE INDEX bank_transfer_payments_order_idx ON billing.bank_transfer_paymen...` |
| bank_transfer_payments | bank_transfer_payments_org_idx | `CREATE INDEX bank_transfer_payments_org_idx ON billing.bank_transfer_payments...` |
| bank_transfer_payments | bank_transfer_payments_payment_idx | `CREATE INDEX bank_transfer_payments_payment_idx ON billing.bank_transfer_paym...` |
| bank_transfer_payments | bank_transfer_payments_plan_idx | `CREATE INDEX bank_transfer_payments_plan_idx ON billing.bank_transfer_payment...` |
| bank_transfer_payments | bank_transfer_payments_user_idx | `CREATE INDEX bank_transfer_payments_user_idx ON billing.bank_transfer_payment...` |
| billing_profiles | billing_profiles_user_id_uniq | `CREATE UNIQUE INDEX billing_profiles_user_id_uniq ON billing.billing_profiles...` |
| coupon_courses | idx_coupon_courses_coupon | `CREATE INDEX idx_coupon_courses_coupon ON billing.coupon_courses USING btree ...` |
| coupon_courses | idx_coupon_courses_course | `CREATE INDEX idx_coupon_courses_course ON billing.coupon_courses USING btree ...` |
| coupon_plans | idx_coupon_plans_plan_id | `CREATE INDEX idx_coupon_plans_plan_id ON billing.coupon_plans USING btree (pl...` |
| coupon_redemptions | idx_coupon_redemptions_coupon_id | `CREATE INDEX idx_coupon_redemptions_coupon_id ON billing.coupon_redemptions U...` |
| coupon_redemptions | idx_coupon_redemptions_subscription_id | `CREATE INDEX idx_coupon_redemptions_subscription_id ON billing.coupon_redempt...` |
| coupon_redemptions | idx_coupon_redemptions_user_id | `CREATE INDEX idx_coupon_redemptions_user_id ON billing.coupon_redemptions USI...` |
| coupons | coupons_code_lower_uidx | `CREATE UNIQUE INDEX coupons_code_lower_uidx ON billing.coupons USING btree (l...` |
| mp_preferences | idx_mp_preferences_org | `CREATE INDEX idx_mp_preferences_org ON billing.mp_preferences USING btree (or...` |
| mp_preferences | idx_mp_preferences_status | `CREATE INDEX idx_mp_preferences_status ON billing.mp_preferences USING btree ...` |
| mp_preferences | idx_mp_preferences_user | `CREATE INDEX idx_mp_preferences_user ON billing.mp_preferences USING btree (u...` |
| organization_billing_cycles | idx_billing_cycles_org | `CREATE INDEX idx_billing_cycles_org ON billing.organization_billing_cycles US...` |
| organization_billing_cycles | idx_billing_cycles_period | `CREATE INDEX idx_billing_cycles_period ON billing.organization_billing_cycles...` |
| organization_billing_cycles | idx_billing_cycles_status | `CREATE INDEX idx_billing_cycles_status ON billing.organization_billing_cycles...` |
| organization_billing_cycles | idx_billing_cycles_subscription | `CREATE INDEX idx_billing_cycles_subscription ON billing.organization_billing_...` |
| organization_member_events | idx_member_events_date | `CREATE INDEX idx_member_events_date ON billing.organization_member_events USI...` |
| organization_member_events | idx_member_events_member | `CREATE INDEX idx_member_events_member ON billing.organization_member_events U...` |
| organization_member_events | idx_member_events_org | `CREATE INDEX idx_member_events_org ON billing.organization_member_events USIN...` |
| organization_member_events | idx_member_events_subscription | `CREATE INDEX idx_member_events_subscription ON billing.organization_member_ev...` |
| organization_member_events | idx_member_events_type | `CREATE INDEX idx_member_events_type ON billing.organization_member_events USI...` |
| organization_subscriptions | idx_org_subs_scheduled_downgrade | `CREATE INDEX idx_org_subs_scheduled_downgrade ON billing.organization_subscri...` |
| organization_subscriptions | idx_org_subscriptions_coupon | `CREATE INDEX idx_org_subscriptions_coupon ON billing.organization_subscriptio...` |
| organization_subscriptions | org_subscriptions_unique_active | `CREATE UNIQUE INDEX org_subscriptions_unique_active ON billing.organization_s...` |
| payment_events | idx_payment_events_custom_id | `CREATE INDEX idx_payment_events_custom_id ON billing.payment_events USING btr...` |
| payment_events | idx_payment_events_order_id | `CREATE INDEX idx_payment_events_order_id ON billing.payment_events USING btre...` |
| payment_events | idx_payment_events_provider | `CREATE INDEX idx_payment_events_provider ON billing.payment_events USING btre...` |
| payments | idx_payments_course | `CREATE INDEX idx_payments_course ON billing.payments USING btree (course_id)` |
| payments | idx_payments_user | `CREATE INDEX idx_payments_user ON billing.payments USING btree (user_id)` |
| payments | payments_provider_payment_unique | `CREATE UNIQUE INDEX payments_provider_payment_unique ON billing.payments USIN...` |
| paypal_preferences | idx_paypal_preferences_order | `CREATE INDEX idx_paypal_preferences_order ON billing.paypal_preferences USING...` |
| paypal_preferences | idx_paypal_preferences_org | `CREATE INDEX idx_paypal_preferences_org ON billing.paypal_preferences USING b...` |
| paypal_preferences | idx_paypal_preferences_status | `CREATE INDEX idx_paypal_preferences_status ON billing.paypal_preferences USIN...` |
| paypal_preferences | idx_paypal_preferences_user | `CREATE INDEX idx_paypal_preferences_user ON billing.paypal_preferences USING ...` |
| plans | plans_name_key | `CREATE UNIQUE INDEX plans_name_key ON billing.plans USING btree (name)` |
| subscription_notifications_log | subscription_notifications_lo_subscription_id_notification__key | `CREATE UNIQUE INDEX subscription_notifications_lo_subscription_id_notificatio...` |
