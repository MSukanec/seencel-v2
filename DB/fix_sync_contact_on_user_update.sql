-- ============================================================================
-- FIX: iam.sync_contact_on_user_update()
-- Problema: La función referencia "projects.contacts" que ya no existe.
--           La tabla fue migrada a "contacts.contacts".
-- Impacto: Bloquea el onboarding (error 42P01 al hacer UPDATE en iam.users).
-- ============================================================================

CREATE OR REPLACE FUNCTION iam.sync_contact_on_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'contacts', 'iam'
AS $function$
begin
  -- Solo si cambian full_name o email
  if (old.full_name is distinct from new.full_name)
     or (old.email is distinct from new.email) then

    update contacts.contacts c
    set full_name  = coalesce(new.full_name, c.full_name),
        email      = coalesce(new.email, c.email),
        updated_at = now()
    where c.linked_user_id = new.id;
  end if;

  return new;
end;
$function$;
