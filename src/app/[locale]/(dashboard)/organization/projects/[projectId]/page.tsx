import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Settings, Palette, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { BackButton } from "@/components/shared/back-button";
import { DetailContentTabs } from "@/components/shared/detail-content-tabs";
import { LockedBadge } from "@/components/shared/locked-badge";
import { getProjectById } from "@/features/projects/queries";
import { getProjectTypes, getProjectModalities } from "@/features/projects/actions";
import { getClientRoles, getClients } from "@/features/clients/queries";
import { getProjectCollaborators } from "@/features/external-actors/project-access-queries";
import { ProjectProfileView } from "@/features/projects/views/details/project-profile-view";
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
                    title={truncatedName}
                    parentLabel="Proyectos"
                    backButton={
                        <BackButton fallbackHref="/organization/projects" />
                    }
                >
                    {/* Content Tabs — inside content, not header */}
                    <DetailContentTabs>
                        <TabsList>
                            <TabsTrigger value="general" className="gap-2">
                                <Settings className="h-3.5 w-3.5" />
                                Perfil
                            </TabsTrigger>
                            <TabsTrigger value="participants" className="gap-2">
                                <Users className="h-3.5 w-3.5" />
                                Participantes
                            </TabsTrigger>
                            <LockedBadge>
                                <TabsTrigger value="appearance" className="gap-2">
                                    <Palette className="h-3.5 w-3.5" />
                                    Apariencia
                                </TabsTrigger>
                            </LockedBadge>
                        </TabsList>
                    </DetailContentTabs>

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

