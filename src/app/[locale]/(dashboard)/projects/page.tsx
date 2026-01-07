
import { getTranslations } from "next-intl/server";
import { getUserOrganizations } from "@/features/organization/queries";
import { getOrganizationProjects } from "@/features/projects/queries";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { redirect } from "@/i18n/routing";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

export default async function ProjectsPage({
    params: { locale }
}: {
    params: { locale: string }
}) {
    const t = await getTranslations('Project');

    // 1. Get Active Org
    const { activeOrgId } = await getUserOrganizations();
    if (!activeOrgId) {
        redirect('/organization');
    }

    // 2. Get Projects
    const projects = await getOrganizationProjects(activeOrgId);

    const dateLocale = locale === 'es' ? es : enUS;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
                    <p className="text-muted-foreground">
                        {t('subtitle')}
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('create')}
                </Button>
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No projects found.
                                </TableCell>
                            </TableRow>
                        ) : projects.map((project) => (
                            <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <TableCell>
                                    <div className="flex items-center space-x-4">
                                        <Avatar className="h-9 w-9 rounded-lg">
                                            {project.image_path ? (
                                                <AvatarImage src={`https://${project.image_bucket}.supabase.co/storage/v1/object/public/${project.image_bucket}/${project.image_path}`} />
                                            ) : (
                                                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                                                    {project.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{project.name}</span>
                                            {project.code && <span className="text-xs text-muted-foreground font-mono">{project.code}</span>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={project.status === 'Activo' ? 'default' : 'secondary'} className="capitalize">
                                        {project.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {project.project_type_name || "-"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                    {project.city || project.country ? (
                                        <span>{project.city}{project.city && project.country && ', '}{project.country}</span>
                                    ) : "-"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                    {project.start_date ? format(new Date(project.start_date), 'MMM yyyy', { locale: dateLocale }) : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    {project.is_active && (
                                        <div className="flex justify-end">
                                            <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
