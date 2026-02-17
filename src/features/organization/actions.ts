'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { OrganizationPreferences, OrganizationCurrency } from "@/types/organization";
import { sanitizeError } from "@/lib/error-utils";

export async function updateInsightConfig(organizationId: string, newConfig: any) {
    const supabase = await createClient();

    // Fetch current config to merge
    const { data: current, error: fetchError } = await supabase
        .from('organization_preferences')
        .select('insight_config')
        .eq('organization_id', organizationId)
        .single();

    if (fetchError) throw new Error(fetchError.message);

    const settings = current?.insight_config || {};
    const updatedSettings = { ...settings, ...newConfig };

    const { error } = await supabase
        .from('organization_preferences')
        .update({ insight_config: updatedSettings })
        .eq('organization_id', organizationId);

    if (error) throw new Error(sanitizeError(error));

    revalidatePath('/dashboard/organization/team');
    return { success: true };
}

export async function switchOrganization(organizationId: string) {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Not authenticated");
    }

    // 2. Get Public User ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) {
        throw new Error("Public user record not found");
    }

    // 3. Update User Preferences (Global)
    const { error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('user_id', publicUser.id);

    if (error) {
        console.error("Error switching organization:", error);
        throw new Error("Failed to switch organization");
    }

    // 3b. Update Org-Specific Preferences (Last Access Timestamp)
    // We upsert to ensure we touch the updated_at.
    await supabase
        .from('user_organization_preferences')
        .upsert({
            user_id: publicUser.id,
            organization_id: organizationId,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, organization_id'
        });

    // 4. Revalidate to refresh data across the app
    revalidatePath('/', 'layout');

    // 5. Redirect to Localized Dashboard
    const locale = await getLocale();
    // Logic matching the pathnames defined in i18n/routing.ts
    const path = locale === 'es' ? '/es/organizacion' : '/en/organization';

    redirect(path);
}

export async function createOrganization(
    organizationName: string,
    businessMode: 'professional' | 'supplier' = 'professional'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "No autenticado" };
    }

    // 2. Get Public User ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) {
        return { success: false, error: "Usuario no encontrado" };
    }

    // 3. Call handle_new_organization RPC
    // The function creates the org, roles, member, currencies, wallets, preferences
    // and sets it as the active organization in user_preferences
    const { data: newOrgId, error: rpcError } = await supabase.rpc('handle_new_organization', {
        p_user_id: publicUser.id,
        p_organization_name: organizationName.trim(),
        p_business_mode: businessMode,
    });

    if (rpcError) {
        console.error("Error creating organization:", rpcError);
        return { success: false, error: sanitizeError(rpcError) };
    }

    if (!newOrgId) {
        return { success: false, error: "No se pudo crear la organización" };
    }

    // 4. Upsert Org-Specific Preferences (Last Access Timestamp)
    await supabase
        .from('user_organization_preferences')
        .upsert({
            user_id: publicUser.id,
            organization_id: newOrgId,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, organization_id'
        });

    // 5. Revalidate to refresh data across the app
    revalidatePath('/', 'layout');

    // 6. Redirect to the new org's dashboard
    const locale = await getLocale();
    const path = locale === 'es' ? '/es/organizacion' : '/en/organization';

    redirect(path);
}

