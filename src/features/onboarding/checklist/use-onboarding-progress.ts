"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { OnboardingChecklist, DEFAULT_ONBOARDING_CHECKLIST, ONBOARDING_STEPS } from "./types";

interface OnboardingProgressData {
    checklist: OnboardingChecklist;
    completed: number;
    total: number;
    isLoading: boolean;
    isAllCompleted: boolean;
    isDismissed: boolean;
    refetch: () => void;
}

/**
 * Hook to get onboarding progress
 * 
 * The checklist is COMPUTED from real data, not from a stored JSON.
 */
export function useOnboardingProgress(): OnboardingProgressData {
    const [checklist, setChecklist] = useState<OnboardingChecklist>(DEFAULT_ONBOARDING_CHECKLIST);
    const [isLoading, setIsLoading] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    const fetchProgress = async () => {
        try {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                setIsLoading(false);
                return;
            }

            // =========================================================================
            // STEP 1: Get PUBLIC user ID and organization
            // IMPORTANT: organization_members uses the PUBLIC user ID from 'users' table,
            // NOT the auth.uid() from Supabase Auth
            // =========================================================================
            const { data: userData, error: userError } = await supabase
                .schema('iam').from('users')
                .select('id')
                .eq('auth_id', authUser.id)
                .maybeSingle();

            if (userError) {
                console.error("[Onboarding] Error fetching user:", userError);
                setIsLoading(false);
                return;
            }

            if (!userData) {
                console.log("[Onboarding] No user record found for auth_id:", authUser.id);
                setIsLoading(false);
                return;
            }

            const publicUserId = userData.id;

            // Cross-schema: user_preferences está en iam
            const { data: prefData } = await supabase
                .schema('iam').from('user_preferences')
                .select('last_organization_id, home_checklist')
                .eq('user_id', publicUserId)
                .maybeSingle();

            let organizationId = prefData?.last_organization_id || null;

            // Check if dismissed from the JSON (backwards compatible)
            const storedChecklist = prefData?.home_checklist as OnboardingChecklist | null;
            const allStoredTrue = storedChecklist &&
                storedChecklist.create_project === true &&
                storedChecklist.create_contact === true &&
                storedChecklist.create_movement === true;

            if (allStoredTrue) {
                setIsDismissed(true);
                setChecklist({ create_project: true, create_contact: true, create_movement: true });
                setIsLoading(false);
                return;
            }

            // =========================================================================
            // STEP 2: If no organization from preferences, get it from membership
            // =========================================================================
            if (!organizationId) {
                const { data: membership } = await supabase
                    .schema('iam').from('organization_members')
                    .select('organization_id')
                    .eq('user_id', publicUserId) // Use PUBLIC user ID here
                    .limit(1)
                    .maybeSingle();

                organizationId = membership?.organization_id || null;
            }

            if (!organizationId) {
                console.log("[Onboarding] No organization ID found for user:", publicUserId);
                setChecklist(DEFAULT_ONBOARDING_CHECKLIST);
                setIsLoading(false);
                return;
            }

            // =========================================================================
            // STEP 3: COMPUTE FROM REAL DATA
            // =========================================================================
            const [projectsResult, contactsResult, movementsResult] = await Promise.all([
                supabase
                    .schema('projects').from('projects')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', organizationId),

                supabase
                    .schema('projects').from('contacts')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', organizationId),

                supabase
                    .schema('finance').from('movements')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', organizationId),
            ]);

            const hasProjects = (projectsResult.count ?? 0) > 0;
            const hasContacts = (contactsResult.count ?? 0) > 0;
            const hasMovements = (movementsResult.count ?? 0) > 0;

            console.log(`[Onboarding] Org: ${organizationId} | Projects: ${hasProjects} | Contacts: ${hasContacts} | Movements: ${hasMovements}`);

            const realChecklist: OnboardingChecklist = {
                create_project: hasProjects,
                create_contact: hasContacts,
                create_movement: hasMovements,
            };

            setChecklist(realChecklist);
        } catch (error) {
            console.error("[Onboarding] Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProgress();
    }, []);

    const completed = Object.values(checklist).filter(Boolean).length;
    const total = ONBOARDING_STEPS.length;

    return {
        checklist,
        completed,
        total,
        isLoading,
        isAllCompleted: completed === total,
        isDismissed,
        refetch: fetchProgress,
    };
}
