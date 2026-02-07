"use server";

import { createClient } from "@/lib/supabase/server";

export interface PlanFeatures {
    can_invite_members: boolean;
    max_projects: number;
    max_storage_mb: number;
    max_file_size_mb: number;
    export_pdf_custom: boolean;
    custom_pdf_templates: boolean;
    export_excel: boolean;
    analytics_level: "basic" | "advanced" | "custom";
    api_access: boolean;
    webhooks: boolean;
    support_level: "community" | "priority" | "dedicated";
    custom_portal_branding: boolean;
    max_org_boards?: number;
    max_project_boards?: number;
}

export interface Plan {
    id: string;
    name: string;
    slug: string | null;
    monthly_amount: number | null;
    annual_amount: number | null;
    billing_type: string | null;
    features: PlanFeatures | null;
    status: string;
}

/**
 * Fetches all available plans from the database.
 * Only returns plans with status = 'available'.
 */
export async function getPlans(): Promise<Plan[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("plans")
        .select("id, name, slug, monthly_amount, annual_amount, billing_type, features, status")
        .eq("status", "available")
        .order("monthly_amount", { ascending: true });

    if (error) {
        console.error("Error fetching plans:", error);
        return [];
    }

    return data || [];
}

/**
 * Gets the current user's active organization plan_id.
 * Returns null if user is not logged in or has no organization.
 */
export async function getCurrentOrganizationPlanId(): Promise<string | null> {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 2. Get User's active organization ID from preferences
    const { data: userData } = await supabase
        .from('users')
        .select(`
            id,
            user_preferences!inner (
                last_organization_id
            )
        `)
        .eq('auth_id', user.id)
        .single();

    if (!userData || !userData.user_preferences) return null;

    const pref = Array.isArray(userData.user_preferences)
        ? (userData.user_preferences as any)[0]
        : (userData.user_preferences as any);

    const orgId = pref?.last_organization_id;
    if (!orgId) return null;

    // 3. Get the organization's plan_id
    const { data: orgData } = await supabase
        .from('organizations')
        .select('plan_id')
        .eq('id', orgId)
        .single();

    return orgData?.plan_id || null;
}

/**
 * Fetches a single plan by its slug.
 * Used for checkout page to get specific plan details.
 */
export async function getPlanBySlug(slug: string): Promise<Plan | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("plans")
        .select("id, name, slug, monthly_amount, annual_amount, billing_type, features, status")
        .eq("slug", slug)
        .eq("status", "available")
        .single();

    if (error) {
        console.error("Error fetching plan by slug:", error);
        return null;
    }

    return data;
}

/**
 * Gets the plan features for a specific organization.
 * Used to check feature limits (max_projects, max_members, etc.)
 */
export async function getOrganizationPlanFeatures(organizationId: string): Promise<PlanFeatures | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("organizations")
        .select(`
            plan:plans!plan_id (
                features
            )
        `)
        .eq("id", organizationId)
        .single();

    if (error || !data) {
        console.error("Error fetching organization plan features:", error);
        return null;
    }

    // Extract features from the nested plan object
    const planData = data.plan as any;
    return planData?.features || null;
}

/**
 * Checks if the current user's organization is a founder.
 * Returns true if organization has settings.is_founder = true
 */
export async function isOrganizationFounder(): Promise<boolean> {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // 2. Get User's active organization ID from preferences
    const { data: userData } = await supabase
        .from('users')
        .select(`
            id,
            user_preferences!inner (
                last_organization_id
            )
        `)
        .eq('auth_id', user.id)
        .single();

    if (!userData || !userData.user_preferences) return false;

    const pref = Array.isArray(userData.user_preferences)
        ? (userData.user_preferences as any)[0]
        : (userData.user_preferences as any);

    const orgId = pref?.last_organization_id;
    if (!orgId) return false;

    // 3. Get the organization's settings.is_founder
    const { data: orgData } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();

    return (orgData?.settings as any)?.is_founder === true;
}
