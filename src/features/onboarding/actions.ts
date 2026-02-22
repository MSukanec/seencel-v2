"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { OnboardingChecklist, DEFAULT_ONBOARDING_CHECKLIST } from "./checklist/types";

/**
 * Get onboarding progress for the current user
 * 
 * This function computes the checklist ENTIRELY from real data.
 * No JSON storage needed - we just check if the org has projects/contacts/movements.
 * 
 * The ONLY thing stored is `checklist_dismissed` to remember if user clicked "Skip".
 */
export async function getOnboardingProgress() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { checklist: DEFAULT_ONBOARDING_CHECKLIST, completed: 0, total: 3, isDismissed: false };

    // Get user preferences
    const { data: prefs } = await supabase
        .schema('iam').from('user_preferences')
        .select('last_organization_id, checklist_dismissed')
        .eq('user_id', user.id)
        .single();

    const organizationId = prefs?.last_organization_id;
    const isDismissed = prefs?.checklist_dismissed === true;

    // If user dismissed the checklist, don't show it
    if (isDismissed) {
        return {
            checklist: { create_project: true, create_contact: true, create_movement: true },
            completed: 3,
            total: 3,
            isDismissed: true
        };
    }

    // If no organization, return empty checklist
    if (!organizationId) {
        return { checklist: DEFAULT_ONBOARDING_CHECKLIST, completed: 0, total: 3, isDismissed: false };
    }

    // =========================================================================
    // COMPUTE CHECKLIST FROM REAL DATA
    // =========================================================================
    const [projectsResult, contactsResult, movementsResult] = await Promise.all([
        supabase
            .schema('projects').from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .limit(1),

        supabase
            .schema('contacts').from('contacts')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .limit(1),

        supabase
            .schema('finance').from('movements')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .limit(1),
    ]);

    const checklist: OnboardingChecklist = {
        create_project: (projectsResult.count ?? 0) > 0,
        create_contact: (contactsResult.count ?? 0) > 0,
        create_movement: (movementsResult.count ?? 0) > 0,
    };

    const completed = Object.values(checklist).filter(Boolean).length;

    return {
        checklist,
        completed,
        total: 3,
        isDismissed: false,
    };
}

/**
 * Dismiss/skip the onboarding checklist
 * This just sets a flag - no need to mark fake completions
 */
export async function dismissOnboardingChecklist() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false };

    const { error } = await supabase
        .schema('iam').from('user_preferences')
        .update({ checklist_dismissed: true })
        .eq('user_id', user.id);

    if (error) return { success: false, error: sanitizeError(error) };

    revalidatePath('/organization');
    return { success: true };
}

/**
 * Legacy function - kept for backwards compatibility
 * Now does nothing since checklist is computed from real data
 * @deprecated Use real data verification instead
 */
export async function completeOnboardingStep(stepKey: string) {
    // No-op - checklist is now computed from real data
    // This function kept for backwards compatibility with existing action calls
    return { success: true };
}
