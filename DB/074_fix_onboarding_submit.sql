-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  074 — Fix onboarding submit: broken schema reference           ║
-- ║                                                                 ║
-- ║  Problem: sync_contact_on_user_update() references              ║
-- ║           public.contacts (moved to projects.contacts)          ║
-- ║                                                                 ║
-- ║  This trigger fires AFTER UPDATE on iam.users, causing          ║
-- ║  the onboarding PATCH to fail with 404.                         ║
-- ╚══════════════════════════════════════════════════════════════════╝

BEGIN;

CREATE OR REPLACE FUNCTION iam.sync_contact_on_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'projects', 'iam'
AS $function$
begin
  -- Solo si cambian full_name o email
  if (old.full_name is distinct from new.full_name)
     or (old.email is distinct from new.email) then

    update projects.contacts c
    set full_name  = coalesce(new.full_name, c.full_name),
        email      = coalesce(new.email, c.email),
        updated_at = now()
    where c.linked_user_id = new.id;
  end if;

  return new;
end;
$function$;

COMMIT;

