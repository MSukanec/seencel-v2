# Database Schema (Auto-generated)
> Generated: 2026-02-19T19:04:24.438Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Indexes (7, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| organization_clients | idx_iam_org_clients_active | `CREATE INDEX idx_iam_org_clients_active ON iam.organization_clients USING btr...` |
| organization_clients | idx_iam_org_clients_org | `CREATE INDEX idx_iam_org_clients_org ON iam.organization_clients USING btree ...` |
| organization_clients | idx_iam_org_clients_user | `CREATE INDEX idx_iam_org_clients_user ON iam.organization_clients USING btree...` |
| organization_clients | organization_clients_organization_id_user_id_key | `CREATE UNIQUE INDEX organization_clients_organization_id_user_id_key ON iam.o...` |
| organization_invitations | organization_invitations_email_idx | `CREATE INDEX organization_invitations_email_idx ON iam.organization_invitatio...` |
| organization_invitations | organization_invitations_email_org_unique | `CREATE UNIQUE INDEX organization_invitations_email_org_unique ON iam.organiza...` |
| organization_invitations | organization_invitations_organization_id_idx | `CREATE INDEX organization_invitations_organization_id_idx ON iam.organization...` |
