"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { OrganizationSettingsData, OrganizationMemberDetail, OrganizationInvitation, Role, Permission, RolePermission, OrganizationActivityLog, OrganizationSubscription, OrganizationBillingCycle, OrganizationPreferences, OrganizationCurrency, OrganizationWallet, Currency, Wallet } from "@/types/organization";



export async function getOrganizationSettingsData(organizationId: string): Promise<OrganizationSettingsData> {
    const supabase = await createClient();

    // 1. Fetch roles first to know which IDs to filter permissions for (avoiding 1000 row limit)
    const { data: rolesData } = await supabase
        .from('roles')
        .select('*')
        .or(`organization_id.eq.${organizationId},is_system.eq.true`)
        .order('name');

    const roles = (rolesData || []) as Role[];
    const roleIds = roles.map(r => r.id);

    // 2. Fetch the rest of the data in parallel
    const [
        membersRes,
        invitationsRes,
        permissionsRes,
        rolePermissionsRes,
        activityLogsRes,
        subscriptionRes,
        billingCyclesRes,
        preferencesRes,
        orgCurrenciesRes,
        orgWalletsRes, // organization_currencies_view
        allCurrenciesRes, // currencies
        allWalletsRes, // wallets
        organizationRes // Fallback: organization with plan
    ] = await Promise.all([
        supabase
            .from('organization_members_full_view')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('joined_at', { ascending: false }),

        supabase
            .from('organization_invitations')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false }),

        supabase
            .from('permissions')
            .select('*')
            .order('category', { ascending: true })
            .order('description', { ascending: true }),

        // Fix: Filter role_permissions by the relevant role IDs to avoid global limit
        roleIds.length > 0
            ? supabase.from('role_permissions').select('*').in('role_id', roleIds)
            : Promise.resolve({ data: [] }),

        supabase
            .from('organization_activity_logs_view')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(50),

        supabase
            .from('organization_subscriptions')
            .select('*, plan:plans(*)')
            .eq('organization_id', organizationId)
            .eq('status', 'active')
            .maybeSingle(),
        // Historial de suscripciones - usar organization_subscriptions con joins
        supabase
            .from('organization_subscriptions')
            .select('id, created_at, started_at, expires_at, amount, currency, status, billing_period, payer_email, plan:plan_id(name), payment:payment_id(provider)')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(12),

        supabase
            .from('organization_preferences')
            .select('*')
            .eq('organization_id', organizationId)
            .single(),

        supabase
            .from('organization_currencies_view')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('currency_code', { ascending: true }),

        supabase
            .from('organization_wallets_view')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('wallet_name', { ascending: true }),

        supabase.from('currencies').select('*').order('name'),
        supabase.from('wallets').select('*').eq('is_active', true).order('name'),

        // Fallback: Get organization with its plan directly
        supabase
            .from('organizations')
            .select('*, plan:plans(*)')
            .eq('id', organizationId)
            .single()
    ]);

    // Build subscription data - use actual subscription or create virtual one from org.plan
    let subscription = subscriptionRes.data as OrganizationSubscription | null;

    // Logs removed for clean execution

    // FALLBACK: If subscription is null (RLS/Single issue) but we have history, use the latest active one
    if (!subscription && billingCyclesRes.data && billingCyclesRes.data.length > 0) {
        const latestInfo = billingCyclesRes.data[0];
        if (latestInfo.status === 'active') {
            // Cast to any to access newly added fields that might not be in the strict type yet
            const fullInfo = latestInfo as any;
            subscription = {
                ...latestInfo,
                id: latestInfo.id,
                plan_id: latestInfo.plan ? (latestInfo.plan as any).id : '',
                plan: latestInfo.plan as any,
                started_at: fullInfo.started_at || latestInfo.created_at,
                expires_at: fullInfo.expires_at || latestInfo.created_at,
            } as OrganizationSubscription;
            console.log("⚠️ Recovered subscription from history:", subscription.id);
        }
    }

    // If no active subscription but org has a plan, create a virtual subscription for display
    if (!subscription && organizationRes.data?.plan) {
        const org = organizationRes.data;
        subscription = {
            id: 'virtual-' + organizationId,
            status: 'active',
            billing_period: 'one-time', // One-time purchases don't auto-renew
            started_at: org.created_at,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
            amount: org.plan.monthly_amount || 0,
            currency: 'USD',
            plan_id: org.plan.id,
            plan: org.plan
        };
    }

    return {
        members: (membersRes.data || []) as OrganizationMemberDetail[],
        invitations: (invitationsRes.data || []) as OrganizationInvitation[],
        roles: roles,
        permissions: (permissionsRes.data || []) as Permission[],
        rolePermissions: (rolePermissionsRes.data || []) as RolePermission[],
        activityLogs: (activityLogsRes.data || []) as OrganizationActivityLog[],
        subscription: subscription,
        billingCycles: (billingCyclesRes.data || []) as OrganizationBillingCycle[],
        preferences: (preferencesRes.data) as OrganizationPreferences | null,
        contactCurrencies: (orgCurrenciesRes.data || []) as OrganizationCurrency[],
        contactWallets: (orgWalletsRes.data || []) as OrganizationWallet[],
        availableCurrencies: (allCurrenciesRes.data || []) as Currency[],
        availableWallets: (allWalletsRes.data || []) as Wallet[]
    };
}

// ----------------------------------------------------------------------
// MUTATIONS
// ----------------------------------------------------------------------

export async function updateOrganizationPreferences(
    organizationId: string,
    updates: Partial<OrganizationPreferences>
) {
    const supabase = await createClient();

    // Check if preferences exist first
    const { data: existing } = await supabase
        .from('organization_preferences')
        .select('id')
        .eq('organization_id', organizationId)
        .single();

    let error;

    if (!existing) {
        const { error: insertError } = await supabase
            .from('organization_preferences')
            .insert({
                organization_id: organizationId,
                ...updates
            });
        error = insertError;
    } else {
        const { error: updateError } = await supabase
            .from('organization_preferences')
            .update(updates)
            .eq('organization_id', organizationId);
        error = updateError;
    }

    if (error) {
        console.error('Error updating preferences:', error);
        throw new Error('Failed to update preferences');
    }

    // Revalidate all dashboard routes to pick up new preferences (e.g., decimal_places)
    revalidatePath('/', 'layout');

    return { success: true };
}

export async function addOrganizationCurrency(
    organizationId: string,
    currencyId: string,
    isDefault: boolean = false
) {
    const supabase = await createClient();

    // Constraint: Max 1 secondary currency (non-default)
    // REMOVED LIMIT: User requested multiple secondary currencies.
    /*
    if (!isDefault) {
        // Count existing non-default currencies
        const { count, error: countError } = await supabase
            .from('organization_currencies')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('is_default', false)
            .eq('is_active', true);

        if (countError) {
            console.error("Error checking currency limit:", countError);
            throw new Error("Error checking currency limit");
        }

        if (count && count >= 1) {
            throw new Error("Maximum of 1 secondary currency allowed.");
        }
    }
    */

    const { error } = await supabase
        .from('organization_currencies')
        .insert({
            organization_id: organizationId,
            currency_id: currencyId,
            is_default: isDefault,
            is_active: true
        });

    if (error) {
        console.error('Error adding currency:', error);
        throw new Error('Failed to add currency');
    }
}

export async function removeOrganizationCurrency(organizationId: string, currencyId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('organization_currencies')
        .delete()
        .eq('organization_id', organizationId)
        .eq('currency_id', currencyId);

    if (error) {
        console.error('Error removing currency:', error);
        throw new Error('Failed to remove currency');
    }
}

export async function addOrganizationWallet(
    organizationId: string,
    walletId: string,
    isDefault: boolean = false
) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('organization_wallets')
        .insert({
            organization_id: organizationId,
            wallet_id: walletId,
            is_default: isDefault,
            is_active: true
        });

    if (error) {
        console.error('Error adding wallet:', error);
        throw new Error('Failed to add wallet');
    }
}

export async function removeOrganizationWallet(organizationId: string, walletId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('organization_wallets')
        .delete()
        .eq('organization_id', organizationId)
        .eq('wallet_id', walletId);

    if (error) {
        console.error('Error removing wallet:', error);
        throw new Error('Failed to remove wallet');
    }
}


