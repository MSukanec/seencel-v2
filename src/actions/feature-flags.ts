"use server";

import { createClient } from "@/lib/supabase/server";

export interface FlagCategory {
    id: string;
    name: string;
    parent_id: string | null;
    position: number;
}

export interface FeatureFlag {
    id: string;
    key: string;
    value: boolean;
    description: string | null;
    category: string | null; // Deprecated
    category_id: string | null;
    flag_type: 'system' | 'feature';
    parent_id?: string | null;
    position?: number;
    status: 'active' | 'maintenance' | 'hidden' | 'founders' | 'coming_soon';
}

/**
 * Get all flag categories
 */
export async function getFlagCategories(): Promise<FlagCategory[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("feature_flag_categories")
        .select("*")
        .order("position", { ascending: true });

    if (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
    return data || [];
}

/**
 * Get all feature flags or filter by category
 */
export async function getFeatureFlags(category?: string): Promise<FeatureFlag[]> {
    const supabase = await createClient();

    let query = supabase
        .from("feature_flags")
        .select("*") // Select all to get new columns
        .order("position", { ascending: true })
        .order("key", { ascending: true });

    if (category) {
        query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching feature flags:", error);
        return [];
    }

    return (data || []).map((f: any) => ({
        ...f,
        // Fallback for status if not migrated yet or null
        status: f.status || (f.value ? 'active' : 'hidden'),
        flag_type: f.flag_type || 'feature'
    }));
}

/**
 * Get a specific feature flag by key
 * Returns value (boolean)
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
 * Update feature flag status directly
 * Updates both status and value(boolean)
 */
export async function updateFeatureFlagStatus(key: string, status: 'active' | 'maintenance' | 'hidden' | 'founders' | 'coming_soon') {
    const supabase = await createClient();

    // Auto-update 'value' boolean based on status
    // active -> true
    // maintenance -> false (blocked for general users)
    // hidden -> false (blocked)
    const value = status === 'active';

    const { error } = await supabase
        .from("feature_flags")
        .update({ status, value })
        .eq("key", key);

    if (error) return { error: error.message };
    return { success: true };
}

/**
 * Toggle a feature flag (Legacy wrapper)
 * Cycles Active <-> Hidden
 */
export async function toggleFeatureFlag(key: string) {
    // Deprecated usage mapping:
    // If we toggle, we assume simple On/Off behavior (Active <-> Hidden)
    const current = await getFeatureFlag(key);
    const newStatus = current ? 'hidden' : 'active';
    return updateFeatureFlagStatus(key, newStatus);
}

export async function upsertFeatureFlag(data: Partial<FeatureFlag>) {
    const supabase = await createClient();

    // Sync value
    const status = data.status || 'active';
    const value = status === 'active';

    // If we have an ID, update
    if (data.id) {
        const { error } = await supabase
            .from("feature_flags")
            .update({
                key: data.key,
                value: value,
                status: status,
                description: data.description,
                category: data.category,
                parent_id: data.parent_id,
                position: data.position
            })
            .eq("id", data.id);

        if (error) return { error: error.message };
    } else {
        // Insert
        const { error } = await supabase
            .from("feature_flags")
            .insert({
                key: data.key,
                value: value,
                status: status,
                description: data.description,
                category: data.category,
                parent_id: data.parent_id,
                position: data.position
            });

        if (error) return { error: error.message };
    }

    return { success: true };
}

export async function deleteFeatureFlag(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("feature_flags").delete().eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
}

/**
 * Get purchase enablement flags for plans (returns status, not boolean)
 */
export async function getPlanPurchaseFlags(): Promise<{
    pro: 'active' | 'maintenance' | 'hidden' | 'founders' | 'coming_soon';
    teams: 'active' | 'maintenance' | 'hidden' | 'founders' | 'coming_soon';
}> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("feature_flags")
        .select("key, status, value")
        .in("key", ["pro_purchases_enabled", "teams_purchases_enabled"]);

    if (error || !data) {
        console.error("Error fetching plan purchase flags:", error);
        return { pro: 'active', teams: 'active' }; // Default to active if error
    }

    const proFlag = data.find(f => f.key === "pro_purchases_enabled");
    const teamsFlag = data.find(f => f.key === "teams_purchases_enabled");

    return {
        pro: (proFlag?.status as 'active' | 'maintenance' | 'hidden' | 'founders' | 'coming_soon') || 'active',
        teams: (teamsFlag?.status as 'active' | 'maintenance' | 'hidden' | 'founders' | 'coming_soon') || 'active'
    };
}
