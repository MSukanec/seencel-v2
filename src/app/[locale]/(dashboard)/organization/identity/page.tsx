import { getDashboardData } from "@/features/organization/queries";
import { OrganizationDetailsForm } from "@/features/organization/components/forms/organization-details-form";
import { OrganizationLocationManager } from "@/features/organization/components/location-manager";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationTabsWrapper } from "@/features/organization/components/organization-tabs-wrapper";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { BrandDigitalExperience } from "@/features/organization/components/brand/brand-digital-experience";
import { BrandPdfTemplates } from "@/features/organization/components/brand/brand-pdf-templates";
import { Building } from "lucide-react";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

export default async function OrganizationDetailsPage() {
    const data = await getDashboardData();
    const organization = data.organization;

    if (!organization) {
        return <div className="p-8">Organization not found.</div>;
    }

    return (
        <OrganizationTabsWrapper defaultValue="general">
            <PageWrapper
                type="page"
                title="Identidad Corporativa"
                icon={<Building />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="general" className={tabTriggerClass}>
                            Información
                        </TabsTrigger>
                        <TabsTrigger value="location" className={tabTriggerClass}>
                            Ubicación
                        </TabsTrigger>
                        <TabsTrigger value="digital" className={tabTriggerClass}>
                            Experiencia Digital
                        </TabsTrigger>
                        <TabsTrigger value="pdf" className={tabTriggerClass}>
                            Documentos PDF
                        </TabsTrigger>
                    </TabsList>
                }
            >
                {/* Tab: Información - narrow layout for form */}
                <TabsContent value="general" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="narrow">
                        <OrganizationDetailsForm organization={organization} />
                    </ContentLayout>
                </TabsContent>

                {/* Tab: Ubicación - full layout for map */}
                <TabsContent value="location" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="full">
                        <OrganizationLocationManager organization={organization} />
                    </ContentLayout>
                </TabsContent>

                {/* Tab: Experiencia Digital - full layout for canvas */}
                <TabsContent value="digital" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="full">
                        <BrandDigitalExperience />
                    </ContentLayout>
                </TabsContent>

                {/* Tab: Documentos PDF - full layout for editor */}
                <TabsContent value="pdf" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="full">
                        <BrandPdfTemplates />
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </OrganizationTabsWrapper>
    );
}
