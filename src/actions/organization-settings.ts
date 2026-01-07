"use server";

import { createClient } from "@/lib/supabase/server";
import { OrganizationSettingsData, OrganizationMemberDetail, OrganizationInvitation, Role, Permission, RolePermission, OrganizationActivityLog, OrganizationSubscription, OrganizationBillingCycle, OrganizationPreferences, OrganizationCurrency, OrganizationWallet, Currency, Wallet } from "@/types/organization";

export async function seedPermissions(organizationId: string) {
    const supabase = await createClient();

    const defaultPermissions = [
        { key: 'billing.view', description: 'Ver Billing', category: 'Administración' },
        { key: 'billing.manage', description: 'Gestionar Billing', category: 'Administración' },
        { key: 'plans.view', description: 'Ver Plans', category: 'Administración' },
        { key: 'plans.manage', description: 'Gestionar Plans', category: 'Administración' },
        { key: 'admin.access', description: 'Access Administración', category: 'Administración' },
        { key: 'costs.view', description: 'Ver General Costs', category: 'General Costs' },
        { key: 'costs.manage', description: 'Gestionar General Costs', category: 'General Costs' },
        { key: 'org.view', description: 'Ver Organización', category: 'Organización' },
        { key: 'org.manage', description: 'Gestionar Organización', category: 'Organización' },
    ];

    const { error } = await supabase.from('permissions').upsert(defaultPermissions, { onConflict: 'key' });

    if (error) {
        console.error('Error seeding permissions:', error);
        throw new Error('Failed to seed permissions');
    }
}

export async function getOrganizationSettingsData(organizationId: string): Promise<OrganizationSettingsData> {
    const supabase = await createClient();

    const [
        membersRes,
        invitationsRes,
        rolesRes,
        permissionsRes,
        rolePermissionsRes,
        activityLogsRes,
        subscriptionRes,
        billingCyclesRes,
        preferencesRes,
        orgCurrenciesRes,
        orgWalletsRes,
        allCurrenciesRes,
        allWalletsRes
    ] = await Promise.all([
        supabase
            .from('organization_members_full_view')
            .select('*')
            .eq('organization_id', organizationId)
            .order('joined_at', { ascending: false }),

        supabase
            .from('organization_invitations')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false }),

        supabase
            .from('roles')
            .select('*')
            .or(`organization_id.eq.${organizationId},is_system.eq.true`)
            .order('name'),

        supabase
            .from('permissions')
            .select('*')
            .order('category', { ascending: true })
            .order('description', { ascending: true }),

        supabase
            .from('role_permissions')
            .select('*'),

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
            .single(),

        supabase
            .from('organization_billing_cycles')
            .select('*')
            .eq('organization_id', organizationId)
            .order('period_start', { ascending: false })
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
        supabase.from('wallets').select('*').eq('is_active', true).order('name')
    ]);

    return {
        members: (membersRes.data || []) as OrganizationMemberDetail[],
        invitations: (invitationsRes.data || []) as OrganizationInvitation[],
        roles: (rolesRes.data || []) as Role[],
        permissions: (permissionsRes.data || []) as Permission[],
        rolePermissions: (rolePermissionsRes.data || []) as RolePermission[],
        activityLogs: (activityLogsRes.data || []) as OrganizationActivityLog[],
        subscription: (subscriptionRes.data) as OrganizationSubscription | null,
        billingCycles: (billingCyclesRes.data || []) as OrganizationBillingCycle[],
        preferences: (preferencesRes.data) as OrganizationPreferences | null,
        contactCurrencies: (orgCurrenciesRes.data || []) as OrganizationCurrency[],
        contactWallets: (orgWalletsRes.data || []) as OrganizationWallet[],
        availableCurrencies: (allCurrenciesRes.data || []) as Currency[],
        availableWallets: (allWalletsRes.data || []) as Wallet[]
    };
}
