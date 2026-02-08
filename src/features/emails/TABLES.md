# Tablas en DB para EMAILS:

## Tabla EMAIL_QUEUE:

create table public.email_queue (
  id uuid not null default gen_random_uuid (),
  recipient_email text not null,
  recipient_name text null,
  template_type text not null,
  subject text not null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'pending'::text,
  attempts integer null default 0,
  last_error text null,
  sent_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint email_queue_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_email_queue_pending on public.email_queue using btree (status, created_at) TABLESPACE pg_default
where
  (status = 'pending'::text);