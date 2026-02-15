import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { ClientPortalConfig } from "@/features/clients/components/portal/client-portal-config";
import { ClientPortalAccess } from "@/features/clients/components/portal/client-portal-access";
import { getPortalSettings } from "@/features/clients/actions";
import { getClients } from "@/features/clients/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { getPlans, getCurrentOrganizationPlanId } from "@/actions/plans";

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface PageProps {
    params: Promise<{
        projectId: string;
    }>;
}

export default async function ClientPortalPage({ params }: PageProps) {
    const { projectId } = await params;

    // Get organization ID
    const { activeOrgId } = await getUserOrganizations();
    if (!activeOrgId) {
        return <div className="p-8">Organization not found.</div>;
    }

    // Fetch data including plan features
    const [portalSettings, clientsResult, plans, currentPlanId] = await Promise.all([
        getPortalSettings(projectId),
        getClients(projectId),
        getPlans(),
        getCurrentOrganizationPlanId()
    ]);

    const clients = clientsResult.data || [];

    // Find current plan and check if custom branding is allowed
    const currentPlan = currentPlanId ? plans.find(p => p.id === currentPlanId) : null;
    const canCustomize = currentPlan?.features?.custom_project_branding ?? false;

    return (
        <Tabs defaultValue="design" syncUrl="view" className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Portal de Clientes"
                icon={<Users />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="design" className={tabTriggerClass}>
                            Diseño
                        </TabsTrigger>
                        <TabsTrigger value="access" className={tabTriggerClass}>
                            Acceso al Portal
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <TabsContent value="design" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="full" className="h-full">
                        <ClientPortalConfig
                            projectId={projectId}
                            organizationId={activeOrgId}
                            initialSettings={portalSettings}
                            canCustomize={canCustomize}
                        />
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="access" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="narrow">
                        <ClientPortalAccess
                            projectId={projectId}
                            clients={clients}
                        />
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
