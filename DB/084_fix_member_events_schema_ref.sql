-- ============================================================
-- FIX: audit.log_member_billable_change()
-- 
-- Problema: La función usa INSERT INTO organization_member_events
-- sin prefijo de schema. Con search_path = 'audit', 'public',
-- PostgreSQL busca en audit.organization_member_events o 
-- public.organization_member_events — ninguna existe.
-- La tabla real está en billing.organization_member_events.
--
-- Esto rompe el flujo de aceptar invitaciones porque al hacer
-- INSERT en iam.organization_members, se dispara este trigger
-- y falla con: relation "organization_member_events" does not exist
-- ============================================================

CREATE OR REPLACE FUNCTION audit.log_member_billable_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'billing'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO billing.organization_member_events (organization_id, member_id, user_id, event_type, is_billable)
    VALUES (NEW.organization_id, NEW.id, NEW.user_id, 'member_added', NEW.is_billable);
  ELSIF TG_OP = 'UPDATE' AND OLD.is_billable IS DISTINCT FROM NEW.is_billable THEN
    INSERT INTO billing.organization_member_events (organization_id, member_id, user_id, event_type, was_billable, is_billable)
    VALUES (NEW.organization_id, NEW.id, NEW.user_id, 'billable_changed', OLD.is_billable, NEW.is_billable);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO billing.organization_member_events (organization_id, member_id, user_id, event_type, was_billable)
    VALUES (OLD.organization_id, OLD.id, OLD.user_id, 'member_removed', OLD.is_billable);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;
