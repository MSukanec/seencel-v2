# Database Schema (Auto-generated)
> Generated: 2026-02-22T22:41:22.161Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [COMMUNITY] Indexes (13, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| forum_categories | forum_categories_slug_unique | `CREATE UNIQUE INDEX forum_categories_slug_unique ON community.forum_categorie...` |
| forum_categories | idx_forum_categories_course | `CREATE INDEX idx_forum_categories_course ON community.forum_categories USING ...` |
| forum_posts | idx_forum_posts_thread | `CREATE INDEX idx_forum_posts_thread ON community.forum_posts USING btree (thr...` |
| forum_reactions | forum_reactions_user_id_item_type_item_id_key | `CREATE UNIQUE INDEX forum_reactions_user_id_item_type_item_id_key ON communit...` |
| forum_threads | forum_threads_slug_key | `CREATE UNIQUE INDEX forum_threads_slug_key ON community.forum_threads USING b...` |
| forum_threads | idx_forum_last_activity | `CREATE INDEX idx_forum_last_activity ON community.forum_threads USING btree (...` |
| forum_threads | idx_forum_threads_category | `CREATE INDEX idx_forum_threads_category ON community.forum_threads USING btre...` |
| founder_event_registrations | founder_event_registrations_event_id_organization_id_user_i_key | `CREATE UNIQUE INDEX founder_event_registrations_event_id_organization_id_user...` |
| founder_event_registrations | idx_founder_registrations_event | `CREATE INDEX idx_founder_registrations_event ON community.founder_event_regis...` |
| founder_portal_events | idx_founder_events_date | `CREATE INDEX idx_founder_events_date ON community.founder_portal_events USING...` |
| founder_vote_ballots | founder_vote_ballots_topic_id_organization_id_user_id_key | `CREATE UNIQUE INDEX founder_vote_ballots_topic_id_organization_id_user_id_key...` |
| founder_vote_ballots | idx_founder_ballots_topic | `CREATE INDEX idx_founder_ballots_topic ON community.founder_vote_ballots USIN...` |
| founder_vote_topics | idx_founder_vote_topics_status | `CREATE INDEX idx_founder_vote_topics_status ON community.founder_vote_topics ...` |
