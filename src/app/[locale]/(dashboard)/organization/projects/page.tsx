
import { getTranslations } from "next-intl/server";
import { getUserOrganizations } from "@/features/organization/queries";
import { getOrganizationProjects } from "@/features/projects/queries";
import { CreateProjectButton } from "@/features/projects/components/CreateProjectButton";
import { ProjectRow } from "@/features/projects/components/ProjectRow";
import { redirect } from "@/i18n/routing";
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
        redirect('/organization');
    }

    const projects = await getOrganizationProjects(activeOrgId);

    return (
        <div className="space-y-8">
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
    );
}
