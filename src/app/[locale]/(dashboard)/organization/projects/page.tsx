import { getTranslations } from "next-intl/server";
import { getUserOrganizations } from "@/features/organization/queries";
import { getOrganizationProjects } from "@/features/projects/queries";
import { getProjectTypes, getProjectModalities } from "@/features/projects/actions/project-settings-actions";
import { fetchLastActiveProject } from "@/features/projects/actions";
import { ProjectsList } from "@/features/projects/components/projects-list";
import { ProjectTypesManager } from "@/features/projects/components/project-types-manager";
import { ProjectModalitiesManager } from "@/features/projects/components/project-modalities-manager";
import { redirect } from "@/i18n/routing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

export default async function ProjectsPage({
    params: { locale }
}: {
    params: { locale: string }
}) {
    const t = await getTranslations('Project');

    const { activeOrgId } = await getUserOrganizations();
    if (!activeOrgId) {
        redirect({ href: '/organization', locale });
    }

    const [projects, projectTypes, projectModalities, lastActiveProjectId] = await Promise.all([
        getOrganizationProjects(activeOrgId),
        getProjectTypes(activeOrgId),
        getProjectModalities(activeOrgId),
        fetchLastActiveProject(activeOrgId)
    ]);

    return (
        <Tabs defaultValue="projects" className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title={t('breadcrumb')}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="projects" className={tabTriggerClass}>
                            {t('tabs.projects')}
                        </TabsTrigger>
                        <TabsTrigger value="settings" className={tabTriggerClass}>
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
