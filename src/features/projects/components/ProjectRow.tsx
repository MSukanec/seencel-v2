"use client";

import { Project } from "@/types/project";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { ProjectActions } from "./ProjectActions";

interface ProjectRowProps {
    project: Project;
    locale: string;
}

import { useRouter } from "@/i18n/routing";
import { useLayoutStore } from "@/store/layout-store";

export function ProjectRow({ project, locale }: ProjectRowProps) {
    const router = useRouter();
    const { actions } = useLayoutStore();
    const dateLocale = locale === 'es' ? es : enUS;

    const handleRowClick = () => {
        actions.setActiveProjectId(project.id);
        actions.setActiveContext('project');
        router.push(`/project/${project.id}` as any);
    };

    return (
        <TableRow
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={handleRowClick}
        >
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
            <TableCell onClick={(e) => e.stopPropagation()}>
                <ProjectActions project={project} />
            </TableCell>
        </TableRow>
    );
}
