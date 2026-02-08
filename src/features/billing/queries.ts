import { createClient } from "@/lib/supabase/server";

export interface BillingProfile {
    id: string;
    user_id: string;
    is_company: boolean;
    full_name: string | null;
    company_name: string | null;
    tax_id: string | null;
    country_id: string | null;
    country?: {
        id: string;
        name: string;
        alpha_2: string;
    } | null;
    address_line1: string | null;
    city: string | null;
    postcode: string | null;
    created_at: string;
    updated_at: string;
}

export async function getBillingProfile(): Promise<{ profile: BillingProfile | null }> {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { profile: null };

    // Get public user ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!userData) return { profile: null };

    // Get billing profile with country relation
    const { data: profile, error } = await supabase
        .from('billing_profiles')
        .select(`
            *,
            country:country_id (
                id,
                name,
                alpha_2
            )
        `)
        .eq('user_id', userData.id)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching billing profile:", error);
    }

    return { profile: profile as BillingProfile | null };
}

export async function getCurrencies() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('code', { ascending: true });

    if (error) {
        console.error("Error fetching currencies:", error);
        return [];
    }

    return data || [];
}

/**
 * Get exchange rate between currencies from exchange_rates table
 * @param from - Source currency code (default: 'USD')
 * @param to - Target currency code (default: 'ARS')
 * @returns The exchange rate, or 1 if not found
 */
export async function getExchangeRate(from = "USD", to = "ARS"): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("exchange_rates")
        .select("rate")
        .eq("from_currency", from)
        .eq("to_currency", to)
        .eq("is_active", true)
        .single();

    if (error) {
        console.error("Error fetching exchange rate:", error);
        return 1; // Default fallback
    }

    return Number(data?.rate) || 1;
}

/**
 * Get current user's country code (alpha_2) for payment method logic
 * @returns Country code like 'AR', 'US', 'UY', or null if not found
 */
export async function getUserCountryCode(): Promise<string | null> {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    // Get user's country from user_data -> countries
    const { data } = await supabase
        .from("users")
        .select(`
            user_data!inner (
                countries:country (
                    alpha_2
                )
            )
        `)
        .eq("auth_id", authUser.id)
        .single();

    // Navigate the nested structure safely
    const userData = data?.user_data;
    const userDataArray = Array.isArray(userData) ? userData : [userData];
    const country = userDataArray?.[0]?.countries;
    const countryObj = Array.isArray(country) ? country[0] : country;

    return countryObj?.alpha_2 || null;
}

// ============================================================
// UPGRADE PRORATION
// ============================================================

export interface UpgradeProrationData {
    ok: boolean;
    error?: string;
    current_plan_id?: string;
    current_plan_slug?: string;
    current_plan_name?: string;
    target_plan_id?: string;
    target_plan_slug?: string;
    target_plan_name?: string;
    target_price?: number;
    subscription_id?: string;
    billing_period?: string;
    expires_at?: string;
    subscription_amount?: number;
    days_remaining?: number;
    period_total_days?: number;
    credit?: number;
    upgrade_price?: number;
}

/**
 * Get proration data for upgrading from current plan to target plan.
 * Calls the get_upgrade_proration RPC function.
 */
export async function getUpgradeProration(
    organizationId: string,
    targetPlanId: string
): Promise<UpgradeProrationData> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_upgrade_proration", {
        p_organization_id: organizationId,
        p_target_plan_id: targetPlanId,
    });

    if (error) {
        console.error("Error fetching upgrade proration:", error);
        return { ok: false, error: "DATABASE_ERROR" };
    }

    return data as UpgradeProrationData;
}
