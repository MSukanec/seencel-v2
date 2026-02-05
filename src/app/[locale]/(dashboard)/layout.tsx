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
    const { activeOrgId } = await getUserOrganizations();

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
                </LayoutSwitcher>
            </FeatureFlagsProvider>
        </>
    );
}

