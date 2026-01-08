import { getTranslations } from "next-intl/server";
import { getUserOrganizations } from "@/features/organization/queries";
import { getOrganizationProjects } from "@/features/projects/queries";
import { getProjectTypes, getProjectModalities } from "@/features/projects/actions/project-settings-actions";
import { CreateProjectButton } from "@/features/projects/components/CreateProjectButton";
import { ProjectRow } from "@/features/projects/components/ProjectRow";
import { ProjectTypesManager } from "@/features/projects/components/project-types-manager";
import { ProjectModalitiesManager } from "@/features/projects/components/project-modalities-manager";
import { redirect } from "@/i18n/routing";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderPortal } from "@/components/layout/header-portal";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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

    const [projects, projectTypes, projectModalities] = await Promise.all([
        getOrganizationProjects(activeOrgId),
        getProjectTypes(activeOrgId),
        getProjectModalities(activeOrgId)
    ]);

    return (
        <div className="flex flex-col h-full">
            {/* Breadcrumb fix */}
            <HeaderTitleUpdater title={
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    Organización <span className="text-muted-foreground/40">/</span> <span className="text-foreground font-medium">{t('breadcrumb')}</span>
                </span>
            } />

            <Tabs defaultValue="projects" className="w-full flex-1 flex flex-col">
                <HeaderPortal>
                    <TabsList className="h-full bg-transparent p-0 gap-6 flex items-end">
                        <TabsTrigger
                            value="projects"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            {t('tabs.projects')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            {t('tabs.settings')}
                        </TabsTrigger>
                    </TabsList>
                </HeaderPortal>

                {/* Projects Tab */}
                <TabsContent value="projects" className="mt-6 flex-1 focus-visible:outline-none">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
                                <p className="text-muted-foreground">
                                    {t('subtitle')}
                                </p>
                            </div>
                            <CreateProjectButton />
                        </div>

                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('table.name')}</TableHead>
                                        <TableHead>{t('table.status')}</TableHead>
                                        <TableHead className="hidden md:table-cell">{t('table.type')}</TableHead>
                                        <TableHead className="hidden md:table-cell">{t('table.location')}</TableHead>
                                        <TableHead className="hidden md:table-cell">{t('table.dates')}</TableHead>
                                        <TableHead className="text-right">{t('table.active')}</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projects.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No projects found.
                                            </TableCell>
                                        </TableRow>
                                    ) : projects.map((project) => (
                                        <ProjectRow key={project.id} project={project} locale={locale} />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-6 flex-1 focus-visible:outline-none">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h2>
                            <p className="text-muted-foreground">
                                {t('settings.subtitle')}
                            </p>
                        </div>

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
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
