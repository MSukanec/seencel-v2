import { getUserProfile } from "@/features/profile/queries";
import { getUserOrganizations, getOrganizationFinancialData } from "@/features/organization/queries";
import { LayoutSwitcher } from "@/components/layout/layout-switcher";

import { OrganizationProvider } from "@/context/organization-context";
import { CurrencyProvider } from "@/providers/currency-context";
import { Currency } from "@/types/currency";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile } = await getUserProfile();
    const { activeOrgId } = await getUserOrganizations();

    // Fetch currencies for bi-currency context
    let currencies: Currency[] = [];
    if (activeOrgId) {
        try {
            const financialData = await getOrganizationFinancialData(activeOrgId);
            currencies = (financialData.currencies || []).map(c => ({
                id: c.id,
                code: c.code,
                name: c.name,
                symbol: c.symbol,
                is_default: c.is_default,
            }));
        } catch {
            // Fallback: empty currencies (MoneyDisplay will use defaults)
        }
    }

    return (
        <OrganizationProvider activeOrgId={activeOrgId || null}>
            <CurrencyProvider currencies={currencies}>
                <LayoutSwitcher user={profile} activeOrgId={activeOrgId || undefined}>
                    {children}
                </LayoutSwitcher>
            </CurrencyProvider>
        </OrganizationProvider>
    );
}

