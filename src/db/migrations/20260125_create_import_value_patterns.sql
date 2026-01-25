-- Create table for storing learned value mappings (e.g., "Pesos" -> "ARS_UUID")
create table public.ia_import_value_patterns (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  entity text not null, -- e.g., 'subcontract_payments'
  comp_field text not null, -- e.g., 'currency_code' (Internal Config ID)
  source_value text not null, -- e.g., 'Pesos'
  target_id text not null, -- e.g., 'uuid-of-ars'
  usage_count integer not null default 1,
  last_used_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  
  constraint ia_import_value_patterns_pkey primary key (id),
  constraint ia_import_value_patterns_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  
  -- Unique constraint to prevent duplicates (upsert target)
  constraint ia_import_value_patterns_unique_source unique (organization_id, entity, comp_field, source_value)
);

-- RLS Policies
alter table public.ia_import_value_patterns enable row level security;

create policy "Users can view value patterns of their organization"
  on public.ia_import_value_patterns for select
  using ( organization_id in (
    select organization_id from organization_members where user_id = auth.uid()
  ));

create policy "Users can insert/update value patterns of their organization"
  on public.ia_import_value_patterns for all
  using ( organization_id in (
    select organization_id from organization_members where user_id = auth.uid()
  ));
