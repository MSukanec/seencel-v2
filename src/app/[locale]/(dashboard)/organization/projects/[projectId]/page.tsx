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
import { getClientRoles, getClients } from "@/features/clients/queries";
import { getProjectCollaborators } from "@/features/external-actors/project-access-queries";
import { ProjectProfileView } from "@/features/projects/views/details/project-profile-view";
import { ProjectLocationView } from "@/features/projects/views/details/project-location-view";
import { ProjectParticipantsView } from "@/features/projects/views/details/project-participants-view";

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

        const [projectTypes, projectModalities, clientRolesResult, clientsResult, collaboratorsResult] = await Promise.all([
            getProjectTypes(project.organization_id),
            getProjectModalities(project.organization_id),
            getClientRoles(project.organization_id),
            getClients(projectId),
            getProjectCollaborators(projectId),
        ]);

        const clientRoles = clientRolesResult?.data || [];
        const projectClients = clientsResult?.data || [];
        const projectCollaborators = collaboratorsResult?.data || [];

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
                            <TabsTrigger value="participants" className="gap-2">
                                <Users className="h-4 w-4" />
                                Participantes
                            </TabsTrigger>
                            <TabsTrigger value="location" className="gap-2">
                                <MapPin className="h-4 w-4" />
                                Ubicación
                            </TabsTrigger>
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

                    {/* Participantes Tab */}
                    <TabsContent value="participants" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ProjectParticipantsView
                            projectId={project.id}
                            organizationId={project.organization_id}
                            clientRoles={clientRoles}
                            projectClients={projectClients}
                            projectCollaborators={projectCollaborators}
                        />
                    </TabsContent>

                    {/* Ubicación Tab */}
                    <TabsContent value="location" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="full">
                            <ProjectLocationView project={project} />
                        </ContentLayout>
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
