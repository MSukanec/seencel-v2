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