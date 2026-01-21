import { getUserProfile, checkIsAdmin } from "@/features/profile/queries";
import { getUserOrganizations, getOrganizationFinancialData } from "@/features/organization/queries";
import { LayoutSwitcher } from "@/components/layout";
import { getFeatureFlag } from "@/actions/feature-flags";

import { OrganizationProvider } from "@/context/organization-context";
import { CurrencyProvider } from "@/providers/currency-context";
import { Currency } from "@/types/currency";
import MaintenancePage from "./maintenance/page";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check maintenance mode first
    const isMaintenanceMode = await getFeatureFlag("dashboard_maintenance_mode");

    // If maintenance mode is on, check if user is admin (admins can still access)
    if (isMaintenanceMode) {
        const isAdmin = await checkIsAdmin();

        // Non-admins see maintenance page
        if (!isAdmin) {
            return <MaintenancePage />;
        }
    }

    const { profile } = await getUserProfile();
    const { activeOrgId } = await getUserOrganizations();

    // Fetch currencies for bi-currency context
    let currencies: Currency[] = [];
    let financialData: Awaited<ReturnType<typeof getOrganizationFinancialData>> | null = null;

    if (activeOrgId) {
        try {
            financialData = await getOrganizationFinancialData(activeOrgId);
            currencies = (financialData?.currencies || []).map((c: any) => ({
                id: c.id,
                code: c.code,
                name: c.name,
                symbol: c.symbol,
                is_default: c.is_default,
                exchange_rate: c.exchange_rate,
            }));
        } catch {
            // Fallback: empty currencies (MoneyDisplay will use defaults)
        }
    }

    // Determine default exchange rate (from secondary currency)
    const secondaryCurrency = currencies.find(c => !c.is_default);
    const defaultExchangeRate = secondaryCurrency?.exchange_rate || 1;

    // Get decimal places preference (default to 2)
    const decimalPlaces = financialData?.preferences?.currency_decimal_places ?? 2;

    return (
        <OrganizationProvider
            activeOrgId={activeOrgId || null}
            preferences={activeOrgId && financialData?.preferences ? financialData.preferences as any : null}
        >
            <CurrencyProvider
                currencies={currencies}
                defaultExchangeRate={defaultExchangeRate}
                decimalPlaces={decimalPlaces}
            >
                <LayoutSwitcher user={profile} activeOrgId={activeOrgId || undefined}>
                    {children}
                </LayoutSwitcher>
            </CurrencyProvider>
        </OrganizationProvider>
    );
}
