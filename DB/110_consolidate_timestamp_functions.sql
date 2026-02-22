-- ===========================================================================
-- 110: CONSOLIDATE DUPLICATE TIMESTAMP FUNCTIONS
-- ===========================================================================
-- Existen 3 funciones idénticas en public:
--   - set_timestamp()     (~28 triggers)
--   - set_updated_at()    (~7 triggers)
--   - update_timestamp()  (~8 triggers)
--
-- Las 3 hacen exactamente lo mismo: new.updated_at := now()
-- Consolidamos en set_timestamp() y re-apuntamos los triggers restantes.
-- ===========================================================================

BEGIN;

-- =============================================
-- Paso 1: Re-apuntar triggers que usan set_updated_at()
-- =============================================

-- finance
DROP TRIGGER IF EXISTS set_updated_at_financial_operation_movements ON finance.financial_operation_movements;
CREATE TRIGGER set_updated_at_financial_operation_movements
    BEFORE UPDATE ON finance.financial_operation_movements
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS set_updated_at_financial_operations ON finance.financial_operations;
CREATE TRIGGER set_updated_at_financial_operations
    BEFORE UPDATE ON finance.financial_operations
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_updated_at_general_cost_categories ON finance.general_cost_categories;
CREATE TRIGGER trg_set_updated_at_general_cost_categories
    BEFORE UPDATE ON finance.general_cost_categories
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- catalog
DROP TRIGGER IF EXISTS trg_set_updated_at_material_types ON catalog.material_types;
CREATE TRIGGER trg_set_updated_at_material_types
    BEFORE UPDATE ON catalog.material_types
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_updated_at_unit_categories ON catalog.unit_categories;
CREATE TRIGGER trg_set_updated_at_unit_categories
    BEFORE UPDATE ON catalog.unit_categories
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_updated_at_units ON catalog.units;
CREATE TRIGGER trg_set_updated_at_units
    BEFORE UPDATE ON catalog.units
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- billing
DROP TRIGGER IF EXISTS trg_coupons_set_updated ON billing.coupons;
CREATE TRIGGER trg_coupons_set_updated
    BEFORE UPDATE ON billing.coupons
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- =============================================
-- Paso 2: Re-apuntar triggers que usan update_timestamp()
-- =============================================

-- public
DROP TRIGGER IF EXISTS media_file_folders_set_updated_at ON public.media_file_folders;
CREATE TRIGGER media_file_folders_set_updated_at
    BEFORE UPDATE ON public.media_file_folders
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- finance
DROP TRIGGER IF EXISTS client_commitments_set_updated_at ON finance.client_commitments;
CREATE TRIGGER client_commitments_set_updated_at
    BEFORE UPDATE ON finance.client_commitments
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS client_payment_schedule_set_updated_at ON finance.client_payment_schedule;
CREATE TRIGGER client_payment_schedule_set_updated_at
    BEFORE UPDATE ON finance.client_payment_schedule
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- construction
DROP TRIGGER IF EXISTS update_site_log_types_timestamp ON construction.site_log_types;
CREATE TRIGGER update_site_log_types_timestamp
    BEFORE UPDATE ON construction.site_log_types
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS update_site_logs_timestamp ON construction.site_logs;
CREATE TRIGGER update_site_logs_timestamp
    BEFORE UPDATE ON construction.site_logs
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- academy
DROP TRIGGER IF EXISTS course_details_set_updated_at ON academy.course_details;
CREATE TRIGGER course_details_set_updated_at
    BEFORE UPDATE ON academy.course_details
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS course_enrollments_set_updated_at ON academy.course_enrollments;
CREATE TRIGGER course_enrollments_set_updated_at
    BEFORE UPDATE ON academy.course_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS course_faqs_set_updated_at ON academy.course_faqs;
CREATE TRIGGER course_faqs_set_updated_at
    BEFORE UPDATE ON academy.course_faqs
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS course_instructors_set_updated_at ON academy.course_instructors;
CREATE TRIGGER course_instructors_set_updated_at
    BEFORE UPDATE ON academy.course_instructors
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS course_lesson_notes_set_updated_at ON academy.course_lesson_notes;
CREATE TRIGGER course_lesson_notes_set_updated_at
    BEFORE UPDATE ON academy.course_lesson_notes
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS course_lessons_set_updated_at ON academy.course_lessons;
CREATE TRIGGER course_lessons_set_updated_at
    BEFORE UPDATE ON academy.course_lessons
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS course_modules_set_updated_at ON academy.course_modules;
CREATE TRIGGER course_modules_set_updated_at
    BEFORE UPDATE ON academy.course_modules
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS courses_set_updated_at ON academy.courses;
CREATE TRIGGER courses_set_updated_at
    BEFORE UPDATE ON academy.courses
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- =============================================
-- Paso 3: DROP funciones duplicadas
-- =============================================

DROP FUNCTION IF EXISTS public.set_updated_at();
DROP FUNCTION IF EXISTS public.update_timestamp();

COMMIT;
