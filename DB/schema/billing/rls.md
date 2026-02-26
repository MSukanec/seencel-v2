# Database Schema (Auto-generated)
> Generated: 2026-02-26T15:52:15.290Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [BILLING] RLS Policies (41)

### `bank_transfer_payments` (3 policies)

#### ADMIN GESTIONAN USUARIOS CREAN BANK_TRANSFER_PAYMENTS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS CREAN BANK_TRANSFER_PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS VEN USUARIOS CREAN BANK_TRANSFER_PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `billing_profiles` (3 policies)

#### USUARIOS ACTUALIZAN BILLING_PROFILES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

#### USUARIOS CREAN BILLING_PROFILES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_self(user_id)
```

#### USUARIOS VEN BILLING_PROFILES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `coupon_courses` (3 policies)

#### ADMIN ACTUALIZA COUPON_COURSES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMIN CREA COUPON_COURSES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS VEN COUPON_COURSES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `coupon_plans` (3 policies)

#### ADMIN ACTUALIZA COUPON_PLANS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMIN CREA COUPON_PLANS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS VEN COUPON_PLANS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `coupon_redemptions` (3 policies)

#### ADMIN CREA COUPON_REDEMPTIONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### USUARIOS ACTUALIZAN COUPON_REDEMPTIONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```
- **WITH CHECK**:
```sql
(is_self(user_id) OR is_admin())
```

#### USUARIOS VEN COUPON_REDEMPTIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR is_admin())
```

### `coupons` (4 policies)

#### ADMIN BORRA COUPONS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMIN CREA COUPONS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMIN EDITA COUPONS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### TODOS VEN COUPONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `mp_preferences` (3 policies)

#### USUARIOS CREAN MP_PREFERENCES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(user_id = current_user_id())
```

#### USUARIOS EDITAN MP_PREFERENCES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(((user_id = current_user_id()) AND (status = 'pending'::text)) OR is_admin())
```

#### USUARIOS VEN MP_PREFERENCES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
((user_id = current_user_id()) OR is_admin())
```

### `organization_billing_cycles` (2 policies)

#### ADMINS GESTIONAN BILLING_CYCLES

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR (is_org_member(organization_id) AND can_mutate_org(organization_id, 'admin.access'::text)))
```

#### MIEMBROS VEN BILLING_CYCLES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

### `organization_member_events` (2 policies)

#### MIEMBROS VEN MEMBER_EVENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

#### SISTEMA CREA MEMBER_EVENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
can_mutate_org(organization_id, 'organization.manage'::text)
```

### `organization_subscriptions` (2 policies)

#### ADMINS GESTIONAN SUBSCRIPTIONS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_admin() OR (is_org_member(organization_id) AND can_mutate_org(organization_id, 'admin.access'::text)))
```
- **WITH CHECK**:
```sql
(is_admin() OR (is_org_member(organization_id) AND can_mutate_org(organization_id, 'admin.access'::text)))
```

#### MIEMBROS VEN SUBSCRIPTIONS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_org_member(organization_id)
```

### `payment_events` (2 policies)

#### ADMINS EDITAN PAYMENT_EVENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMINS VEN PAYMENT_EVENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

### `payments` (4 policies)

#### ADMIN BORRAN PAYMENTS

- **Command**: DELETE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### ADMINS CREAN PAYMENTS

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```

#### ADMINS EDITAN PAYMENTS

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### USUARIOS VEN SUS PAYMENTS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(is_self(user_id) OR ((organization_id IS NOT NULL) AND is_org_member(organization_id)) OR is_admin())
```

### `paypal_preferences` (3 policies)

#### USUARIOS CREAN PAYPAL_PREFERENCES

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
(user_id = current_user_id())
```

#### USUARIOS EDITAN PAYPAL_PREFERENCES

- **Command**: UPDATE | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(user_id = current_user_id())
```
- **WITH CHECK**:
```sql
(user_id = current_user_id())
```

#### USUARIOS VEN PAYPAL_PREFERENCES

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
(user_id = current_user_id())
```

### `plans` (2 policies)

#### ADMINS GESTIONAN PLANS

- **Command**: ALL | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```
- **WITH CHECK**:
```sql
is_admin()
```

#### TODOS VEN PLANS

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
true
```

### `subscription_notifications_log` (2 policies)

#### ADMINS VEN SUBSCRIPTION_NOTIFICATIONS_LOG

- **Command**: SELECT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **USING**:
```sql
is_admin()
```

#### SISTEMA CREA SUBSCRIPTION_NOTIFICATIONS_LOG

- **Command**: INSERT | **Permissive**: PERMISSIVE
- **Roles**: {public}
- **WITH CHECK**:
```sql
is_admin()
```
