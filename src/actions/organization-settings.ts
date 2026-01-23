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
        allWalletsRes // wallets
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
        roles: roles,
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

/**
 * Toggle a permission for a role (add or remove)
 * Only allows editing non-admin roles (Editor, Lector)
 */
export async function toggleRolePermission(
    organizationId: string,
    roleId: string,
    permissionId: string,
    enabled: boolean
) {
    const supabase = await createClient();

    // Verify role belongs to org and is not Administrador
    const { data: role } = await supabase
        .from('roles')
        .select('id, name, organization_id')
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .single();

    if (!role) {
        throw new Error('Role not found or not in this organization');
    }

    // Block editing Administrador role
    if (role.name === 'Administrador') {
        throw new Error('Cannot modify Administrador permissions');
    }

    if (enabled) {
        // Add permission
        const { error } = await supabase
            .from('role_permissions')
            .insert({
                role_id: roleId,
                permission_id: permissionId,
                organization_id: organizationId
            });

        if (error && !error.message.includes('duplicate')) {
            console.error('Error adding role permission:', error);
            throw new Error('Failed to add permission');
        }
    } else {
        // Remove permission
        const { error } = await supabase
            .from('role_permissions')
            .delete()
            .eq('role_id', roleId)
            .eq('permission_id', permissionId);

        if (error) {
            console.error('Error removing role permission:', error);
            throw new Error('Failed to remove permission');
        }
    }

    return { success: true };
}

