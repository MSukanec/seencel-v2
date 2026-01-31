-- Migration: Add KPI compact format preference
-- Allows organizations to choose between abbreviated (10K) or full (10.568) number display

ALTER TABLE organization_preferences 
ADD COLUMN IF NOT EXISTS kpi_compact_format boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN organization_preferences.kpi_compact_format IS 
  'Si true, muestra KPIs en formato abreviado (10K, 1.5M). Si false (default), muestra números completos (10.568).';
