import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { SettingsClient } from "@/features/organization/components/settings/settings-client";
import { redirect } from "next/navigation";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface PageProps {
    searchParams: Promise<{ tab?: string }>;
}

export default async function OrganizationSettingsPage({ searchParams }: PageProps) {
    const orgId = await getActiveOrganizationId();
    const params = await searchParams;
    const initialTab = params.tab || "members";

    if (!orgId) {
        redirect('/');
    }

    const data = await getOrganizationSettingsData(orgId);

    return (
        <Tabs defaultValue={initialTab} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Configuración"
                icon={<Settings />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="members" className={tabTriggerClass}>
                            Miembros
                        </TabsTrigger>
                        <TabsTrigger value="permissions" className={tabTriggerClass}>
                            Permisos
                        </TabsTrigger>
                        <TabsTrigger value="billing" className={tabTriggerClass}>
                            Facturación
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <ContentLayout variant="wide">
                    <SettingsClient data={data} organizationId={orgId} />
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}
