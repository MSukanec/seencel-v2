"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { OnboardingStepKey, DEFAULT_ONBOARDING_CHECKLIST, OnboardingChecklist } from "./checklist/types";

/**
 * Mark an onboarding step as completed
 */
export async function completeOnboardingStep(stepKey: OnboardingStepKey) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No authenticated user" };

    // Get current user preferences
    const { data: prefs, error: fetchError } = await supabase
        .from('user_preferences')
        .select('home_checklist')
        .eq('user_id', user.id)
        .single();

    if (fetchError) {
        console.error("Error fetching preferences:", fetchError);
        return { success: false, error: fetchError.message };
    }

    // Merge with defaults and update the step
    const currentChecklist = (prefs?.home_checklist || DEFAULT_ONBOARDING_CHECKLIST) as OnboardingChecklist;
    const updatedChecklist: OnboardingChecklist = {
        ...currentChecklist,
        [stepKey]: true,
    };

    // Update preferences
    const { error: updateError } = await supabase
        .from('user_preferences')
        .update({ home_checklist: updatedChecklist })
        .eq('user_id', user.id);

    if (updateError) {
        console.error("Error updating checklist:", updateError);
        return { success: false, error: updateError.message };
    }

    revalidatePath('/organization');
    return { success: true };
}

/**
 * Get onboarding progress for the current user
 */
export async function getOnboardingProgress() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { checklist: DEFAULT_ONBOARDING_CHECKLIST, completed: 0, total: 3 };

    const { data: prefs } = await supabase
        .from('user_preferences')
        .select('home_checklist')
        .eq('user_id', user.id)
        .single();

    const checklist = (prefs?.home_checklist || DEFAULT_ONBOARDING_CHECKLIST) as OnboardingChecklist;
    const completed = Object.values(checklist).filter(Boolean).length;

    return {
        checklist,
        completed,
        total: Object.keys(DEFAULT_ONBOARDING_CHECKLIST).length,
    };
}

/**
 * Dismiss/skip the onboarding checklist
 */
export async function dismissOnboardingChecklist() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false };

    // Mark all steps as completed
    const allCompleted: OnboardingChecklist = {
        create_project: true,
        create_contact: true,
        create_movement: true,
    };

    const { error } = await supabase
        .from('user_preferences')
        .update({ home_checklist: allCompleted })
        .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/organization');
    return { success: true };
}


