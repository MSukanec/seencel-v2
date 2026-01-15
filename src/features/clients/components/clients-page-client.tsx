"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Handshake } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";


import { ProjectClientView, ClientFinancialSummary, ClientPaymentView, ClientRole } from "@/features/clients/types";
import { ClientsOverview } from "./clients-overview";
import { ClientsListTable } from "./clients-list-table";
import { ClientCommitmentsTable } from "./client-commitments-table";
import { PaymentsDataTable } from "./payments-data-table";
import { ClientSchedulesTable } from "./client-schedules-table";
import { ClientSettings } from "./client-settings";

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";



interface ClientsPageClientProps {
    projectId: string;
    orgId: string;
    clients: ProjectClientView[];
    financialSummary: ClientFinancialSummary[];
    commitments: any[];
    payments: ClientPaymentView[];
    schedules: any[];
    roles: ClientRole[];
    financialData: any; // Unified data
    defaultTab?: string;
}

export function ClientsPageClient({
    projectId,
    orgId,
    clients,
    financialSummary,
    commitments,
    payments,
    schedules,
    roles,
    financialData,
    defaultTab = "overview"
}: ClientsPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const currentTab = searchParams.get("view") || defaultTab;

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", value);
        router.replace(`${pathname}?${params.toString()}`);
    };

    const tabs = (
        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
            <TabsTrigger value="overview" className={tabTriggerClass}>Visión General</TabsTrigger>
            <TabsTrigger value="list" className={tabTriggerClass}>Lista</TabsTrigger>
            <TabsTrigger value="commitments" className={tabTriggerClass}>Compromisos</TabsTrigger>
            <TabsTrigger value="payments" className={tabTriggerClass}>Pagos</TabsTrigger>
            <TabsTrigger value="schedules" className={tabTriggerClass}>Cronogramas</TabsTrigger>
            <TabsTrigger value="settings" className={tabTriggerClass}>Ajustes</TabsTrigger>
        </TabsList>
    );

    return (
        <Tabs value={currentTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Clientes y Compromisos"
                tabs={tabs}
                icon={<Handshake />}
            >
                <ContentLayout variant="wide">
                    <TabsContent value="overview" className="m-0 h-full focus-visible:outline-none">
                        <ClientsOverview summary={financialSummary} payments={payments} />
                    </TabsContent>
                    <TabsContent value="list" className="m-0 h-full focus-visible:outline-none">
                        <ClientsListTable data={clients} roles={roles} orgId={orgId} projectId={projectId} />
                    </TabsContent>
                    <TabsContent value="commitments" className="m-0 h-full focus-visible:outline-none">
                        <ClientCommitmentsTable
                            data={commitments}
                            clients={clients}
                            projectId={projectId}
                            orgId={orgId}
                            payments={payments}
                            financialData={financialData}
                        />
                    </TabsContent>
                    <TabsContent value="payments" className="m-0 h-full focus-visible:outline-none">
                        <PaymentsDataTable
                            data={payments}
                            clients={clients}
                            financialData={financialData}
                            projectId={projectId}
                            orgId={orgId}
                        />
                    </TabsContent>
                    <TabsContent value="schedules" className="m-0 h-full focus-visible:outline-none">
                        <ClientSchedulesTable data={schedules} />
                    </TabsContent>
                    <TabsContent value="settings" className="m-0 h-full focus-visible:outline-none">
                        <ClientSettings roles={roles} orgId={orgId} />
                    </TabsContent>
                </ContentLayout>
            </PageWrapper >
        </Tabs >
    );
}

