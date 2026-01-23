"use server";

import { createClient } from "@/lib/supabase/server";
import { MaterialPaymentView, OrganizationFinancialData } from "./types";

// ===============================================
// Material Payments Queries
// ===============================================

export async function getMaterialPayments(projectId: string): Promise<MaterialPaymentView[]> {
    const supabase = await createClient();

    // Simple select without joins - joins may fail if table schema is incomplete
    const { data, error } = await supabase
        .from('material_payments')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .order('payment_date', { ascending: false });

    if (error) {
        // If table doesn't exist yet, return empty array gracefully
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn("material_payments table does not exist yet, returning empty array");
            return [];
        }
        console.error("Error fetching material payments:", error);
        // Return empty array instead of crashing
        return [];
    }

    // Transform to match MaterialPaymentView (wallet/currency info will be null until joins are set up)
    return (data || []).map((p: any) => ({
        ...p,
        wallet_name: null, // TODO: Join when relationship is established
        currency_symbol: null,
        currency_code: null,
        purchase_reference: null,
    }));
}

// ===============================================
// Organization Financial Data (shared query)
// ===============================================

export async function getOrganizationFinancialData(organizationId: string): Promise<OrganizationFinancialData> {
    const supabase = await createClient();

    // 1. Get Organization Preferences
    const { data: org } = await supabase
        .from('organizations')
        .select('default_currency_id')
        .eq('id', organizationId)
        .single();

    // 2. Get Currencies via view
    const { data: currenciesData } = await supabase
        .from('organization_currencies_view')
        .select('currency_id, currency_name, currency_code, currency_symbol, is_default, exchange_rate')
        .eq('organization_id', organizationId);

    const currencies = (currenciesData || []).map((c: any) => ({
        id: c.currency_id,
        name: c.currency_name,
        code: c.currency_code,
        symbol: c.currency_symbol,
        is_default: c.is_default || false,
        exchange_rate: c.exchange_rate || 1,
    }));

    // 3. Get Wallets via view
    const { data: walletsData } = await supabase
        .from('organization_wallets_view')
        .select('wallet_id, wallet_name, balance, currency_symbol, currency_code, is_default')
        .eq('organization_id', organizationId);

    const wallets = (walletsData || []).map((w: any) => ({
        id: w.wallet_id,
        wallet_id: w.wallet_id,
        name: w.wallet_name,
        balance: w.balance || 0,
        currency_symbol: w.currency_symbol || '$',
        currency_code: w.currency_code,
        is_default: w.is_default || false,
    }));

    // Find defaults
    const defaultCurrency = currencies.find(c => c.is_default) || currencies[0];
    const defaultWallet = wallets.find(w => w.is_default) || wallets[0];

    return {
        defaultCurrencyId: defaultCurrency?.id || org?.default_currency_id || null,
        defaultWalletId: defaultWallet?.id || null,
        currencies,
        wallets,
    };
}

