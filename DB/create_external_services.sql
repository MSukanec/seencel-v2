-- ============================================================================
-- EXTERNAL SERVICES EN RECETAS — Migración Definitiva
-- Dropea y recrea task_recipe_external_services con paridad 100% a
-- task_recipe_materials y task_recipe_labor.
-- ============================================================================

-- ============================================================================
-- 1. LIMPIAR — Drop tabla vieja y dependencias huérfanas
-- ============================================================================

-- 1a. Drop tabla de precios vieja (apuntaba a external_services que ya no existe)
DROP TABLE IF EXISTS public.external_service_prices CASCADE;

-- 1b. Drop tabla actual de componentes de receta
DROP TABLE IF EXISTS public.task_recipe_external_services CASCADE;

-- 1c. Drop tabla catálogo vieja (por si todavía existe)
DROP TABLE IF EXISTS public.external_services CASCADE;

-- 1d. Drop funciones de auditoría viejas (si existieran)
DROP FUNCTION IF EXISTS public.log_recipe_external_service_activity() CASCADE;

-- ============================================================================
-- 2. CREAR — task_recipe_external_services (hermana de materials/labor)
-- ============================================================================

CREATE TABLE public.task_recipe_external_services (
    -- === Identidad ===
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.task_recipes(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- === Dato principal (no hay catálogo, es nombre libre) ===
    name TEXT NOT NULL,

    -- === Cantidad y unidad (idéntico a labor) ===
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,

    -- === Precio (inline, porque no hay tabla de precios de catálogo) ===
    unit_price NUMERIC(18,4) NOT NULL DEFAULT 0,
    currency_id UUID NOT NULL REFERENCES public.currencies(id),

    -- === Proveedor/contacto (exclusivo de external services) ===
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,

    -- === Flags (idéntico a materials/labor) ===
    is_optional BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,

    -- === Soft delete (idéntico a materials/labor) ===
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,

    -- === Auditoría (idéntico a materials/labor) ===
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.organization_members(id),
    updated_by UUID REFERENCES public.organization_members(id),

    -- === Import (idéntico a materials/labor) ===
    import_batch_id UUID REFERENCES public.import_batches(id)
);

-- ============================================================================
-- 3. CREAR — external_service_prices (historial de precios)
-- Mismo patrón que material_prices y labor_prices pero FK a recipe item
-- ============================================================================

CREATE TABLE public.external_service_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_external_service_id UUID NOT NULL REFERENCES public.task_recipe_external_services(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    currency_id UUID NOT NULL REFERENCES public.currencies(id),
    unit_price NUMERIC(18,4) NOT NULL,
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.organization_members(id),
    updated_by UUID REFERENCES public.organization_members(id)
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX idx_task_recipe_ext_services_recipe
    ON public.task_recipe_external_services(recipe_id)
    WHERE NOT is_deleted;

CREATE INDEX idx_task_recipe_ext_services_org
    ON public.task_recipe_external_services(organization_id)
    WHERE NOT is_deleted;

CREATE INDEX idx_ext_service_prices_service
    ON public.external_service_prices(recipe_external_service_id);

-- ============================================================================
-- 5. TRIGGERS — Paridad completa con materials/labor (3 triggers)
-- ============================================================================

-- 5a. updated_at automático (usa set_timestamp, igual que materials/labor)
CREATE TRIGGER task_recipe_external_services_set_updated_at
    BEFORE UPDATE ON public.task_recipe_external_services
    FOR EACH ROW
    EXECUTE FUNCTION public.set_timestamp();

-- 5b. updated_by automático (usa handle_updated_by, igual que materials/labor)
CREATE TRIGGER set_updated_by_task_recipe_external_services
    BEFORE INSERT OR UPDATE ON public.task_recipe_external_services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_by();

-- 5c. Auditoría — función + trigger (calco exacto de log_recipe_labor_activity)
CREATE OR REPLACE FUNCTION public.log_recipe_external_service_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_recipe_external_service';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_recipe_external_service';
        ELSE
            audit_action := 'update_recipe_external_service';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_recipe_external_service';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'recipe_id', target_record.recipe_id,
        'name', target_record.name,
        'quantity', target_record.quantity
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'task_recipe_external_services', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$;

CREATE TRIGGER on_recipe_external_service_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.task_recipe_external_services
    FOR EACH ROW
    EXECUTE FUNCTION public.log_recipe_external_service_activity();

-- 5d. updated_at para external_service_prices
CREATE TRIGGER external_service_prices_set_updated_at
    BEFORE UPDATE ON public.external_service_prices
    FOR EACH ROW
    EXECUTE FUNCTION public.set_timestamp();

-- ============================================================================
-- 6. Enable RLS (obligatorio, políticas se crean aparte)
-- ============================================================================

ALTER TABLE public.task_recipe_external_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_service_prices ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. task_costs_view — Agregar tercer pilar: external services
-- ============================================================================

DROP VIEW IF EXISTS public.task_costs_view;

CREATE VIEW public.task_costs_view AS
WITH recipe_material_costs AS (
    SELECT trm.recipe_id,
        tr.task_id,
        tr.organization_id,
        sum(((trm.total_quantity * COALESCE(mp.unit_price, (0)::numeric)) / GREATEST(COALESCE(mat.default_sale_unit_quantity, (1)::numeric), (1)::numeric))) AS mat_cost,
        min(mp.valid_from) AS oldest_mat_price_date
    FROM (((task_recipe_materials trm
        JOIN task_recipes tr ON ((tr.id = trm.recipe_id) AND (tr.is_deleted = false)))
        LEFT JOIN materials mat ON ((mat.id = trm.material_id)))
        LEFT JOIN LATERAL ( SELECT mp_inner.unit_price,
                mp_inner.valid_from
            FROM material_prices mp_inner
            WHERE ((mp_inner.material_id = trm.material_id) AND (mp_inner.organization_id = tr.organization_id) AND (mp_inner.valid_from <= CURRENT_DATE) AND ((mp_inner.valid_to IS NULL) OR (mp_inner.valid_to >= CURRENT_DATE)))
            ORDER BY mp_inner.valid_from DESC
            LIMIT 1) mp ON (true))
    WHERE (trm.is_deleted = false)
    GROUP BY trm.recipe_id, tr.task_id, tr.organization_id
), recipe_labor_costs AS (
    SELECT trl.recipe_id,
        tr.task_id,
        tr.organization_id,
        sum((trl.quantity * COALESCE(lp.unit_price, (0)::numeric))) AS lab_cost,
        min(lp.valid_from) AS oldest_lab_price_date
    FROM ((task_recipe_labor trl
        JOIN task_recipes tr ON ((tr.id = trl.recipe_id) AND (tr.is_deleted = false)))
        LEFT JOIN LATERAL ( SELECT lp_inner.unit_price,
                lp_inner.valid_from
            FROM labor_prices lp_inner
            WHERE ((lp_inner.labor_type_id = trl.labor_type_id) AND (lp_inner.organization_id = tr.organization_id) AND ((lp_inner.valid_to IS NULL) OR (lp_inner.valid_to >= CURRENT_DATE)))
            ORDER BY lp_inner.valid_from DESC
            LIMIT 1) lp ON (true))
    WHERE (trl.is_deleted = false)
    GROUP BY trl.recipe_id, tr.task_id, tr.organization_id
), recipe_ext_service_costs AS (
    SELECT tres.recipe_id,
        tr.task_id,
        tr.organization_id,
        sum((tres.quantity * tres.unit_price)) AS ext_cost
    FROM (task_recipe_external_services tres
        JOIN task_recipes tr ON ((tr.id = tres.recipe_id) AND (tr.is_deleted = false)))
    WHERE (tres.is_deleted = false)
    GROUP BY tres.recipe_id, tr.task_id, tr.organization_id
), recipe_totals AS (
    SELECT tr.id AS recipe_id,
        tr.task_id,
        tr.organization_id,
        COALESCE(rmc.mat_cost, (0)::numeric) AS mat_cost,
        COALESCE(rlc.lab_cost, (0)::numeric) AS lab_cost,
        COALESCE(rec.ext_cost, (0)::numeric) AS ext_cost,
        (COALESCE(rmc.mat_cost, (0)::numeric) + COALESCE(rlc.lab_cost, (0)::numeric) + COALESCE(rec.ext_cost, (0)::numeric)) AS total_cost,
        LEAST(rmc.oldest_mat_price_date, rlc.oldest_lab_price_date) AS oldest_price_date
    FROM (((task_recipes tr
        LEFT JOIN recipe_material_costs rmc ON ((rmc.recipe_id = tr.id)))
        LEFT JOIN recipe_labor_costs rlc ON ((rlc.recipe_id = tr.id)))
        LEFT JOIN recipe_ext_service_costs rec ON ((rec.recipe_id = tr.id)))
    WHERE (tr.is_deleted = false)
)
SELECT rt.task_id,
    rt.organization_id,
    (round(avg(rt.total_cost), 2))::numeric(14,4) AS unit_cost,
    (round(avg(rt.mat_cost), 2))::numeric(14,4) AS mat_unit_cost,
    (round(avg(rt.lab_cost), 2))::numeric(14,4) AS lab_unit_cost,
    (round(avg(rt.ext_cost), 2))::numeric(14,4) AS ext_unit_cost,
    (count(rt.recipe_id))::integer AS recipe_count,
    (round(min(rt.total_cost), 2))::numeric(14,4) AS min_cost,
    (round(max(rt.total_cost), 2))::numeric(14,4) AS max_cost,
    min(rt.oldest_price_date) AS oldest_price_date
FROM recipe_totals rt
GROUP BY rt.task_id, rt.organization_id;
