import { Metadata } from "next";
import {
    getGeneralCostCategories,
    getGeneralCosts,
    getGeneralCostConceptStats,
    getGeneralCostPayments,
    getGeneralCostsDashboard,
} from "@/features/general-costs/actions";
import { requireAuthContext } from "@/lib/auth";
import { getOrganizationFinancialData } from "@/features/organization/queries";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreditCard } from "lucide-react";
import { ErrorDisplay } from "@/components/ui/error-display";

import { GeneralCostsDashboardView } from "@/features/general-costs/views/general-costs-dashboard-view";
import { GeneralCostsConceptsView } from "@/features/general-costs/views/general-costs-concepts-view";
import { GeneralCostsPaymentsView } from "@/features/general-costs/views/general-costs-payments-view";
import { GeneralCostsSettingsView } from "@/features/general-costs/views/general-costs-settings-view";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

// Standard TabsContent classes per Rule 4
const tabContentClass = "flex-1 m-0 overflow-hidden data-[state=inactive]:hidden";

export const metadata: Metadata = {
    title: "Gastos Generales | Seencel",
    robots: "noindex, nofollow",
};

export default async function GeneralCostsPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string; q?: string }>;
}) {
    const { orgId: organizationId } = await requireAuthContext();
    const params = await searchParams;
    const activeTab = params.view || "dashboard";
    const initialSearchQuery = params.q || "";

    try {
        const [categories, concepts, conceptStats, payments, dashboardData, financialData] = await Promise.all([
            getGeneralCostCategories(organizationId),
            getGeneralCosts(organizationId),
            getGeneralCostConceptStats(organizationId),
            getGeneralCostPayments(organizationId),
            getGeneralCostsDashboard(organizationId),
            getOrganizationFinancialData(organizationId)
        ]);

        const wallets = financialData.wallets.map(w => ({ id: w.id, wallet_name: w.name }));
        const currencies = financialData.currencies.map(c => ({ id: c.id, name: c.name, code: c.code, symbol: c.symbol }));

        return (
            <Tabs defaultValue={activeTab} syncUrl="view" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Gastos Generales"
                    icon={<CreditCard />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                            <TabsTrigger value="dashboard" className={tabTriggerClass}>
                                Visión General
                            </TabsTrigger>
                            <TabsTrigger value="concepts" className={tabTriggerClass}>
                                Conceptos
                            </TabsTrigger>
                            <TabsTrigger value="payments" className={tabTriggerClass}>
                                Pagos
                            </TabsTrigger>
                            <TabsTrigger value="settings" className={tabTriggerClass}>
                                Ajustes
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <ContentLayout variant="wide">
                        <TabsContent value="dashboard" className={tabContentClass}>
                            <GeneralCostsDashboardView data={dashboardData} payments={payments} />
                        </TabsContent>
                        <TabsContent value="concepts" className={tabContentClass}>
                            <GeneralCostsConceptsView data={concepts} conceptStats={conceptStats} categories={categories} organizationId={organizationId} />
                        </TabsContent>
                        <TabsContent value="payments" className={tabContentClass}>
                            <GeneralCostsPaymentsView
                                data={payments}
                                concepts={concepts}
                                wallets={wallets}
                                currencies={currencies}
                                organizationId={organizationId}
                                initialSearchQuery={initialSearchQuery}
                            />
                        </TabsContent>
                        <TabsContent value="settings" className={tabContentClass}>
                            <GeneralCostsSettingsView />
                        </TabsContent>
                    </ContentLayout>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        console.error("Error loading general costs:", error);
        return (
            <ErrorDisplay
                title="Error al cargar gastos generales"
                message="Ocurrió un error al cargar los datos. Intentá recargar la página."
                retryLabel="Reintentar"
            />
        );
    }
}
