"use client";

import { useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { Package } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout";

import { MaterialsOverviewView } from "./materials-overview-view";
import { MaterialsOrdersView } from "./materials-orders-view";
import { MaterialsPaymentsView } from "./materials-payments-view";
import { MaterialsSettingsView } from "./materials-settings-view";
import { MaterialsRequirementsView } from "./materials-requirements-view";
import {
    MaterialPaymentView,
    OrganizationFinancialData,
    MaterialPurchase,
    MaterialRequirement,
    PurchaseOrderView,
    MaterialType
} from "../types";

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface MaterialsPageViewProps {
    projectId: string;
    orgId: string;
    defaultTab?: string;
    // Payment data (for payments tab)
    payments: MaterialPaymentView[];
    purchases: MaterialPurchase[];
    financialData: OrganizationFinancialData;
    // Requirements data (for requirements tab)
    requirements: MaterialRequirement[];
    // Orders data (for orders tab)
    orders: PurchaseOrderView[];
    providers: { id: string; name: string }[];
    materialTypes: MaterialType[];
}

export function MaterialsPageView({
    projectId,
    orgId,
    defaultTab = "overview",
    payments,
    purchases,
    financialData,
    requirements,
    orders,
    providers,
    materialTypes
}: MaterialsPageViewProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const currentTab = searchParams.get("view") || defaultTab;
    const [activeTab, setActiveTab] = useState(currentTab);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Update URL without navigation (shallow)
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", value);
        window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    };

    const tabs = (
        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
            <TabsTrigger value="overview" className={tabTriggerClass}>Visión General</TabsTrigger>
            <TabsTrigger value="requirements" className={tabTriggerClass}>Necesidades</TabsTrigger>
            <TabsTrigger value="orders" className={tabTriggerClass}>Órdenes de Compra</TabsTrigger>
            <TabsTrigger value="payments" className={tabTriggerClass}>Pagos</TabsTrigger>
            <TabsTrigger value="settings" className={tabTriggerClass}>Ajustes</TabsTrigger>
        </TabsList>
    );

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Materiales"
                tabs={tabs}
                icon={<Package />}
            >
                <TabsContent value="overview" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none">
                    <MaterialsOverviewView projectId={projectId} orgId={orgId} />
                </TabsContent>
                <TabsContent value="requirements" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none">
                    <MaterialsRequirementsView projectId={projectId} orgId={orgId} requirements={requirements} />
                </TabsContent>
                <TabsContent value="orders" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none">
                    <MaterialsOrdersView
                        projectId={projectId}
                        orgId={orgId}
                        orders={orders}
                        providers={providers}
                        financialData={financialData}
                        requirements={requirements}
                    />
                </TabsContent>
                <TabsContent value="payments" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none">
                    <MaterialsPaymentsView
                        projectId={projectId}
                        orgId={orgId}
                        payments={payments}
                        purchases={purchases}
                        financialData={financialData}
                        materialTypes={materialTypes}
                    />
                </TabsContent>
                <TabsContent value="settings" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none">
                    <MaterialsSettingsView materialTypes={materialTypes} organizationId={orgId} />
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}


