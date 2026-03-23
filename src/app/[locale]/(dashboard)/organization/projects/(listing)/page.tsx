import type { Metadata } from "next";
import { Building } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireAuthContext } from "@/lib/auth";
import { ContentLayout } from "@/components/layout";
import { getOrganizationProjects } from "@/features/projects/queries";
import { getProjectTypes, getProjectModalities } from "@/features/projects/actions";
import { fetchLastActiveProject } from "@/features/projects/actions";
import { getOrganizationPlanFeatures } from "@/actions/plans";
import { ProjectsListView } from "@/features/projects/views/projects-list-view";
import { ErrorDisplay } from "@/components/ui/error-display";

// ✅ OBLIGATORIO: Metadata para SEO y título de página
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Project' });
    return {
        title: `Proyectos | Seencel`,
        description: t('subtitle'),
        robots: "noindex, nofollow", // Dashboard siempre privado
    };
}

export default async function ProjectsPage() {
    const { orgId } = await requireAuthContext();

    try {
        const [projects, projectTypes, projectModalities, lastActiveProjectId, planFeatures] = await Promise.all([
            getOrganizationProjects(orgId),
            getProjectTypes(orgId),
            getProjectModalities(orgId),
            fetchLastActiveProject(orgId),
            getOrganizationPlanFeatures(orgId)
        ]);

        // Get max projects from plan (-1 = unlimited)
        const maxActiveProjects = planFeatures?.max_active_projects ?? -1;

        return (
            <ContentLayout variant="wide">
                <ProjectsListView
                    projects={projects}
                    organizationId={orgId}
                    lastActiveProjectId={lastActiveProjectId}
                    maxActiveProjects={maxActiveProjects}
                    projectTypes={projectTypes}
                    projectModalities={projectModalities}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <ContentLayout variant="wide">
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Error al cargar proyectos"
                        message={error instanceof Error ? error.message : "Error desconocido"}
                        retryLabel="Reintentar"
                    />
                </div>
            </ContentLayout>
        );
    }
}

