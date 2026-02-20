import { createClient } from '@/lib/supabase/server';
import { subDays } from 'date-fns';

export async function getDashboardData() {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated." };

    // 1b. Get Public User ID from 'users' table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
            id,
            user_preferences!inner (
                last_organization_id
            )
        `)
        .eq('auth_id', user.id)
        .single();

    if (userError || !userData) {
        console.error("Public user/preferences record not found:", JSON.stringify(userError, null, 2));
        return { error: `Setup Required: No public 'users' record or preferences found for Auth ID ${user.id}.` };
    }

    const publicUserId = userData.id;

    // We already have 'userData.user_preferences'. cast to any to avoid TS strictness if types aren't perfect
    const pref = Array.isArray((userData as any).user_preferences)
        ? (userData as any).user_preferences[0]
        : (userData as any).user_preferences;

    const activeOrgId = pref?.last_organization_id;

    let orgId = activeOrgId;

    // 2. If we have a preference, verify membership. If not, find a default.
    let organization = null;
    let computedRole = 'member'; // Default role if found via normal membership

    if (orgId) {
        const { data: directMember } = await supabase
            .from('organization_members')
            .select(`
                role_id,
                organizations:organizations!organization_members_organization_id_fkey(
                    id, 
                    name, 
                    logo_url,
                    settings,
                    organization_data (
                        description,
                        phone,
                        email,
                        website,
                        tax_id,
                        address,
                        city,
                        state,
                        country,
                        postal_code,
                        lat,
                        lng
                    )
                )
            `)
            .eq('user_id', publicUserId)
            .eq('organization_id', orgId)
            .eq('is_active', true)
            .single();

        if (directMember?.organizations) {
            organization = directMember.organizations;
            computedRole = directMember.role_id;
        } else {
            // FALLBACK: Check if user is the Creator (Legacy Support)
            const { data: ownedOrg } = await supabase
                .from('organizations')
                .select(`
                    id, 
                    name, 
                    logo_url,
                    settings,
                    organization_data (
                        description,
                        phone,
                        email,
                        website,
                        tax_id,
                        address,
                        city,
                        state,
                        country,
                        postal_code,
                        lat,
                        lng
                    )
                `)
                .eq('id', orgId)
                .eq('created_by', publicUserId) // Legacy check
                .eq('is_deleted', false)
                .single();

            if (ownedOrg) {
                organization = ownedOrg;
                computedRole = 'owner'; // Implicit ownership
            }
        }
    }

    // Fallback if no preference or preference invalid/user removed
    if (!organization) {
        // 1. Try generic membership
        const { data: fallbackMember } = await supabase
            .from('organization_members')
            .select(`
                role_id,
                organizations:organizations!organization_members_organization_id_fkey(
                    id, 
                    name, 
                    logo_url,
                    settings,
                    organization_data (
                        description,
                        phone,
                        email,
                        website,
                        tax_id,
                        address,
                        city,
                        state,
                        country,
                        postal_code,
                        lat,
                        lng
                    )
                )
            `)
            .eq('user_id', publicUserId)
            .eq('is_active', true)
            .limit(1)
            .single();

        if (fallbackMember?.organizations) {
            const orgData = Array.isArray(fallbackMember.organizations)
                ? fallbackMember.organizations[0]
                : fallbackMember.organizations;
            organization = orgData;
            computedRole = fallbackMember.role_id;
            orgId = orgData.id;
        } else {
            // 2. Try generic ownership (Legacy Support)
            const { data: firstOwned } = await supabase
                .from('organizations')
                .select(`
                    id, 
                    name, 
                    logo_url,
                    settings,
                    organization_data (
                        description,
                        phone,
                        email,
                        website,
                        tax_id,
                        address,
                        city,
                        state,
                        country,
                        postal_code,
                        lat,
                        lng
                    )
                `)
                .eq('created_by', publicUserId)
                .eq('is_deleted', false)
                .limit(1)
                .single();

            if (firstOwned) {
                organization = firstOwned;
                computedRole = 'owner';
                orgId = firstOwned.id;
            }
        }
    }

    if (!orgId || !organization) {
        return { error: `Setup Required: The user ${publicUserId} is not linked to any organization.` };
    }

    // 3. Parallel Fetching for Dashboard Widgets
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

    const [
        projectsRes,
        statsRes,
        movementsRes,
        activityRes
    ] = await Promise.all([
        // Projects (using view for image_url and metadata)
        supabase.from('projects_view')
            .select('*')
            .eq('organization_id', orgId)
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(10),

        // Stats (Docs & Tasks count)
        supabase.rpc('get_org_dashboard_stats', { org_id: orgId }),

        // Financial Movements (Unified View)
        supabase.from('unified_financial_movements_view')
            .select('*')
            .eq('organization_id', orgId)
            .limit(500),

        // Activity Feed
        supabase.from('organization_activity_logs_view')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(20)
    ]);

    // Manual Counts (Safe fallback)
    const [docsCount, tasksCount, teamCount] = await Promise.all([
        supabase.from('design_documents').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', thirtyDaysAgo),
        supabase.schema('catalog').from('tasks').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', orgId)
    ]);

    return {
        user,
        organization,
        projects: projectsRes.data || [],
        stats: {
            activeProjects: projectsRes.data?.length || 0,
            documentsLast30Days: docsCount.count || 0,
            totalTasks: tasksCount.count || 0,
            teamSize: teamCount.count || 0
        },
        movements: movementsRes.data || [],
        activity: activityRes.data || []
    };
}

// ----------------------------------------------------------------------------
// SETTINGS QUERIES
// ----------------------------------------------------------------------------

export async function getUserOrganizations(authId?: string) {
    const supabase = await createClient();

    // 1. Resolve Auth ID (skip auth.getUser() if provided by caller)
    let resolvedAuthId = authId;
    if (!resolvedAuthId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { organizations: [], activeOrgId: null };
        resolvedAuthId = user.id;
    }

    // 2. Get Public User ID & Preferences (required for all subsequent queries)
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
            id,
            user_preferences (
                last_organization_id
            )
        `)
        .eq('auth_id', resolvedAuthId)
        .single();

    if (userError || !userData) {
        console.error("Error fetching user profile:", userError);
        return { organizations: [], activeOrgId: null };
    }

    const publicUserId = userData.id;
    const pref = Array.isArray((userData as any).user_preferences)
        ? (userData as any).user_preferences[0]
        : (userData as any).user_preferences;

    const activeOrgId = pref?.last_organization_id || null;

    // 3. Fetch organizations, usage stats and members ALL IN PARALLEL
    // (was sequential waterfall: orgs → usage → members)
    const [membershipsResult, usageResult] = await Promise.all([
        // 3a. Organizations
        supabase
            .from('organization_members')
            .select(`
                organizations:organizations!organization_members_organization_id_fkey (
                    id,
                    name,
                    logo_url,
                    owner_id,
                    is_deleted,
                    plan_id
                )
            `)
            .eq('user_id', publicUserId)
            .eq('is_active', true),

        // 3b. Usage Stats (Last Access) — parallel, not waiting for orgs
        supabase
            .from('user_organization_preferences')
            .select('organization_id, updated_at')
            .eq('user_id', publicUserId),
    ]);

    if (membershipsResult.error) {
        console.error("Error fetching organizations FULL:", JSON.stringify(membershipsResult.error, null, 2));
        return { organizations: [], activeOrgId };
    }

    const lastAccessMap = new Map<string, number>();
    usageResult.data?.forEach((p: any) => {
        if (p.organization_id && p.updated_at) {
            lastAccessMap.set(p.organization_id, new Date(p.updated_at).getTime());
        }
    });

    // Extract bare organizations
    const rawOrgs = (membershipsResult.data || [])
        .map((m: any) => m.organizations)
        .filter((org: any) => !!org && org.is_deleted === false);

    const orgIds = rawOrgs.map((o: any) => o.id);

    // Fetch plans from billing schema separately (cross-schema FK can't be embedded)
    const planIds = [...new Set(rawOrgs.map((o: any) => o.plan_id).filter(Boolean))] as string[];
    const planMap = new Map<string, { id: string; name: string; slug: string }>();
    if (planIds.length > 0) {
        const { data: plansData } = await supabase
            .schema('billing').from('plans')
            .select('id, name, slug')
            .in('id', planIds);
        plansData?.forEach((p: any) => planMap.set(p.id, p));
    }

    // 4. Fetch member avatars (only if orgs exist — can't parallelize with step 3 because we need orgIds)
    let orgMembers: any[] = [];
    if (orgIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
            .from('organization_members')
            .select(`
                organization_id,
                user: users (
                    full_name,
                    avatar_url,
                    email
                )
            `)
            .in('organization_id', orgIds)
            .eq('is_active', true);

        if (membersError) {
            console.error("Warning: Failed to fetch organization members details", membersError);
        } else {
            orgMembers = membersData || [];
        }
    }

    // Map and Merge results
    const organizations = rawOrgs.map((org: any) => {
        const theseMembers = orgMembers.filter((m: any) => m.organization_id === org.id);

        return {
            id: org.id,
            name: org.name,
            logo_url: org.logo_url || null,
            owner_id: org.owner_id || null,
            slug: org.name.toLowerCase().replace(/\s+/g, '-'),
            role: 'member',
            updated_at: lastAccessMap.get(org.id) || 0,
            plans: org.plan_id ? (planMap.get(org.plan_id) || null) : null,
            members: theseMembers.map((mem: any) => ({
                name: mem.user?.full_name || mem.user?.email || 'User',
                image: mem.user?.avatar_url || null,
                email: mem.user?.email
            }))
        };
    });

    // Sort: Active Org First -> Then Most Recently Used -> Then Alphabetical
    organizations.sort((a: any, b: any) => {
        if (a.id === activeOrgId) return -1;
        if (b.id === activeOrgId) return 1;

        const accessA = a.updated_at || 0;
        const accessB = b.updated_at || 0;
        if (accessA !== accessB) {
            return accessB - accessA;
        }

        return a.name.localeCompare(b.name);
    });

    return {
        organizations,
        activeOrgId,
        currentUserId: publicUserId,
    };
}

export async function getFinancialMovements() {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated." };

    // 2. Fetcy Org ID (Simplified for now, assuming robust context later)
    const { data: userData } = await supabase
        .from('users')
        .select(`id, user_preferences!inner(last_organization_id)`)
        .eq('auth_id', user.id)
        .single();

    if (!userData) return { error: "User profile not found." };

    const pref = Array.isArray((userData as any).user_preferences)
        ? (userData as any).user_preferences[0]
        : (userData as any).user_preferences;

    const orgId = pref?.last_organization_id;

    if (!orgId) return { error: "No active organization found." };

    const { data, error } = await supabase
        .from('unified_financial_movements_view')
        .select('*')
        .eq('organization_id', orgId)
        .order('payment_date', { ascending: false });

    // Transform has_attachments boolean to array for DataTable compatibility
    const movementsWithAttachments = (data || []).map(m => ({
        ...m,
        attachments: m.has_attachments ? [{ id: 'placeholder' }] : []
    }));

    // Fetch Wallets for mapping - organization_wallets.id is what payments reference
    // Filter by is_active to only show enabled wallets (Standard 10.3)
    const { data: wallets } = await supabase
        .from('organization_wallets_view')
        .select('id, wallet_name')
        .eq('organization_id', orgId)
        .eq('is_active', true);

    // Fetch Projects for mapping (exclude deleted projects)
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('organization_id', orgId)
        .eq('is_deleted', false);

    if (error) {
        console.error("Error fetching financial movements:", error);
        return { error: "Failed to fetch financial data." };
    }

    return {
        movements: movementsWithAttachments,
        wallets: wallets || [],
        projects: projects || []
    };
}

// Unified query for financial contexts (Forms, etc.)
export async function getOrganizationFinancialData(orgId: string) {
    const supabase = await createClient();

    // 1. Fetch Preferences (Defaults)
    const { data: preferences } = await supabase
        .from('organization_preferences')
        // Using 'maybeSingle' to avoid error if no preferences found (just returns null)
        .select('default_currency_id, functional_currency_id, default_wallet_id, currency_decimal_places, use_currency_exchange, insight_config, default_tax_label_id, kpi_compact_format')
        .eq('organization_id', orgId)
        .maybeSingle();

    // 1b. Fetch Organization Settings (is_founder)
    const { data: orgData } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();

    const isFounder = (orgData?.settings as any)?.is_founder === true;

    // 2. Fetch Enabled Currencies (Use View)
    const { data: orgCurrencies } = await supabase
        .from('organization_currencies_view')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('currency_code', { ascending: true });

    // 3. Fetch Enabled Wallets (Use View)
    // Using the view ensures we bypass RLS issues on the raw 'organization_wallets' table if any.
    // The view already contains wallet_name, currency_id, currency_symbol etc.
    const { data: orgWalletsView } = await supabase
        .from('organization_wallets_view')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true);

    // NOTE: Removed separate query to 'wallets' table - the view already provides all needed info

    // Determine effective default ID
    const effectiveDefaultId = preferences?.default_currency_id
        || orgCurrencies?.find((c: any) => c.is_default)?.currency_id;

    // Format Currencies
    const formattedCurrencies = (orgCurrencies || [])
        .map((oc: any) => ({
            id: oc.currency_id, // View uses currency_id
            name: oc.currency_name || oc.currency_code,
            code: oc.currency_code,
            symbol: oc.currency_symbol,
            // Strict check: only true if it matches the effective default
            is_default: oc.currency_id === effectiveDefaultId,
            exchange_rate: Number(oc.exchange_rate) || 1
        }))
        .sort((a, b) => (Number(b.is_default) - Number(a.is_default))); // Default first

    // Format Wallets - using view data directly (no longer fetching from wallets table)
    const formattedWallets = (orgWalletsView || [])
        .map((ow: any) => {
            // The view should contain currency info directly (currency_id, currency_symbol)
            // Resolve currency from the orgCurrencies list if possible
            const walletCurrency = ow.currency_id
                ? formattedCurrencies.find(c => c.id === ow.currency_id)
                : null;

            return {
                id: ow.id, // organization_wallet id (from view)
                wallet_id: ow.wallet_id, // pure wallet definition id (useful for comparisons)
                name: ow.wallet_name || "Unknown Wallet",
                balance: ow.balance || 0,
                // Use resolved currency info, fallback to view data or defaults
                currency_symbol: walletCurrency?.symbol || ow.currency_symbol || "$",
                currency_code: walletCurrency?.code || ow.currency_code,
                // Check if it's default either by flag or by preference match
                is_default: Boolean(ow.is_default || (preferences?.default_wallet_id === ow.wallet_id))
            };
        })
        .sort((a, b) => (Number(b.is_default) - Number(a.is_default))); // Default first

    return {
        defaultCurrencyId: preferences?.default_currency_id || formattedCurrencies[0]?.id, // Fallback to first if no default set
        defaultWalletId: formattedWallets.find(w => w.is_default)?.id || formattedWallets[0]?.id, // Return organization_wallet.id
        defaultTaxLabel: preferences?.default_tax_label_id || 'IVA', // Default to IVA
        currencies: formattedCurrencies,
        wallets: formattedWallets,
        preferences: preferences ? {
            ...preferences,
        } : null,
        isFounder
    };
}

// Keeping this for backward compatibility if needed, but it should likely be deprecated
export async function getOrganizationWallets(orgId: string) {
    const data = await getOrganizationFinancialData(orgId);
    return data.wallets;
}

/**
 * Get count of organizations created in last N days
 * Used for community card stats (+ offset for marketing)
 */
export async function getRecentOrganizationsCount(days: number = 30): Promise<number> {
    const supabase = await createClient();

    const sinceDate = subDays(new Date(), days).toISOString();

    const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false)
        .gte('created_at', sinceDate);

    if (error) {
        console.error("Error fetching recent orgs count:", error);
        return 0;
    }

    return count || 0;
}

