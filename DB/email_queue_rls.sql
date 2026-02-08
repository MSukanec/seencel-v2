-- ============================================================
-- Auditoría y RLS para email_queue
-- Fecha: 2026-02-08
-- ============================================================
--
-- AUDITORÍA DE LA TABLA:
--
-- ✅ Estructura OK:
--   - PK uuid con gen_random_uuid() ✓
--   - NOT NULL en campos requeridos (recipient_email, template_type, subject) ✓
--   - Default values coherentes (status='pending', attempts=0, data='{}') ✓
--   - Índice parcial para performance (idx_email_queue_pending) ✓
--   - created_at con default now() ✓
--
-- ⚠️ Observaciones menores:
--   - `attempts` es nullable (NULL vs 0) — No es crítico porque tiene DEFAULT 0
--   - `created_at` es nullable — No es crítico porque tiene DEFAULT now()
--   - No tiene `updated_at` — Aceptable, el CRON actualiza status/sent_at/last_error
--
-- 📋 Esta tabla NO necesita:
--   - organization_id (es infraestructura global, no pertenece a una org)
--   - created_by / updated_by (los inserts vienen de triggers SQL, no de usuarios)
--   - Audit log trigger (no es una entidad de negocio)
--   - Soft delete (los emails procesados se marcan como 'sent' o 'failed')
--
-- ============================================================

-- 1) Habilitar RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- 2) POLÍTICA: Nadie lee desde el frontend
--    Los emails se procesan desde el CRON (service_role key, bypasea RLS)
--    y se insertan desde triggers SQL (SECURITY DEFINER, bypasea RLS)
--    
--    Solo el admin global puede ver la cola (para debug en admin panel)

CREATE POLICY "ADMINS VEN EMAIL_QUEUE"
ON public.email_queue
FOR SELECT TO public
USING (is_admin());

-- 3) POLÍTICA: Nadie inserta desde el frontend
--    Los inserts vienen SOLO de:
--    - Triggers SQL (queue_email_welcome) → SECURITY DEFINER bypasea RLS
--    - Funciones SQL (step_send_purchase_email) → SECURITY DEFINER bypasea RLS
--    
--    NO se necesita política INSERT porque ningún usuario inserta directamente.
--    Si algún día se necesita (ej: "Contactar soporte"), se agrega específicamente.

-- 4) POLÍTICA: Nadie edita desde el frontend
--    Los updates vienen SOLO del CRON (service_role key → bypasea RLS)
--    
--    NO se necesita política UPDATE.

-- 5) POLÍTICA: Solo admins pueden limpiar la cola (DELETE real, no soft delete)
--    Útil para purgar emails viejos desde admin panel.

CREATE POLICY "ADMINS BORRAN EMAIL_QUEUE"
ON public.email_queue
FOR DELETE TO public
USING (is_admin());
