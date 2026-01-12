import { GeneralCostsClient } from "@/components/general-costs/general-costs-client";
import {
    getGeneralCostCategories,
    getGeneralCosts,
    getGeneralCostPayments,
    getGeneralCostsDashboard,
    getActiveOrganizationId
} from "@/actions/general-costs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

    const [categories, concepts, payments, dashboardData] = await Promise.all([
        getGeneralCostCategories(organizationId),
        getGeneralCosts(organizationId),
        getGeneralCostPayments(organizationId),
        getGeneralCostsDashboard(organizationId)
    ]);

    return (
        <Tabs defaultValue="dashboard" className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Gastos Generales"
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
                    <GeneralCostsClient
                        organizationId={organizationId}
                        categories={categories}
                        concepts={concepts}
                        payments={payments}
                        dashboardData={dashboardData}
                    />
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}
