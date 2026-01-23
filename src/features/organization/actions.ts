'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { OrganizationPreferences, OrganizationCurrency } from "@/types/organization";

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

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/organization/settings');
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

