import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { ProjectParticipantsView } from "@/features/projects/views/details/project-participants-view";
import { getProjectById } from "@/features/projects/queries";
import { getClientRoles, getClients } from "@/features/clients/queries";
import { getProjectCollaborators } from "@/features/external-actors/project-access-queries";

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
        title: `Participantes | ${displayName} | Seencel`,
        description: `Participantes del proyecto: ${displayName}`,
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Page Component — Participants Tab
// ============================================================================

interface ProjectParticipantsPageProps {
    params: Promise<{ projectId: string }>;
}

export default async function ProjectParticipantsPage({ params }: ProjectParticipantsPageProps) {
    try {
        const { projectId } = await params;
        const { orgId } = await requireAuthContext();
        if (!orgId) redirect("/");

        const [project, clientRolesResult, clientsResult, collaboratorsResult] = await Promise.all([
            getProjectById(projectId),
            getClientRoles(orgId),
            getClients(projectId),
            getProjectCollaborators(projectId),
        ]);

        if (!project) notFound();

        const clientRoles = clientRolesResult?.data || [];
        const projectClients = clientsResult?.data || [];
        const projectCollaborators = collaboratorsResult?.data || [];

        return (
            <ContentLayout variant="narrow">
                <ProjectParticipantsView
                    projectId={project.id}
                    organizationId={project.organization_id}
                    clientRoles={clientRoles}
                    projectClients={projectClients}
                    projectCollaborators={projectCollaborators}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar participantes"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
