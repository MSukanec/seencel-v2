# Tablas en DB para FACTURACIÓN (NO MODIFICAR):

# Tabla APP_SETTINGS:

create table public.app_settings (
  key text not null,
  value text null,
  description text null,
  updated_at timestamp with time zone null default now(),
  constraint app_settings_pkey primary key (key)
) TABLESPACE pg_default;

# Tabla BANK_TRANSFER_PAYMENTS:

create table public.bank_transfer_payments (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  user_id uuid not null,
  amount numeric(14, 2) not null,
  currency text not null,
  payer_name text null,
  payer_note text null,
  status public.payment_review_status not null default 'pending'::payment_review_status,
  reviewed_by uuid null,
  reviewed_at timestamp with time zone null,
  review_reason text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  payment_id uuid null,
  course_id uuid null,
  discount_percent numeric null default 5.0,
  discount_amount numeric null default 0,
  receipt_url text null,
  plan_id uuid null,
  organization_id uuid null,
  billing_period text null,
  exchange_rate numeric(10, 4) null,
  constraint bank_transfer_payments_pkey primary key (id),
  constraint bank_transfer_payments_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint bank_transfer_payments_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint bank_transfer_payments_payment_id_fkey foreign KEY (payment_id) references payments (id) on delete CASCADE,
  constraint bank_transfer_payments_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete set null,
  constraint bank_transfer_payments_reviewed_by_fkey foreign KEY (reviewed_by) references users (id) on delete set null,
  constraint bank_transfer_payments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint bank_transfer_payments_billing_period_check check (
    (
      (
        billing_period = any (array['monthly'::text, 'annual'::text])
      )
      or (billing_period is null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists bank_transfer_payments_plan_idx on public.bank_transfer_payments using btree (plan_id) TABLESPACE pg_default;

create index IF not exists bank_transfer_payments_org_idx on public.bank_transfer_payments using btree (organization_id) TABLESPACE pg_default;

create index IF not exists bank_transfer_payments_user_idx on public.bank_transfer_payments using btree (user_id) TABLESPACE pg_default;

create index IF not exists bank_transfer_payments_order_idx on public.bank_transfer_payments using btree (order_id) TABLESPACE pg_default;

create index IF not exists bank_transfer_payments_payment_idx on public.bank_transfer_payments using btree (payment_id) TABLESPACE pg_default;

create trigger on_bank_transfer_payment_created_send_email
after INSERT on bank_transfer_payments for EACH row
execute FUNCTION notify_replit_email ();

create trigger trg_btp_updated_at BEFORE
update on bank_transfer_payments for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_notify_new_transfer
after INSERT on bank_transfer_payments for EACH row
execute FUNCTION trigger_notify_new_transfer ();

# Tabla COUPON_COURSES:

create table public.coupon_courses (
  coupon_id uuid not null,
  course_id uuid not null,
  constraint coupon_courses_pkey primary key (coupon_id, course_id),
  constraint coupon_courses_coupon_id_fkey foreign KEY (coupon_id) references coupons (id) on delete CASCADE,
  constraint coupon_courses_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_coupon_courses_coupon on public.coupon_courses using btree (coupon_id) TABLESPACE pg_default;

create index IF not exists idx_coupon_courses_course on public.coupon_courses using btree (course_id) TABLESPACE pg_default;

# Tabla COUPON_PLANS:

create table public.coupon_plans (
  coupon_id uuid not null,
  plan_id uuid not null,
  constraint coupon_plans_pkey primary key (coupon_id, plan_id),
  constraint coupon_plans_coupon_id_fkey foreign KEY (coupon_id) references coupons (id) on delete CASCADE,
  constraint coupon_plans_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_coupon_plans_plan_id on public.coupon_plans using btree (plan_id) TABLESPACE pg_default;

# Tabla COUPON_REDEMPTIONS:

create table public.coupon_redemptions (
  id uuid not null default gen_random_uuid (),
  coupon_id uuid not null,
  user_id uuid not null,
  course_id uuid null,
  order_id uuid null,
  amount_saved numeric(12, 2) not null,
  currency text null,
  created_at timestamp with time zone not null default now(),
  subscription_id uuid null,
  plan_id uuid null,
  constraint coupon_redemptions_pkey primary key (id),
  constraint coupon_redemptions_coupon_id_fkey foreign KEY (coupon_id) references coupons (id) on delete CASCADE,
  constraint coupon_redemptions_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint coupon_redemptions_plan_id_fkey foreign KEY (plan_id) references plans (id),
  constraint coupon_redemptions_subscription_id_fkey foreign KEY (subscription_id) references organization_subscriptions (id),
  constraint coupon_redemptions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_coupon_redemptions_subscription_id on public.coupon_redemptions using btree (subscription_id) TABLESPACE pg_default;

create index IF not exists idx_coupon_redemptions_coupon_id on public.coupon_redemptions using btree (coupon_id) TABLESPACE pg_default;

create index IF not exists idx_coupon_redemptions_user_id on public.coupon_redemptions using btree (user_id) TABLESPACE pg_default;

# Tabla COUPONS:

create table public.coupons (
  id uuid not null default gen_random_uuid (),
  code text not null,
  type public.coupon_type_t not null,
  amount numeric(12, 2) not null,
  currency text null,
  max_redemptions integer null,
  per_user_limit integer null default 1,
  starts_at timestamp with time zone null,
  expires_at timestamp with time zone null,
  min_order_total numeric(12, 2) null,
  applies_to_all boolean not null default true,
  is_active boolean not null default true,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  applies_to text null default 'courses'::text,
  constraint coupons_pkey primary key (id),
  constraint coupons_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint coupons_applies_to_check check (
    (
      applies_to = any (
        array[
          'courses'::text,
          'subscriptions'::text,
          'all'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists coupons_code_lower_uidx on public.coupons using btree (lower(code)) TABLESPACE pg_default;

create trigger trg_coupons_set_updated BEFORE
update on coupons for EACH row
execute FUNCTION set_updated_at ();

# Tabla COURSE_ENROLLMENTS:

create table public.course_enrollments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  course_id uuid not null,
  status text not null default 'active'::text,
  started_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint course_enrollments_pkey primary key (id),
  constraint enroll_unique unique (user_id, course_id),
  constraint course_enrollments_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint course_enrollments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint course_enrollments_status_chk check (
    (
      status = any (
        array[
          'active'::text,
          'completed'::text,
          'cancelled'::text,
          'expired'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_course_enrollments_user on public.course_enrollments using btree (user_id) TABLESPACE pg_default;

create trigger course_enrollments_set_updated_at BEFORE
update on course_enrollments for EACH row
execute FUNCTION update_timestamp ();

# Tabla EXCHANGE_RATES:

create table public.exchange_rates (
  id uuid not null default gen_random_uuid (),
  from_currency text not null,
  to_currency text not null,
  rate numeric(12, 6) not null,
  is_active boolean not null default true,
  updated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  constraint exchange_rates_pkey primary key (id),
  constraint exchange_rates_unique_pair unique (from_currency, to_currency)
) TABLESPACE pg_default;

create index IF not exists idx_exchange_rates_active on public.exchange_rates using btree (from_currency, to_currency) TABLESPACE pg_default
where
  (is_active = true);

# Tabla MP_PREFERENCES:

create table public.mp_preferences (
  id character varying(64) not null,
  preapproval_id text null,
  user_id uuid not null,
  organization_id uuid not null,
  plan_id uuid null,
  plan_slug text null,
  billing_period text not null,
  amount_ars numeric(10, 2) null,
  is_upgrade boolean null default false,
  previous_subscription_id uuid null,
  proration_credit numeric(10, 2) null,
  created_at timestamp without time zone null default now(),
  product_type text null,
  preference_id text null,
  invitee_email text null,
  role_id uuid null,
  subscription_id uuid null,
  payer_email text null,
  course_id uuid null,
  amount numeric(12, 2) null,
  currency text null default 'ARS'::text,
  exchange_rate numeric(10, 4) null,
  coupon_id uuid null,
  discount_amount numeric(12, 2) null default 0,
  init_point text null,
  status text null default 'pending'::text,
  expires_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  seats_quantity integer null,
  constraint mp_subscription_preferences_pkey primary key (id),
  constraint mp_preferences_course_id_fkey foreign KEY (course_id) references courses (id) on delete set null,
  constraint mp_preferences_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint mp_preferences_coupon_id_fkey foreign KEY (coupon_id) references coupons (id) on delete set null,
  constraint mp_preferences_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint mp_preferences_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete set null,
  constraint mp_subscription_preferences_billing_period_check check (
    (
      billing_period = any (array['monthly'::text, 'annual'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_mp_preferences_user on public.mp_preferences using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_mp_preferences_org on public.mp_preferences using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_mp_preferences_status on public.mp_preferences using btree (status) TABLESPACE pg_default
where
  (status = 'pending'::text);

# Tabla ORGANIZATION_SUBSCRIPTIONS:

create table public.organization_subscriptions (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  plan_id uuid not null,
  payment_id uuid null,
  status text not null default 'active'::text,
  billing_period text not null,
  started_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null,
  cancelled_at timestamp with time zone null,
  amount numeric(10, 2) not null,
  currency text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  scheduled_downgrade_plan_id uuid null,
  provider_subscription_id text null,
  coupon_id uuid null,
  coupon_code text null,
  payer_email text null,
  constraint organization_subscriptions_pkey primary key (id),
  constraint organization_subscriptions_coupon_id_fkey foreign KEY (coupon_id) references coupons (id),
  constraint organization_subscriptions_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_subscriptions_payment_id_fkey foreign KEY (payment_id) references payments (id) on delete CASCADE,
  constraint organization_subscriptions_scheduled_downgrade_plan_id_fkey foreign KEY (scheduled_downgrade_plan_id) references plans (id) on delete set null,
  constraint organization_subscriptions_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete CASCADE,
  constraint organization_subscriptions_billing_period_check check (
    (
      billing_period = any (array['monthly'::text, 'annual'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_org_subs_scheduled_downgrade on public.organization_subscriptions using btree (scheduled_downgrade_plan_id) TABLESPACE pg_default
where
  (scheduled_downgrade_plan_id is not null);

create unique INDEX IF not exists org_subscriptions_unique_active on public.organization_subscriptions using btree (organization_id) TABLESPACE pg_default
where
  (status = 'active'::text);

create index IF not exists idx_org_subscriptions_coupon on public.organization_subscriptions using btree (coupon_id) TABLESPACE pg_default;

# Tabla ORGANIZATIONS:

create table public.organizations (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  created_by uuid null,
  is_active boolean not null default true,
  updated_at timestamp with time zone not null default now(),
  plan_id uuid null,
  is_system boolean null default false,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  owner_id uuid null,
  settings jsonb null default '{}'::jsonb,
  is_demo boolean not null default false,
  logo_path text null,
  updated_by uuid null,
  constraint organizations_pkey primary key (id),
  constraint organizations_id_key unique (id),
  constraint organizations_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint organizations_owner_fkey foreign KEY (owner_id) references users (id) on delete set null,
  constraint organizations_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete set null,
  constraint organizations_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_organizations_updated_at on public.organizations using btree (updated_at) TABLESPACE pg_default;

create index IF not exists idx_organizations_active_not_deleted on public.organizations using btree (is_active, is_deleted) TABLESPACE pg_default;

create index IF not exists idx_organizations_plan on public.organizations using btree (plan_id) TABLESPACE pg_default;

create trigger on_organizations_audit
after INSERT
or DELETE
or
update on organizations for EACH row
execute FUNCTION log_organizations_activity ();

create trigger organizations_set_updated_at BEFORE
update on organizations for EACH row when (old.updated_at is distinct from new.updated_at)
execute FUNCTION update_updated_at_column ();

create trigger set_updated_by_organizations BEFORE
update on organizations for EACH row
execute FUNCTION handle_updated_by_organizations ();

# Tabla PAYMENT_EVENTS:

create table public.payment_events (
  id uuid not null default gen_random_uuid (),
  provider_event_id text null,
  provider_event_type text null,
  status text null default 'RECEIVED'::text,
  raw_headers jsonb null,
  raw_payload jsonb not null,
  created_at timestamp with time zone null default now(),
  order_id text null,
  custom_id text null,
  user_hint text null,
  course_hint text null,
  provider text not null default 'paypal'::text,
  provider_payment_id text null,
  amount numeric null,
  currency text null,
  processed_at timestamp with time zone null,
  constraint paypal_events_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_payment_events_provider on public.payment_events using btree (provider) TABLESPACE pg_default;

create index IF not exists idx_payment_events_order_id on public.payment_events using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_payment_events_custom_id on public.payment_events using btree (custom_id) TABLESPACE pg_default;

# Tabla PAYMENTS:

create table public.payments (
  id uuid not null default gen_random_uuid (),
  provider text not null,
  provider_payment_id text null,
  user_id uuid not null,
  course_id uuid null,
  amount numeric null,
  currency text null default 'USD'::text,
  status text not null default 'completed'::text,
  created_at timestamp with time zone not null default now(),
  product_type text null,
  product_id uuid null,
  organization_id uuid null,
  approved_at timestamp with time zone null,
  metadata jsonb null,
  gateway text null,
  exchange_rate numeric(10, 4) null,
  constraint payments_pkey primary key (id),
  constraint payments_provider_payment_unique unique (provider, provider_payment_id),
  constraint payments_course_id_fkey foreign KEY (course_id) references courses (id) on delete set null,
  constraint payments_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete set null,
  constraint payments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint payments_status_chk check (
    (
      status = any (
        array[
          'pending'::text,
          'completed'::text,
          'rejected'::text,
          'refunded'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_payments_user on public.payments using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_payments_course on public.payments using btree (course_id) TABLESPACE pg_default;

create trigger on_payment_created_send_email
after INSERT on payments for EACH row
execute FUNCTION notify_replit_email ();

create trigger trg_notify_payment
after INSERT
or
update on payments for EACH row
execute FUNCTION trigger_notify_admin_on_payment ();

create trigger trg_notify_user_payment_completed
after INSERT
or
update on payments for EACH row
execute FUNCTION trigger_notify_user_payment_completed ();

# Tabla PAYPAL_PREFERENCES:

create table public.paypal_preferences (
  id character varying(50) not null,
  order_id character varying(100) null,
  user_id uuid not null,
  organization_id uuid null,
  plan_id uuid null,
  plan_slug text null,
  billing_period text null,
  amount numeric(12, 2) null,
  currency text null default 'USD'::text,
  product_type text null,
  course_id uuid null,
  coupon_id uuid null,
  coupon_code text null,
  discount_amount numeric(12, 2) null default 0,
  is_test boolean null default false,
  is_sandbox boolean null default false,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  captured_at timestamp with time zone null,
  expires_at timestamp with time zone null,
  seats_quantity integer null,
  constraint paypal_preferences_pkey primary key (id),
  constraint paypal_preferences_coupon_id_fkey foreign KEY (coupon_id) references coupons (id) on delete set null,
  constraint paypal_preferences_course_id_fkey foreign KEY (course_id) references courses (id) on delete set null,
  constraint paypal_preferences_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint paypal_preferences_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete set null,
  constraint paypal_preferences_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint paypal_preferences_product_type_check check (
    (
      (
        product_type = any (
          array[
            'subscription'::text,
            'course'::text,
            'seats'::text
          ]
        )
      )
      or (product_type is null)
    )
  ),
  constraint paypal_preferences_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'completed'::text,
          'cancelled'::text,
          'expired'::text
        ]
      )
    )
  ),
  constraint paypal_preferences_billing_period_check check (
    (
      (
        billing_period = any (array['monthly'::text, 'annual'::text])
      )
      or (billing_period is null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_paypal_preferences_user on public.paypal_preferences using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_paypal_preferences_org on public.paypal_preferences using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_paypal_preferences_order on public.paypal_preferences using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_paypal_preferences_status on public.paypal_preferences using btree (status) TABLESPACE pg_default
where
  (status = 'pending'::text);

# Tabla PLANS:

create table public.plans (
  id uuid not null default gen_random_uuid (),
  name text not null,
  features jsonb null,
  is_active boolean null default true,
  billing_type text null default 'per_user'::text,
  slug text null,
  monthly_amount numeric null,
  annual_amount numeric null,
  paypal_product_id text null,
  paypal_plan_monthly_id text null,
  paypal_plan_annual_id text null,
  mp_plan_monthly_id text null,
  mp_plan_annual_id text null,
  status text not null default 'available'::text,
  paypal_product_id_sandbox text null,
  paypal_plan_monthly_id_sandbox text null,
  paypal_plan_annual_id_sandbox text null,
  annual_discount_percent numeric(5, 2) null default 0,
  constraint plans_pkey primary key (id),
  constraint plans_name_key unique (name),
  constraint plans_status_check check (
    (
      status = any (
        array[
          'available'::text,
          'coming_soon'::text,
          'maintenance'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

# Tabla SUBSCRIPTION_NOTIFICATIONS_LOG:

create table public.subscription_notifications_log (
  id uuid not null default gen_random_uuid (),
  subscription_id uuid not null,
  notification_type text not null,
  sent_at timestamp with time zone null default now(),
  constraint subscription_notifications_log_pkey primary key (id),
  constraint subscription_notifications_lo_subscription_id_notification__key unique (subscription_id, notification_type),
  constraint subscription_notifications_log_subscription_id_fkey foreign KEY (subscription_id) references organization_subscriptions (id) on delete CASCADE
) TABLESPACE pg_default;

# Tabla USER_NOTIFICATIONS:

create table public.user_notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  notification_id uuid not null,
  delivered_at timestamp with time zone not null default now(),
  read_at timestamp with time zone null,
  clicked_at timestamp with time zone null,
  constraint user_notifications_pkey primary key (id),
  constraint user_notifications_user_id_notification_id_key unique (user_id, notification_id),
  constraint user_notifications_notification_id_fkey foreign KEY (notification_id) references notifications (id) on delete CASCADE,
  constraint user_notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists user_notifications_user_idx on public.user_notifications using btree (user_id, read_at) TABLESPACE pg_default;

# Tabla USERS:

create table public.users (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  auth_id uuid not null,
  email text not null,
  avatar_url text null,
  avatar_source public.avatar_source_t null default 'email'::avatar_source_t,
  full_name text null,
  role_id uuid not null default 'e6cc68d2-fc28-421b-8bd3-303326ef91b8'::uuid,
  updated_at timestamp with time zone null default now(),
  is_active boolean not null default true,
  signup_completed boolean not null default false,
  constraint users_pkey primary key (id),
  constraint users_auth_id_key unique (auth_id),
  constraint users_id_key unique (id),
  constraint users_auth_id_fkey foreign KEY (auth_id) references auth.users (id) on delete CASCADE,
  constraint users_role_id_fkey foreign KEY (role_id) references roles (id) on delete RESTRICT,
  constraint users_email_format_chk check (
    (
      email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists users_email_lower_uniq on public.users using btree (lower(email)) TABLESPACE pg_default;

create index IF not exists idx_users_auth_id on public.users using btree (auth_id) TABLESPACE pg_default;

create index IF not exists idx_users_role_id on public.users using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_users_avatar_source on public.users using btree (avatar_source) TABLESPACE pg_default;

create index IF not exists idx_users_signup_completed on public.users using btree (signup_completed) TABLESPACE pg_default;

create trigger notify_new_user
after INSERT on users for EACH row
execute FUNCTION notify_admin_on_new_user ();

create trigger set_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_users_normalize_email BEFORE INSERT
or
update on users for EACH row
execute FUNCTION users_normalize_email ();

create trigger trigger_sync_contact_on_user_update
after
update on users for EACH row
execute FUNCTION sync_contact_on_user_update ();

