import { getUserProfile, checkUserRoles } from "@/features/users/queries";
import { getUserOrganizations, getOrganizationFinancialData } from "@/features/organization/queries";
import { getOrganizationProjects } from "@/features/projects/queries";
import { getClientsByOrganization } from "@/features/clients/queries";
import { LayoutSwitcher } from "@/components/layout";
import { getFeatureFlags } from "@/actions/feature-flags";
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider";
import { ThemeCustomizationHydrator } from "@/stores/theme-store";

import { OrganizationStoreHydrator } from "@/stores/organization-store";
import { Currency } from "@/types/currency";
import MaintenancePage from "./maintenance/page";
import { MemberRemovedOverlay } from "@/features/organization/components/member-removed-overlay";
import { PendingInvitationOverlay } from "@/features/team/components/pending-invitation-overlay";
import { createClient } from "@/lib/supabase/server";
import { getStorageUrl } from "@/lib/storage-utils";

// Force dynamic to ensure fresh organization data on every request
// This is critical for organization switching to work correctly
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Get all feature flags once
    const flags = await getFeatureFlags();
    const { isAdmin, isBetaTester } = await checkUserRoles();
    const isMaintenanceMode = flags.find(f => f.key === "dashboard_maintenance_mode")?.value ?? false;

    // If maintenance mode is on, check if user is admin or beta tester (they can still access)
    // Regular users see maintenance page
    if (isMaintenanceMode && !isAdmin && !isBetaTester) {
        return <MaintenancePage />;
    }

    const { profile } = await getUserProfile();
    const { organizations, activeOrgId } = await getUserOrganizations();

    // Detect stale membership: user was removed from their active org
    const wasRemoved = activeOrgId && organizations.length > 0 && !organizations.some((o: any) => o.id === activeOrgId);
    const fallbackOrg = wasRemoved ? organizations[0] : null;

    // Check for pending invitations for this user
    let pendingInvitation: { id: string; token: string; organization_name: string; organization_logo: string | null; role_name: string; inviter_name: string | null } | null = null;
    if (profile?.email) {
        const supabase = await createClient();
        const { data: invitations } = await supabase
            .from('organization_invitations')
            .select('id, token, role_id, organization_id, invited_by')
            .eq('email', profile.email.toLowerCase())
            .eq('status', 'pending')
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (invitations && invitations.length > 0) {
            const inv = invitations[0];

            // Fetch organization name & logo (separate query avoids RLS join issues)
            let orgName = 'Organización';
            let logoUrl: string | null = null;
            if (inv.organization_id) {
                const { data: orgData } = await supabase
                    .from('organizations')
                    .select('name, logo_path')
                    .eq('id', inv.organization_id)
                    .single();
                if (orgData) {
                    orgName = orgData.name || orgName;
                    logoUrl = orgData.logo_path
                        ? getStorageUrl(orgData.logo_path, 'public-assets')
                        : null;
                }
            }

            // Fetch role name (separate query - RLS may block via join)
            let roleName = 'Miembro';
            if (inv.role_id) {
                const { data: roleData } = await supabase
                    .from('roles')
                    .select('name')
                    .eq('id', inv.role_id)
                    .single();
                if (roleData?.name) {
                    roleName = roleData.name;
                }
            }

            // Get inviter name (invited_by → organization_members.id → user_id → users.full_name)
            let inviterName: string | null = null;
            if (inv.invited_by) {
                const { data: memberData } = await supabase
                    .from('organization_members')
                    .select('user_id')
                    .eq('id', inv.invited_by)
                    .single();
                if (memberData?.user_id) {
                    const { data: inviterUser } = await supabase
                        .from('users')
                        .select('full_name')
                        .eq('id', memberData.user_id)
                        .single();
                    inviterName = inviterUser?.full_name || null;
                }
            }

            pendingInvitation = {
                id: inv.id,
                token: inv.token,
                organization_name: orgName,
                organization_logo: logoUrl,
                role_name: roleName,
                inviter_name: inviterName,
            };
        }
    }

    // Initialize data arrays
    let currencies: Currency[] = [];
    let financialData: Awaited<ReturnType<typeof getOrganizationFinancialData>> | null = null;
    let wallets: { id: string; name: string; wallet_id?: string; is_default?: boolean; currency_symbol?: string }[] = [];
    let projects: { id: string; name: string }[] = [];
    let clients: { id: string; name: string; project_id?: string }[] = [];

    if (activeOrgId) {
        try {
            // Fetch all organization data in parallel
            const [financialResult, projectsResult, clientsResult] = await Promise.all([
                getOrganizationFinancialData(activeOrgId),
                getOrganizationProjects(activeOrgId),
                getClientsByOrganization(activeOrgId),
            ]);

            financialData = financialResult;

            // Format currencies
            currencies = (financialData?.currencies || []).map((c: any) => ({
                id: c.id,
                code: c.code,
                name: c.name,
                symbol: c.symbol,
                is_default: c.is_default,
                exchange_rate: c.exchange_rate,
            }));

            // Format wallets
            wallets = (financialData?.wallets || []).map((w: any) => ({
                id: w.id,
                wallet_id: w.wallet_id,
                name: w.name,
                is_default: w.is_default,
                currency_symbol: w.currency_symbol,
            }));

            // Format projects
            projects = (projectsResult || []).map((p: any) => ({
                id: p.id,
                name: p.name,
            }));

            // Format clients
            clients = (clientsResult.data || []).map((c: any) => ({
                id: c.id,
                name: c.contact_name || c.company_name || 'Sin nombre',
                project_id: c.project_id,
            }));
        } catch {
            // Fallback: empty data (forms will handle gracefully)
        }
    }

    // Determine default exchange rate (from secondary currency)
    const secondaryCurrency = currencies.find(c => !c.is_default);
    const defaultExchangeRate = secondaryCurrency?.exchange_rate || 1;

    // Get decimal places preference (default to 2)
    const decimalPlaces = financialData?.preferences?.currency_decimal_places ?? 2;

    // Get KPI compact format preference (default to false = full numbers)
    const kpiCompactFormat = financialData?.preferences?.kpi_compact_format ?? false;

    return (
        <>
            {/* Zustand Store Hydrators */}
            <OrganizationStoreHydrator
                activeOrgId={activeOrgId || null}
                preferences={activeOrgId && financialData?.preferences ? financialData.preferences as any : null}
                isFounder={activeOrgId ? financialData?.isFounder ?? false : false}
                wallets={wallets}
                projects={projects}
                clients={clients}
                currencies={currencies}
                decimalPlaces={decimalPlaces}
                kpiCompactFormat={kpiCompactFormat}
            />
            <ThemeCustomizationHydrator />
            <FeatureFlagsProvider flags={flags} isAdmin={isAdmin} isBetaTester={isBetaTester}>
                <LayoutSwitcher user={profile} activeOrgId={activeOrgId || undefined}>
                    {children}
                    {wasRemoved && fallbackOrg && (
                        <MemberRemovedOverlay
                            fallbackOrgId={fallbackOrg.id}
                            fallbackOrgName={fallbackOrg.name}
                        />
                    )}
                    {!wasRemoved && pendingInvitation && (
                        <PendingInvitationOverlay
                            invitation={pendingInvitation}
                        />
                    )}
                </LayoutSwitcher>
            </FeatureFlagsProvider>
        </>
    );
}

