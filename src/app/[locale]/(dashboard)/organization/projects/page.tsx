import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getUserOrganizations } from "@/features/organization/queries";
import { getOrganizationProjects } from "@/features/projects/queries";
import { getProjectTypes, getProjectModalities } from "@/features/projects/actions/project-settings-actions";
import { fetchLastActiveProject } from "@/features/projects/actions";
import { getOrganizationPlanFeatures } from "@/actions/plans";
import { ProjectsList } from "@/features/projects/components/projects-list";
import { ProjectTypesManager } from "@/features/projects/components/project-types-manager";
import { ProjectModalitiesManager } from "@/features/projects/components/project-modalities-manager";
import { redirect } from "@/i18n/routing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { Briefcase } from "lucide-react";

// ✅ OBLIGATORIO: Metadata para SEO y título de página
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Project' });
    return {
        title: `Proyectos | SEENCEL`,
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

    const [projects, projectTypes, projectModalities, lastActiveProjectId, planFeatures] = await Promise.all([
        getOrganizationProjects(activeOrgId),
        getProjectTypes(activeOrgId),
        getProjectModalities(activeOrgId),
        fetchLastActiveProject(activeOrgId),
        getOrganizationPlanFeatures(activeOrgId)
    ]);

    // Get max projects from plan (-1 = unlimited)
    const maxProjects = planFeatures?.max_projects ?? -1;

    return (
        <Tabs defaultValue="projects" className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Proyectos"
                icon={<Briefcase />}
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
                <TabsContent value="projects" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <ProjectsList
                            projects={projects}
                            organizationId={activeOrgId}
                            lastActiveProjectId={lastActiveProjectId}
                            maxProjects={maxProjects}
                        />
                    </ContentLayout>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <div className="grid gap-6">
                            <ProjectTypesManager
                                organizationId={activeOrgId}
                                initialTypes={projectTypes}
                            />
                            <ProjectModalitiesManager
                                organizationId={activeOrgId}
                                initialModalities={projectModalities}
                            />
                        </div>
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>

        </Tabs>
    );
}
