import { getDashboardData } from "@/features/organization/queries";
import { HeaderPortal } from "@/components/layout/header-portal";
import { OrganizationDetailsForm } from "@/components/organization/organization-details-form";
import { OrganizationLocationManager } from "@/components/organization/location-manager";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationTabsWrapper } from "@/components/organization/organization-tabs-wrapper";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";

export default async function OrganizationDetailsPage() {
    const data = await getDashboardData();
    const organization = data.organization;

    if (!organization) {
        return <div className="p-8">Organization not found.</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <HeaderTitleUpdater title={
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    Organización <span className="text-muted-foreground/40">/</span> <span className="text-foreground font-medium">Información</span>
                </span>
            } />
            <OrganizationTabsWrapper defaultValue="general">

                <HeaderPortal>
                    {/* Tabs portalled up to Global Header */}
                    <TabsList className="h-full bg-transparent p-0 gap-6 flex items-end">
                        <TabsTrigger
                            value="general"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            Perfil
                        </TabsTrigger>
                        <TabsTrigger
                            value="location"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            Ubicación
                        </TabsTrigger>
                    </TabsList>
                </HeaderPortal>

                {/* Content Areas */}
                <div className="flex-1 bg-muted/5 p-0">
                    <TabsContent value="general" className="m-0 mt-8 max-w-4xl space-y-6 px-8">
                        <OrganizationDetailsForm organization={organization} />
                    </TabsContent>

                    <TabsContent value="location" className="m-0 flex-1 h-full min-h-[600px]">
                        <OrganizationLocationManager organization={organization} />
                    </TabsContent>
                </div>
            </OrganizationTabsWrapper>
        </div>
    );
}
