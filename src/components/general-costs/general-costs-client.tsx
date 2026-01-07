"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderPortal } from "@/components/layout/header-portal";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";
import { GeneralCost, GeneralCostCategory, GeneralCostMonthlySummary, GeneralCostByCategory, GeneralCostPaymentView, EnhancedDashboardData } from "@/types/general-costs";

// Sub-components (Will be implemented next)
import { DashboardTab } from "./dashboard-tab";
import { ConceptsTable } from "./concepts-table";
import { PaymentsTable } from "./payments-table";
import { SettingsTab } from "./settings-tab";

interface GeneralCostsClientProps {
    categories: GeneralCostCategory[];
    concepts: GeneralCost[];
    payments: GeneralCostPaymentView[];
    dashboardData: EnhancedDashboardData;
}

export function GeneralCostsClient({ categories, concepts, payments, dashboardData }: GeneralCostsClientProps) {
    const [activeTab, setActiveTab] = useState("dashboard");

    return (
        <div className="flex flex-col h-full">
            <HeaderTitleUpdater title={
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    Organización <span className="text-muted-foreground/40">/</span> <span className="text-foreground font-medium">Gastos Generales</span>
                </span>
            } />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                <HeaderPortal>
                    <TabsList className="h-full bg-transparent p-0 gap-6 flex items-end">
                        <TabsTrigger
                            value="dashboard"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            Visión General
                        </TabsTrigger>
                        <TabsTrigger
                            value="concepts"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            Conceptos
                        </TabsTrigger>
                        <TabsTrigger
                            value="payments"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            Pagos
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            Ajustes
                        </TabsTrigger>
                    </TabsList>
                </HeaderPortal>

                <div className="flex-1 bg-muted/5 w-full space-y-6">
                    <TabsContent value="dashboard" className="m-0 h-full">
                        <DashboardTab data={dashboardData} />
                    </TabsContent>
                    <TabsContent value="concepts" className="m-0 h-full">
                        <ConceptsTable data={concepts} categories={categories} />
                    </TabsContent>
                    <TabsContent value="payments" className="m-0 h-full">
                        <PaymentsTable data={payments} />
                    </TabsContent>
                    <TabsContent value="settings" className="m-0 h-full">
                        <SettingsTab categories={categories} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
