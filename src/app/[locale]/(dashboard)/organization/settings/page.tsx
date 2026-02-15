import type { Metadata } from "next";
import { Settings, MapPin, FileText, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { getDashboardData } from "@/features/organization/queries";
import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { getIndexTypes } from "@/features/advanced/queries";
import { OrganizationDetailsForm } from "@/features/organization/components/forms/organization-details-form";
import { OrganizationLocationManager } from "@/features/organization/components/location-manager";
import { BrandPdfTemplates } from "@/features/organization/components/brand/brand-pdf-templates";
import { AdvancedIndicesView } from "@/features/advanced/views/advanced-indices-view";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Configuración | Seencel",
        description: "Configuración de la organización: identidad, ubicación, documentos y datos económicos",
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Page Component
// ============================================================================

export default async function OrganizationSettingsPage() {
    try {
        const data = await getDashboardData();
        const organization = data.organization;

        if (!organization) {
            return <div className="p-8">Organization not found.</div>;
        }

        const organizationId = await getActiveOrganizationId();
        const indexTypes = organizationId ? await getIndexTypes(organizationId) : [];

        return (
            <Tabs defaultValue="general" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Configuración"
                    icon={<Settings />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="general" className="gap-2">
                                <Settings className="h-4 w-4" />
                                Información
                            </TabsTrigger>
                            <TabsTrigger value="location" className="gap-2">
                                <MapPin className="h-4 w-4" />
                                Ubicación
                            </TabsTrigger>
                            <TabsTrigger value="pdf" className="gap-2">
                                <FileText className="h-4 w-4" />
                                Documentos PDF
                            </TabsTrigger>
                            <TabsTrigger value="indices" className="gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Índices Económicos
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    {/* Tab: Información */}
                    <TabsContent value="general" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="settings">
                            <OrganizationDetailsForm organization={organization} />
                        </ContentLayout>
                    </TabsContent>

                    {/* Tab: Ubicación */}
                    <TabsContent value="location" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="full">
                            <OrganizationLocationManager organization={organization} />
                        </ContentLayout>
                    </TabsContent>

                    {/* Tab: Documentos PDF */}
                    <TabsContent value="pdf" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="full">
                            <BrandPdfTemplates />
                        </ContentLayout>
                    </TabsContent>

                    {/* Tab: Índices Económicos */}
                    {organizationId && (
                        <TabsContent value="indices" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                            <ContentLayout variant="wide">
                                <AdvancedIndicesView
                                    organizationId={organizationId}
                                    indexTypes={indexTypes}
                                />
                            </ContentLayout>
                        </TabsContent>
                    )}
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar configuración"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
