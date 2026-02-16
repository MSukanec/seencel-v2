import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Settings, MapPin, Palette, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { BackButton } from "@/components/shared/back-button";
import { LockedBadge } from "@/components/shared/locked-badge";
import { getProjectById } from "@/features/projects/queries";
import { getProjectTypes, getProjectModalities } from "@/features/projects/actions";
import { getPortalSettings } from "@/features/clients/actions";
import { getClients } from "@/features/clients/queries";
import { getPlans, getCurrentOrganizationPlanId } from "@/actions/plans";
import { ProjectProfileView } from "@/features/projects/views/details/project-profile-view";
import { ProjectLocationView } from "@/features/projects/views/details/project-location-view";
import { ProjectPortalView } from "@/features/projects/views/details/project-portal-view";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
    params
}: {
    params: Promise<{ projectId: string }>
}): Promise<Metadata> {
    const { projectId } = await params;
    const project = await getProjectById(projectId);
    const displayName = project?.name || "Proyecto";

    return {
        title: `${displayName} | Proyectos | Seencel`,
        description: `Detalle del proyecto: ${displayName}`,
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Types
// ============================================================================

interface ProjectDetailPageProps {
    params: Promise<{ projectId: string }>;
    searchParams: Promise<{ view?: string }>;
}

// ============================================================================
// Page Component
// ============================================================================

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailPageProps) {
    try {
        const { projectId } = await params;
        const { view = "general" } = await searchParams;

        const project = await getProjectById(projectId);
        if (!project) notFound();

        // Prefetch type/modality options, portal data and plan features in parallel
        const [projectTypes, projectModalities, portalSettings, clientsResult, plans, currentPlanId] = await Promise.all([
            getProjectTypes(project.organization_id),
            getProjectModalities(project.organization_id),
            getPortalSettings(projectId),
            getClients(projectId),
            getPlans(),
            getCurrentOrganizationPlanId(),
        ]);

        const clients = clientsResult.data || [];
        const currentPlan = currentPlanId ? plans.find(p => p.id === currentPlanId) : null;
        const canCustomize = currentPlan?.features?.custom_project_branding ?? false;

        const displayName = project.name || "Proyecto";
        const truncatedName = displayName.length > 60
            ? displayName.slice(0, 57) + "..."
            : displayName;

        return (
            <Tabs defaultValue={view} className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={truncatedName}
                    backButton={
                        <BackButton fallbackHref="/organization/projects" />
                    }
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="general" className="gap-2">
                                <Settings className="h-4 w-4" />
                                Perfil
                            </TabsTrigger>
                            <TabsTrigger value="location" className="gap-2">
                                <MapPin className="h-4 w-4" />
                                Ubicación
                            </TabsTrigger>
                            <LockedBadge>
                                <TabsTrigger value="portal" className="gap-2">
                                    <Users className="h-4 w-4" />
                                    Portal
                                </TabsTrigger>
                            </LockedBadge>
                            <LockedBadge>
                                <TabsTrigger value="appearance" className="gap-2">
                                    <Palette className="h-4 w-4" />
                                    Apariencia
                                </TabsTrigger>
                            </LockedBadge>
                        </TabsList>
                    }
                >
                    {/* Perfil Tab */}
                    <TabsContent value="general" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ProjectProfileView
                            project={project}
                            projectTypes={projectTypes}
                            projectModalities={projectModalities}
                        />
                    </TabsContent>

                    {/* Ubicación Tab */}
                    <TabsContent value="location" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="full">
                            <ProjectLocationView project={project} />
                        </ContentLayout>
                    </TabsContent>

                    {/* Portal Tab */}
                    <TabsContent value="portal" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ProjectPortalView
                            projectId={projectId}
                            organizationId={project.organization_id}
                            portalSettings={portalSettings}
                            clients={clients}
                            canCustomize={canCustomize}
                        />
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar el proyecto"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
