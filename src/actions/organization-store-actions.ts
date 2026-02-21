"use server";

import { createClient } from "@/lib/supabase/server";
import { Currency } from "@/types/currency";

/**
 * Fetches all organization data needed by the OrganizationStore.
 * Called lazily from the client after layout mount — does NOT block navigation.
 * 
 * Combines what was previously:
 * - getOrganizationFinancialData() (4 sequential queries → 4 parallel here)
 * - getOrganizationProjects() (1 query, reduced to id+name only)
 * - getClientsByOrganization() (1 query, reduced to id+name only)
 * 
 * Total: 6 queries in parallel (was 8+ sequential in layout)
 */
export async function fetchOrganizationStoreData(orgId: string) {
    const supabase = await createClient();

    // Get current user for access context detection
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    // Resolve internal user ID from auth_id for membership/actor checks
    let internalUserId: string | null = null;
    if (currentUserId) {
        const { data: userData } = await supabase
            .schema('iam').from('users')
            .select('id')
            .eq('auth_id', currentUserId)
            .single();
        internalUserId = userData?.id || null;
    }

    // All queries in parallel — no sequential dependencies
    const [prefsResult, orgResult, currenciesResult, walletsResult, projectsResult, clientsResult, memberResult, externalActorResult] = await Promise.all([
        // 1. Organization preferences
        supabase
            .schema('iam').from('organization_preferences')
            .select('default_currency_id, functional_currency_id, default_wallet_id, currency_decimal_places, use_currency_exchange, insight_config, default_tax_label_id, kpi_compact_format')
            .eq('organization_id', orgId)
            .maybeSingle(),

        // 2. Organization settings (isFounder) + plan slug
        supabase
            .schema('iam').from('organizations')
            .select('settings, plan_id')
            .eq('id', orgId)
            .single(),

        // 3. Enabled currencies
        supabase
            .schema('finance').from('organization_currencies_view')
            .select('*')
            .eq('organization_id', orgId)
            .eq('is_active', true)
            .order('currency_code', { ascending: true }),

        // 4. Enabled wallets
        supabase
            .schema('finance').from('organization_wallets_view')
            .select('*')
            .eq('organization_id', orgId)
            .eq('is_active', true),

        // 5. Projects (only id + name for dropdowns)
        supabase
            .schema('projects').from('projects')
            .select('id, name')
            .eq('organization_id', orgId)
            .eq('is_deleted', false)
            .order('name', { ascending: true }),

        // 6. Clients (only id + name for dropdowns)
        supabase
            .schema('projects').from('project_clients_view')
            .select('id, contact_full_name, contact_company_name, project_id')
            .eq('organization_id', orgId)
            .eq('is_deleted', false)
            .order('contact_full_name', { ascending: true }),

        // 7. Check if user is a member of this organization
        internalUserId
            ? supabase
                .schema('iam').from('organization_members')
                .select('id')
                .eq('organization_id', orgId)
                .eq('user_id', internalUserId)
                .eq('is_active', true)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),

        // 8. Check if user is an external actor of this organization
        internalUserId
            ? supabase
                .schema('iam').from('organization_external_actors')
                .select('id, actor_type')
                .eq('organization_id', orgId)
                .eq('user_id', internalUserId)
                .eq('is_active', true)
                .eq('is_deleted', false)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
    ]);

    const preferences = prefsResult.data;
    const isFounder = (orgResult.data?.settings as any)?.is_founder === true;

    // Cross-schema: plans está en billing — fetch separado
    let planSlug: string | null = null;
    const orgPlanId = (orgResult.data as any)?.plan_id;
    if (orgPlanId) {
        const { data: planData } = await supabase
            .schema('billing').from('plans')
            .select('slug, name')
            .eq('id', orgPlanId)
            .single();
        planSlug = planData?.slug || planData?.name || null;
    }

    // Access context detection
    // Defensive: if we couldn't resolve the user, default to member=true
    // to preserve existing navigation behavior
    const isMember = internalUserId ? !!memberResult.data : true;
    const isExternal = !!externalActorResult.data;
    const externalActorType = (externalActorResult.data as any)?.actor_type || null;

    // Format currencies
    const effectiveDefaultId = preferences?.default_currency_id
        || currenciesResult.data?.find((c: any) => c.is_default)?.currency_id;

    const currencies: Currency[] = (currenciesResult.data || [])
        .map((oc: any) => ({
            id: oc.currency_id,
            name: oc.currency_name || oc.currency_code,
            code: oc.currency_code,
            symbol: oc.currency_symbol,
            is_default: oc.currency_id === effectiveDefaultId,
            exchange_rate: Number(oc.exchange_rate) || 1,
        }))
        .sort((a, b) => (Number(b.is_default) - Number(a.is_default)));

    // Format wallets
    const wallets = (walletsResult.data || [])
        .map((ow: any) => {
            const walletCurrency = ow.currency_id
                ? currencies.find(c => c.id === ow.currency_id)
                : null;
            return {
                id: ow.id,
                wallet_id: ow.wallet_id,
                name: ow.wallet_name || "Unknown Wallet",
                balance: ow.balance || 0,
                currency_symbol: walletCurrency?.symbol || ow.currency_symbol || "$",
                currency_code: walletCurrency?.code || ow.currency_code,
                is_default: Boolean(ow.is_default || (preferences?.default_wallet_id === ow.wallet_id)),
            };
        })
        .sort((a, b) => (Number(b.is_default) - Number(a.is_default)));

    // Format projects (minimal for dropdowns)
    const projects = (projectsResult.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
    }));

    // Format clients (minimal for dropdowns)
    const clients = (clientsResult.data || []).map((c: any) => ({
        id: c.id,
        name: c.contact_full_name || c.contact_company_name || 'Sin nombre',
        project_id: c.project_id,
    }));

    return {
        currencies,
        wallets,
        projects,
        clients,
        preferences: preferences ? { ...preferences } : null,
        isFounder,
        planSlug,
        decimalPlaces: preferences?.currency_decimal_places ?? 2,
        kpiCompactFormat: preferences?.kpi_compact_format ?? false,
        defaultCurrencyId: preferences?.default_currency_id || currencies[0]?.id,
        defaultWalletId: wallets.find(w => w.is_default)?.id || wallets[0]?.id,
        defaultTaxLabel: preferences?.default_tax_label_id || 'IVA',
        // Access context
        accessContext: {
            isMember,
            isExternal,
            externalActorType,
        },
    };
}
