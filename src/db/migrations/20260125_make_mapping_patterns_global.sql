-- Allow global read access to mapping patterns (Community Intelligence)
-- We keep insert/update restricted to own organization for accountability, but allow reading everything.

drop policy if exists "Users can view mapping patterns of their organization" on public.ia_import_mapping_patterns;

create policy "Users can view all mapping patterns (Community)"
  on public.ia_import_mapping_patterns for select
  using ( auth.role() = 'authenticated' );

-- NOTE: Value patterns (ia_import_value_patterns) must remain private because they map to specific UUIDs (Context-Aware Parity).
