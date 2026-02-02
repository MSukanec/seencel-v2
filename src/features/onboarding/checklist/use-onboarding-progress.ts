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
    refetch: () => void;
}

export function useOnboardingProgress(): OnboardingProgressData {
    const [checklist, setChecklist] = useState<OnboardingChecklist>(DEFAULT_ONBOARDING_CHECKLIST);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProgress = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setIsLoading(false);
                return;
            }

            const { data: prefs } = await supabase
                .from('user_preferences')
                .select('home_checklist')
                .eq('user_id', user.id)
                .single();

            if (prefs?.home_checklist) {
                setChecklist(prefs.home_checklist as OnboardingChecklist);
            }
        } catch (error) {
            console.error("Error fetching onboarding progress:", error);
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
        refetch: fetchProgress,
    };
}
