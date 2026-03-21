-- ============================================================================
-- Seencel V2 — AI Organization Tracking Migration (STRICT compliance)
-- Fecha: Marzo 2026
-- ============================================================================




-- ============================================================================
-- 2. Modificaciones a ai.ai_usage_logs
-- ============================================================================
ALTER TABLE ai.ai_usage_logs 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES iam.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES iam.organization_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES iam.organization_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_organization_id ON ai.ai_usage_logs(organization_id) WHERE is_deleted = false;

-- RLS para ai.ai_usage_logs
ALTER TABLE ai.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Eliminamos políticas viejas por si acaso
DROP POLICY IF EXISTS "MEMBERS SELECT AI_USAGE_LOGS" ON ai.ai_usage_logs;
DROP POLICY IF EXISTS "Miembros pueden ver logs de su org" ON ai.ai_usage_logs;
DROP POLICY IF EXISTS "Nadie puede insertar logs desde el cliente" ON ai.ai_usage_logs;
DROP POLICY IF EXISTS "Nadie puede actualizar logs desde el cliente" ON ai.ai_usage_logs;
DROP POLICY IF EXISTS "Nadie puede eliminar logs desde el cliente" ON ai.ai_usage_logs;

CREATE POLICY "MEMBERS SELECT AI_USAGE_LOGS"
ON ai.ai_usage_logs FOR SELECT TO public
USING (iam.can_view_org(organization_id, 'organization.view'::text));

-- Trigger set_updated_by
DROP TRIGGER IF EXISTS set_updated_by_ai_usage_logs ON ai.ai_usage_logs;
CREATE TRIGGER set_updated_by_ai_usage_logs
BEFORE INSERT OR UPDATE ON ai.ai_usage_logs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- ============================================================================
-- 3. Nueva tabla: ai.ai_organization_usage_limits
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai.ai_organization_usage_limits (
    organization_id uuid PRIMARY KEY REFERENCES iam.organizations(id) ON DELETE CASCADE,
    plan text NOT NULL DEFAULT 'free',
    daily_requests_limit int4 NOT NULL DEFAULT 10,
    requests_used_today int4 NOT NULL DEFAULT 0,
    last_request_at timestamptz,
    last_reset_at date DEFAULT CURRENT_DATE,
    
    monthly_tokens_limit int4,
    tokens_used_this_month int4 DEFAULT 0,

    -- Columnas obligatorias
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    is_deleted boolean DEFAULT false,
    deleted_at timestamptz,
    created_by uuid REFERENCES iam.organization_members(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES iam.organization_members(id) ON DELETE SET NULL,
    import_batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL
);

-- RLS para ai.ai_organization_usage_limits
ALTER TABLE ai.ai_organization_usage_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MEMBERS SELECT AI_ORGANIZATION_USAGE_LIMITS" ON ai.ai_organization_usage_limits;
DROP POLICY IF EXISTS "Miembros pueden ver límites de IA de su org" ON ai.ai_organization_usage_limits;
DROP POLICY IF EXISTS "Nadie puede actualizar limites desde el cliente" ON ai.ai_organization_usage_limits;
DROP POLICY IF EXISTS "Nadie puede insertar limites desde el cliente" ON ai.ai_organization_usage_limits;

CREATE POLICY "MEMBERS SELECT AI_ORGANIZATION_USAGE_LIMITS"
ON ai.ai_organization_usage_limits FOR SELECT TO public
USING (iam.can_view_org(organization_id, 'organization.view'::text));

-- Trigger set_updated_by
DROP TRIGGER IF EXISTS set_updated_by_ai_organization_usage_limits ON ai.ai_organization_usage_limits;
CREATE TRIGGER set_updated_by_ai_organization_usage_limits
BEFORE INSERT OR UPDATE ON ai.ai_organization_usage_limits
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();


-- ============================================================================
-- 4. Audit Logging Triggers
-- ============================================================================

-- A. Audit para ai_organization_usage_limits
CREATE OR REPLACE FUNCTION public.log_ai_org_limit_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; audit_action := 'delete_ai_org_limit';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_ai_org_limit';
        ELSE
            audit_action := 'update_ai_org_limit';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; audit_action := 'create_ai_org_limit';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('plan', target_record.plan);

    BEGIN
        INSERT INTO audit.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.organization_id, 'ai_organization_usage_limits', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ai_org_limit_audit ON ai.ai_organization_usage_limits;
CREATE TRIGGER on_ai_org_limit_audit
AFTER INSERT OR UPDATE OR DELETE ON ai.ai_organization_usage_limits
FOR EACH ROW EXECUTE FUNCTION public.log_ai_org_limit_activity();
