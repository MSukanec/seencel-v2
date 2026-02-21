# Database Schema (Auto-generated)
> Generated: 2026-02-21T13:42:37.043Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [NOTIFICATIONS] Indexes (8, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| email_queue | idx_email_queue_pending | `CREATE INDEX idx_email_queue_pending ON notifications.email_queue USING btree...` |
| notifications | notifications_audience_idx | `CREATE INDEX notifications_audience_idx ON notifications.notifications USING ...` |
| notifications | notifications_created_at_idx | `CREATE INDEX notifications_created_at_idx ON notifications.notifications USIN...` |
| notifications | notifications_org_id_idx | `CREATE INDEX notifications_org_id_idx ON notifications.notifications USING bt...` |
| push_subscriptions | idx_push_subscriptions_user_id | `CREATE INDEX idx_push_subscriptions_user_id ON notifications.push_subscriptio...` |
| push_subscriptions | push_subscriptions_user_endpoint_key | `CREATE UNIQUE INDEX push_subscriptions_user_endpoint_key ON notifications.pus...` |
| user_notifications | user_notifications_user_id_notification_id_key | `CREATE UNIQUE INDEX user_notifications_user_id_notification_id_key ON notific...` |
| user_notifications | user_notifications_user_idx | `CREATE INDEX user_notifications_user_idx ON notifications.user_notifications ...` |
