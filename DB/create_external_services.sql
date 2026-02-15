-- ============================================================
-- EXTERNAL SERVICES TABLES
-- Tablas para servicios externos (subcontratos de receta)
-- ============================================================

-- 1. Catálogo de servicios externos por organización
CREATE TABLE IF NOT EXISTS public.external_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    modality TEXT NOT NULL DEFAULT 'execution_only' CHECK (modality IN ('execution_only', 'turnkey')),
    description TEXT,
    default_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- 2. Precios de servicios externos (historial)
CREATE TABLE IF NOT EXISTS public.external_service_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_service_id UUID NOT NULL REFERENCES public.external_services(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    currency_id UUID NOT NULL REFERENCES public.currencies(id),
    unit_price NUMERIC(18,4) NOT NULL DEFAULT 0,
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Servicios externos en recetas de tareas
CREATE TABLE IF NOT EXISTS public.task_recipe_external_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.task_recipes(id) ON DELETE CASCADE,
    external_service_id UUID NOT NULL REFERENCES public.external_services(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    quantity NUMERIC(18,4) NOT NULL DEFAULT 1,
    notes TEXT,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    is_optional BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_external_services_org ON public.external_services(organization_id) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_external_service_prices_service ON public.external_service_prices(external_service_id);
CREATE INDEX IF NOT EXISTS idx_task_recipe_external_services_recipe ON public.task_recipe_external_services(recipe_id) WHERE NOT is_deleted;

-- ============================================================
-- TRIGGERS (updated_at)
-- ============================================================

CREATE OR REPLACE TRIGGER update_external_services_updated_at
    BEFORE UPDATE ON public.external_services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_task_recipe_external_services_updated_at
    BEFORE UPDATE ON public.task_recipe_external_services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RLS — ENABLE
-- ============================================================

ALTER TABLE public.external_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_recipe_external_services ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS — external_services
-- ============================================================

CREATE POLICY "external_services_select" ON public.external_services
    FOR SELECT USING (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

CREATE POLICY "external_services_insert" ON public.external_services
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

CREATE POLICY "external_services_update" ON public.external_services
    FOR UPDATE USING (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

CREATE POLICY "external_services_delete" ON public.external_services
    FOR DELETE USING (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- ============================================================
-- RLS — external_service_prices
-- ============================================================

CREATE POLICY "external_service_prices_select" ON public.external_service_prices
    FOR SELECT USING (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

CREATE POLICY "external_service_prices_insert" ON public.external_service_prices
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

CREATE POLICY "external_service_prices_update" ON public.external_service_prices
    FOR UPDATE USING (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

CREATE POLICY "external_service_prices_delete" ON public.external_service_prices
    FOR DELETE USING (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- ============================================================
-- RLS — task_recipe_external_services
-- ============================================================

CREATE POLICY "task_recipe_external_services_select" ON public.task_recipe_external_services
    FOR SELECT USING (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

CREATE POLICY "task_recipe_external_services_insert" ON public.task_recipe_external_services
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

CREATE POLICY "task_recipe_external_services_update" ON public.task_recipe_external_services
    FOR UPDATE USING (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

CREATE POLICY "task_recipe_external_services_delete" ON public.task_recipe_external_services
    FOR DELETE USING (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_members om
            JOIN public.users u ON u.id = om.user_id
            WHERE u.auth_id = auth.uid()
        )
    );
