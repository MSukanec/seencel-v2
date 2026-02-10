import { GeneralCostsPageClient } from "@/features/general-costs/views/general-costs-page";
import {
    getGeneralCostCategories,
    getGeneralCosts,
    getGeneralCostPayments,
    getGeneralCostsDashboard,
    getActiveOrganizationId
} from "@/features/general-costs/actions";
import { getOrganizationFinancialData } from "@/features/organization/queries";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard } from "lucide-react";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

export default async function GeneralCostsPage() {
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground">No active organization found.</p>
            </div>
        );
    }

    const [categories, concepts, payments, dashboardData, financialData] = await Promise.all([
        getGeneralCostCategories(organizationId),
        getGeneralCosts(organizationId),
        getGeneralCostPayments(organizationId),
        getGeneralCostsDashboard(organizationId),
        getOrganizationFinancialData(organizationId)
    ]);

    const wallets = financialData.wallets.map(w => ({ id: w.id, wallet_name: w.name }));
    const currencies = financialData.currencies.map(c => ({ id: c.id, name: c.name, code: c.code, symbol: c.symbol }));

    return (
        <Tabs defaultValue="dashboard" syncUrl="view" className="h-full flex flex-col">
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
                    <GeneralCostsPageClient
                        organizationId={organizationId}
                        categories={categories}
                        concepts={concepts}
                        payments={payments}
                        dashboardData={dashboardData}
                        wallets={wallets}
                        currencies={currencies}
                    />
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}

