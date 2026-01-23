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
        .eq('is_active', true)
        .order('order', { ascending: true });

    if (error) {
        console.error("Error fetching currencies:", error);
        return [];
    }

    return data || [];
}

