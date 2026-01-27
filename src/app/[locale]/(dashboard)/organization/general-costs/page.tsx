import { GeneralCostsClient } from "@/features/finance/components/general-costs-client";
import {
    getGeneralCostCategories,
    getGeneralCosts,
    getGeneralCostPayments,
    getGeneralCostsDashboard,
    getActiveOrganizationId
} from "@/actions/general-costs";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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

    const supabase = await createClient();

    const [categories, concepts, payments, dashboardData, walletsRes, currenciesRes] = await Promise.all([
        getGeneralCostCategories(organizationId),
        getGeneralCosts(organizationId),
        getGeneralCostPayments(organizationId),
        getGeneralCostsDashboard(organizationId),
        supabase.from('organization_wallets_view').select('id, wallet_name').eq('organization_id', organizationId),
        supabase.from('currencies').select('id, code, symbol').eq('is_active', true)
    ]);

    const wallets = walletsRes.data || [];
    const currencies = currenciesRes.data || [];

    return (
        <Tabs defaultValue="dashboard" className="h-full flex flex-col">
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
                    <GeneralCostsClient
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

