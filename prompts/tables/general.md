# Tablas de uso de CATALOGO:

# Tabla CURRENCIES:

create table public.currencies (
  id uuid not null default gen_random_uuid (),
  code text not null,
  name text not null,
  symbol text not null,
  country text null,
  is_default boolean null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint currencies_pkey primary key (id),
  constraint currencies_code_key unique (code),
  constraint currencies_code_iso_chk check ((code ~ '^[A-Z]{3}$'::text)),
  constraint currencies_name_not_blank_chk check ((btrim(name) <> ''::text)),
  constraint currencies_symbol_not_blank_chk check ((btrim(symbol) <> ''::text))
) TABLESPACE pg_default;

create index IF not exists idx_currencies_name on public.currencies using btree (name) TABLESPACE pg_default;

create index IF not exists idx_currencies_code on public.currencies using btree (code) TABLESPACE pg_default;

# Tabla COUNTIRES:

create table public.countries (
  id uuid not null default gen_random_uuid (),
  alpha_3 text not null,
  country_code text null,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  alpha_2 text null,
  constraint countries_pkey primary key (id),
  constraint countries_alpha2_format_chk check (
    (
      (alpha_2 is null)
      or (alpha_2 ~ '^[A-Z]{2}$'::text)
    )
  ),
  constraint countries_alpha3_format_chk check ((alpha_3 ~ '^[A-Z]{3}$'::text)),
  constraint countries_country_code_chk check (
    (
      (country_code is null)
      or (country_code ~ '^\+?[0-9]{1,4}$'::text)
    )
  ),
  constraint countries_name_not_blank_chk check ((btrim(name) <> ''::text))
) TABLESPACE pg_default;

create unique INDEX IF not exists countries_name_lower_uniq on public.countries using btree (lower(name)) TABLESPACE pg_default;

create unique INDEX IF not exists countries_alpha3_uniq on public.countries using btree (alpha_3) TABLESPACE pg_default;

create unique INDEX IF not exists countries_alpha2_uniq on public.countries using btree (alpha_2) TABLESPACE pg_default;

create index IF not exists idx_countries_name on public.countries using btree (name) TABLESPACE pg_default;