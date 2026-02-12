import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getUserOrganizations } from "@/features/organization/queries";
import { getOrganizationProjects } from "@/features/projects/queries";
import { getProjectTypes, getProjectModalities } from "@/features/projects/actions";
import { fetchLastActiveProject } from "@/features/projects/actions";
import { getOrganizationPlanFeatures } from "@/actions/plans";
import { ProjectsListView } from "@/features/projects/views/projects-list-view";
import { ProjectsSettingsView } from "@/features/projects/views/projects-settings-view";
import { redirect } from "@/i18n/routing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Building } from "lucide-react";

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

export default async function ProjectsPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const t = await getTranslations('Project');

    const { activeOrgId } = await getUserOrganizations();
    if (!activeOrgId) {
        redirect({ href: '/organization', locale });
    }

    try {
        const [projects, projectTypes, projectModalities, lastActiveProjectId, planFeatures] = await Promise.all([
            getOrganizationProjects(activeOrgId),
            getProjectTypes(activeOrgId),
            getProjectModalities(activeOrgId),
            fetchLastActiveProject(activeOrgId),
            getOrganizationPlanFeatures(activeOrgId)
        ]);

        // Get max projects from plan (-1 = unlimited)
        const maxActiveProjects = planFeatures?.max_active_projects ?? -1;

        return (
            <Tabs defaultValue="projects" syncUrl="view" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Proyectos"
                    icon={<Building />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                            <TabsTrigger value="projects">
                                {t('tabs.projects')}
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                {t('settings.title')}
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    {/* Projects Tab */}
                    <TabsContent value="projects" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <ProjectsListView
                                projects={projects}
                                organizationId={activeOrgId}
                                lastActiveProjectId={lastActiveProjectId}
                                maxActiveProjects={maxActiveProjects}
                                projectTypes={projectTypes}
                                projectModalities={projectModalities}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <ProjectsSettingsView
                                organizationId={activeOrgId}
                                initialTypes={projectTypes}
                                initialModalities={projectModalities}
                            />
                        </ContentLayout>
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar proyectos"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
