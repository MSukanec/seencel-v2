"use server";

import { createClient } from "@/lib/supabase/server";

export interface FeatureFlag {
    id: string;
    key: string;
    value: boolean;
    description: string | null;
    category: string | null;
}

/**
 * Get all feature flags or filter by category
 */
export async function getFeatureFlags(category?: string): Promise<FeatureFlag[]> {
    const supabase = await createClient();

    let query = supabase
        .from("feature_flags")
        .select("id, key, value, description, category");

    if (category) {
        query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching feature flags:", error);
        return [];
    }

    return data || [];
}

/**
 * Get a specific feature flag by key
 */
export async function getFeatureFlag(key: string): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("feature_flags")
        .select("value")
        .eq("key", key)
        .single();

    if (error) {
        console.error(`Error fetching feature flag ${key}:`, error);
        return false; // Default to disabled if error
    }

    return data?.value ?? false;
}

/**
 * Get purchase availability for plans
 */
export async function getPlanPurchaseFlags(): Promise<{
    pro: boolean;
    teams: boolean;
}> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("feature_flags")
        .select("key, value")
        .in("key", ["pro_purchases_enabled", "teams_purchases_enabled"]);

    if (error) {
        console.error("Error fetching plan purchase flags:", error);
        return { pro: false, teams: false };
    }

    const flags = data || [];
    const proFlag = flags.find(f => f.key === "pro_purchases_enabled");
    const teamsFlag = flags.find(f => f.key === "teams_purchases_enabled");

    return {
        pro: proFlag?.value ?? false,
        teams: teamsFlag?.value ?? false,
    };
}

/**
 * Set a feature flag value (admin only)
 */
export async function setFeatureFlag(key: string, value: boolean) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("feature_flags")
        .update({ value })
        .eq("key", key);

    if (error) {
        console.error(`Error setting feature flag ${key}:`, error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Toggle a feature flag (admin only)
 */
export async function toggleFeatureFlag(key: string) {
    const supabase = await createClient();

    // Get current value
    const { data: current, error: fetchError } = await supabase
        .from("feature_flags")
        .select("value")
        .eq("key", key)
        .single();

    if (fetchError) {
        console.error(`Error fetching feature flag ${key}:`, fetchError);
        return { success: false, error: fetchError.message };
    }

    const newValue = !current.value;

    const { error } = await supabase
        .from("feature_flags")
        .update({ value: newValue })
        .eq("key", key);

    if (error) {
        console.error(`Error toggling feature flag ${key}:`, error);
        return { success: false, error: error.message };
    }

    return { success: true, value: newValue };
}

