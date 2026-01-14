"use client";

import { Project } from "@/types/project";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { ProjectActions } from "./project-actions";
import { ProjectStatusBadge } from "./project-status-badge";

interface ProjectRowProps {
    project: Project;
    locale: string;
    isLastActive?: boolean;
}

import { useRouter } from "@/i18n/routing";
import { useLayoutStore } from "@/store/layout-store";

export function ProjectRow({ project, locale, isLastActive }: ProjectRowProps) {
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
            className={`cursor-pointer transition-colors ${isLastActive ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'}`}
            onClick={handleRowClick}
        >
            {/* 1. Nombre */}
            <TableCell>
                <div className="flex items-center space-x-4">
                    <Avatar className="h-9 w-9 rounded-lg">
                        {project.image_url ? (
                            <AvatarImage src={project.image_url} />
                        ) : (
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                                {project.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{project.name}</span>
                            {isLastActive && (
                                <Badge variant="success" className="h-5 px-1.5 text-[10px] uppercase">
                                    Activo
                                </Badge>
                            )}
                        </div>
                        {project.code && <span className="text-xs text-muted-foreground font-mono">{project.code}</span>}
                    </div>
                </div>
            </TableCell>

            {/* 2. Tipo */}
            <TableCell className="hidden md:table-cell">
                {project.project_type_name ? (
                    <Badge variant="secondary" className="font-normal">
                        {project.project_type_name}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </TableCell>

            {/* 3. Modalidad */}
            <TableCell className="hidden md:table-cell">
                {project.project_modality_name ? (
                    <Badge variant="secondary" className="font-normal">
                        {project.project_modality_name}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </TableCell>

            {/* 4. Fecha Creación */}
            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                {project.created_at ? format(new Date(project.created_at), 'dd MMM yyyy', { locale: dateLocale }) : "-"}
            </TableCell>

            {/* 5. Última Actividad */}
            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                {project.last_active_at ? format(new Date(project.last_active_at), 'dd MMM yyyy', { locale: dateLocale }) : "-"}
            </TableCell>

            {/* 6. Estado (Status) */}
            <TableCell className="text-right">
                <div className="flex justify-end">
                    <ProjectStatusBadge status={project.status} />
                </div>
            </TableCell>

            {/* 7. Acciones */}
            <TableCell onClick={(e) => e.stopPropagation()}>
                <ProjectActions project={project} />
            </TableCell>
        </TableRow>
    );
}
