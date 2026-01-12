"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { ProjectSelector } from "@/components/layout/project-selector";

import { ProjectClientView, ClientFinancialSummary, ClientPaymentView, ClientRole } from "@/features/clients/types";
import { ClientsOverview } from "./clients-overview";
import { ClientsListTable } from "./clients-list-table";
import { ClientCommitmentsTable } from "./client-commitments-table";
import { ClientPaymentsTable } from "./client-payments-table";
import { ClientSchedulesTable } from "./client-schedules-table";
import { ClientSettings } from "./client-settings";

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface Project {
    id: string;
    name: string;
    color?: string | null;
    image_url?: string | null;
}

interface ClientsPageClientProps {
    projectId: string;
    orgId: string;
    projects: Project[];
    clients: ProjectClientView[];
    financialSummary: ClientFinancialSummary[];
    commitments: any[];
    payments: ClientPaymentView[];
    schedules: any[];
    roles: ClientRole[];
    defaultTab?: string;
}

export function ClientsPageClient({
    projectId,
    orgId,
    projects,
    clients,
    financialSummary,
    commitments,
    payments,
    schedules,
    roles,
    defaultTab = "overview"
}: ClientsPageClientProps) {
    return (
        <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Clientes"
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="overview" className={tabTriggerClass}>Visión General</TabsTrigger>
                        <TabsTrigger value="list" className={tabTriggerClass}>Lista</TabsTrigger>
                        <TabsTrigger value="commitments" className={tabTriggerClass}>Compromisos</TabsTrigger>
                        <TabsTrigger value="payments" className={tabTriggerClass}>Pagos</TabsTrigger>
                        <TabsTrigger value="schedules" className={tabTriggerClass}>Cronogramas</TabsTrigger>
                        <TabsTrigger value="settings" className={tabTriggerClass}>Ajustes</TabsTrigger>
                    </TabsList>
                }
                actions={
                    <ProjectSelector
                        projects={projects}
                        currentProjectId={projectId}
                        basePath="/project/[projectId]/clients"
                    />
                }
            >
                <ContentLayout variant="wide">
                    <TabsContent value="overview" className="m-0 h-full focus-visible:outline-none">
                        <ClientsOverview summary={financialSummary} payments={payments} />
                    </TabsContent>
                    <TabsContent value="list" className="m-0 h-full focus-visible:outline-none">
                        <ClientsListTable data={clients} roles={roles} orgId={orgId} projectId={projectId} />
                    </TabsContent>
                    <TabsContent value="commitments" className="m-0 h-full focus-visible:outline-none">
                        <ClientCommitmentsTable data={commitments} clients={clients} projectId={projectId} orgId={orgId} />
                    </TabsContent>
                    <TabsContent value="payments" className="m-0 h-full focus-visible:outline-none">
                        <ClientPaymentsTable data={payments} />
                    </TabsContent>
                    <TabsContent value="schedules" className="m-0 h-full focus-visible:outline-none">
                        <ClientSchedulesTable data={schedules} />
                    </TabsContent>
                    <TabsContent value="settings" className="m-0 h-full focus-visible:outline-none">
                        <ClientSettings roles={roles} orgId={orgId} />
                    </TabsContent>
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}

