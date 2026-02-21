"use server";

import { createClient } from "@/lib/supabase/server";
import { checkUserRoles } from "@/features/users/queries";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

/**
 * Helper: get current user's public ID with admin verification
 */
async function getAdminUserId() {
    const { isAdmin } = await checkUserRoles();
    if (!isAdmin) throw new Error("Unauthorized: admin role required");

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: publicUser } = await supabase
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) throw new Error("Public user record not found");
    return { supabase, userId: publicUser.id };
}

/**
 * Admin: switch to a target organization for support/impersonation.
 */
export async function adminImpersonateOrg(targetOrgId: string) {
    const { supabase, userId } = await getAdminUserId();

    // Get current org ID (to restore later)
    const { data: prefs } = await supabase
        .schema('iam').from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', userId)
        .single();

    const originalOrgId = prefs?.last_organization_id || null;

    // Switch to target org
    const { error } = await supabase
        .schema('iam').from('user_preferences')
        .update({ last_organization_id: targetOrgId })
        .eq('user_id', userId);

    if (error) {
        console.error("Error impersonating org:", error);
        throw new Error("Failed to switch organization");
    }

    revalidatePath('/', 'layout');

    const locale = await getLocale();
    const path = locale === 'es' ? '/es/organizacion' : '/en/organization';
    redirect(path);
}

/**
 * Admin: exit impersonation and return to the original organization.
 */
export async function adminExitImpersonation(originalOrgId: string) {
    const { supabase, userId } = await getAdminUserId();

    const { error } = await supabase
        .schema('iam').from('user_preferences')
        .update({ last_organization_id: originalOrgId })
        .eq('user_id', userId);

    if (error) {
        console.error("Error exiting impersonation:", error);
        throw new Error("Failed to restore organization");
    }

    revalidatePath('/', 'layout');

    const locale = await getLocale();
    const path = locale === 'es' ? '/es/admin' : '/en/admin';
    redirect(path);
}

/**
 * Get minimal org list for admin impersonation combobox
 */
export async function getAdminOrgList() {
    const { isAdmin } = await checkUserRoles();
    if (!isAdmin) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
        .schema('iam').from('organizations')
        .select('id, name')
        .order('name');

    if (error) {
        console.error("Error fetching org list:", error);
        return [];
    }

    return data || [];
}

