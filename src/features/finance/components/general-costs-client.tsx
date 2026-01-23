"use client";

import { TabsContent } from "@/components/ui/tabs";
import { GeneralCost, GeneralCostCategory, GeneralCostPaymentView, EnhancedDashboardData } from "@/types/general-costs";
import { DashboardTab } from "./dashboard-tab";
import { ConceptsTable } from "./concepts-table";
import { PaymentsTable } from "./payments-table";
import { SettingsTab } from "./settings-tab";

interface GeneralCostsClientProps {
    organizationId: string;
    categories: GeneralCostCategory[];
    concepts: GeneralCost[];
    payments: GeneralCostPaymentView[];
    dashboardData: EnhancedDashboardData;
}

export function GeneralCostsClient({ organizationId, categories, concepts, payments, dashboardData }: GeneralCostsClientProps) {
    return (
        <>
            <TabsContent value="dashboard" className="m-0 h-full focus-visible:outline-none">
                <DashboardTab data={dashboardData} payments={payments} />
            </TabsContent>
            <TabsContent value="concepts" className="m-0 h-full focus-visible:outline-none">
                <ConceptsTable data={concepts} categories={categories} organizationId={organizationId} />
            </TabsContent>
            <TabsContent value="payments" className="m-0 h-full focus-visible:outline-none">
                <PaymentsTable data={payments} concepts={concepts} organizationId={organizationId} />
            </TabsContent>
            <TabsContent value="settings" className="m-0 h-full focus-visible:outline-none">
                <SettingsTab categories={categories} organizationId={organizationId} />
            </TabsContent>
        </>
    );
}

