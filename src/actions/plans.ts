"use server";

import { createClient } from "@/lib/supabase/server";

export interface PlanFeatures {
    can_invite_members: boolean;
    max_active_projects: number;
    max_storage_mb: number;
    max_file_size_mb: number;
    export_pdf_custom: boolean;
    custom_pdf_templates: boolean;
    export_excel: boolean;
    analytics_level: "basic" | "advanced" | "custom";
    api_access: boolean;
    webhooks: boolean;
    support_level: "community" | "priority" | "dedicated";
    custom_project_branding: boolean;
    max_org_boards?: number;
    max_project_boards?: number;
    custom_dashboard?: boolean;
    max_external_advisors?: number;
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
        .schema('billing').from("plans")
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
 * Gets the current user's active organization ID and plan_id.
 * Returns null values if user is not logged in or has no organization.
 */
export async function getCurrentOrganizationInfo(): Promise<{ organizationId: string | null; planId: string | null }> {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { organizationId: null, planId: null };

    // 2. Get User's active organization ID from preferences
    const { data: userData } = await supabase
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!userData) return { organizationId: null, planId: null };

    // Cross-schema: user_preferences esta en iam
    const { data: prefData } = await supabase
        .schema('iam').from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', userData.id)
        .single();

    const orgId = prefData?.last_organization_id;
    if (!orgId) return { organizationId: null, planId: null };

    // 3. Get the organization's plan_id
    const { data: orgData } = await supabase
        .schema('iam').from('organizations')
        .select('plan_id')
        .eq('id', orgId)
        .single();

    return {
        organizationId: orgId,
        planId: orgData?.plan_id || null
    };
}

/**
 * Gets the current user's active organization plan_id.
 * Returns null if user is not logged in or has no organization.
 */
export async function getCurrentOrganizationPlanId(): Promise<string | null> {
    const { planId } = await getCurrentOrganizationInfo();
    return planId;
}

/**
 * Fetches a single plan by its slug.
 * Used for checkout page to get specific plan details.
 */
export async function getPlanBySlug(slug: string): Promise<Plan | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('billing').from("plans")
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
 * Default features for plans with no explicit feature limits (e.g., Enterprise).
 * All booleans are true, all numeric limits are -1 (unlimited).
 * -1 is already the convention used across the codebase for "no limit".
 */
const UNLIMITED_FEATURES: PlanFeatures = {
    can_invite_members: true,
    max_active_projects: -1,
    max_storage_mb: -1,
    max_file_size_mb: -1,
    export_pdf_custom: true,
    custom_pdf_templates: true,
    export_excel: true,
    analytics_level: "custom",
    api_access: true,
    webhooks: true,
    support_level: "dedicated",
    custom_project_branding: true,
    max_org_boards: -1,
    max_project_boards: -1,
    custom_dashboard: true,
    max_external_advisors: -1,
};

/**
 * Gets the plan features for a specific organization.
 * Used to check feature limits (max_active_projects, max_members, etc.)
 * 
 * If the plan has no features defined (e.g., Enterprise with empty JSON),
 * returns UNLIMITED_FEATURES so nothing is blocked.
 */
export async function getOrganizationPlanFeatures(organizationId: string): Promise<PlanFeatures | null> {
    const supabase = await createClient();

    // First get the plan_id from the organization
    const { data: orgData, error: orgError } = await supabase
        .schema('iam').from("organizations")
        .select("plan_id")
        .eq("id", organizationId)
        .single();

    if (orgError || !orgData?.plan_id) {
        console.error("Error fetching organization plan_id:", orgError);
        return null;
    }

    // Cross-schema: plans está en billing
    const { data, error } = await supabase
        .schema('billing').from("plans")
        .select("features")
        .eq("id", orgData.plan_id)
        .single();

    if (error || !data) {
        console.error("Error fetching organization plan features:", error);
        return null;
    }

    // Extract features directly (no longer nested under plan)
    const rawFeatures = (data as any)?.features;

    // If features is null, undefined, or empty object → plan has no limits (Enterprise)
    if (!rawFeatures || (typeof rawFeatures === 'object' && Object.keys(rawFeatures).length === 0)) {
        return UNLIMITED_FEATURES;
    }

    // features may come as a JSON string (text column) or parsed object (jsonb column)
    if (typeof rawFeatures === 'string') {
        try {
            const parsed = JSON.parse(rawFeatures) as PlanFeatures;
            // If parsed result is empty object, treat as unlimited
            if (Object.keys(parsed).length === 0) {
                return UNLIMITED_FEATURES;
            }
            return parsed;
        } catch {
            console.error("Error parsing plan features JSON:", rawFeatures);
            return null;
        }
    }

    return rawFeatures as PlanFeatures;
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
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!userData) return false;

    // Cross-schema: user_preferences esta en iam
    const { data: prefData2 } = await supabase
        .schema('iam').from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', userData.id)
        .single();

    const orgId = prefData2?.last_organization_id;
    if (!orgId) return false;

    // 3. Get the organization's settings.is_founder
    const { data: orgData } = await supabase
        .schema('iam').from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();

    return (orgData?.settings as any)?.is_founder === true;
}
