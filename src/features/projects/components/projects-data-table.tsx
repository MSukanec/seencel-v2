"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Project } from "@/types/project";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "@/i18n/routing";
import { useLayoutStore } from "@/store/layout-store";
import { ProjectStatusBadge } from "./project-status-badge";
import { useModal } from "@/providers/modal-store";
import { CreateProjectButton } from "./create-project-button";
import { ProjectCard } from "@/features/projects/components/project-card";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

import { FolderSearch, Ban } from "lucide-react";
import { DataTableEmptyState } from "@/components/shared/data-table/data-table-empty-state";
import { Button } from "@/components/ui/button";

import { ProjectForm } from "./project-form";

interface ProjectsDataTableProps {
    projects: Project[];
    organizationId: string;
    lastActiveProjectId?: string | null;
    viewMode: "table" | "grid";
    /** Max projects allowed by plan (-1 = unlimited) */
    maxProjects?: number;
    /** External global filter value (controlled by Toolbar in parent) */
    globalFilter?: string;
    /** Callback when global filter changes */
    onGlobalFilterChange?: (value: string) => void;
}

export function ProjectsDataTable({
    projects,
    organizationId,
    lastActiveProjectId,
    viewMode = "table",
    maxProjects = -1,
    globalFilter,
    onGlobalFilterChange,
}: ProjectsDataTableProps) {
    const router = useRouter();
    const { actions } = useLayoutStore();
    const { openModal, closeModal } = useModal();

    // 🚀 OPTIMISTIC UI: Instant visual updates for delete
    const {
        optimisticItems: optimisticProjects,
    } = useOptimisticList({
        items: projects,
        getItemId: (project) => project.id,
    });

    const handleSuccess = () => {
        router.refresh();
        closeModal();
    };

    const handleNavigateToProject = (project: Project) => {
        actions.setActiveProjectId(project.id);
        actions.setActiveContext('project');
        router.push(`/project/${project.id}` as any);
    };

    const handleEdit = (project: Project) => {
        openModal(
            <ProjectForm
                mode="edit"
                organizationId={organizationId}
                initialData={project}
                onSuccess={handleSuccess}
                onCancel={closeModal}
            />,
            {
                title: "Editar Proyecto",
                description: `Modificando "${project.name}"`,
                key: `edit-project-${project.id}`
            }
        );
    };

    const handleDelete = (project: Project) => {
        // Delegate to parent component via callback or handle inline
        // For now, we'll let the parent (ProjectsList) handle the delete dialog
        // This is handled by the ProjectCard's onDelete prop
    };

    const columns: ColumnDef<Project>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Proyecto" />
            ),
            cell: ({ row }) => {
                const project = row.original;
                return (
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 rounded-lg shrink-0">
                            <AvatarImage src={project.image_url || undefined} />
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                                {project.name?.charAt(0)?.toUpperCase() || "P"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{project.name}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Estado" />
            ),
            cell: ({ row }) => (
                <ProjectStatusBadge status={row.original.status} />
            ),
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "project_type_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tipo" />
            ),
            cell: ({ row }) => (
                <Badge variant="outline" className="font-normal">
                    {row.original.project_type_name || "Sin tipo"}
                </Badge>
            ),
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "project_modality_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Modalidad" />
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.project_modality_name || "-"}
                </span>
            ),
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Creado" />
            ),
            cell: ({ row }) => {
                const date = row.original.created_at;
                if (!date) return "-";
                return (
                    <span className="text-muted-foreground text-sm">
                        {format(new Date(date), "dd MMM yyyy", { locale: es })}
                    </span>
                );
            },
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={optimisticProjects}
            onRowClick={handleNavigateToProject}
            pageSize={50}
            viewMode={viewMode}
            enableRowActions={true}
            onView={handleNavigateToProject}
            onEdit={handleEdit}
            globalFilter={globalFilter}
            onGlobalFilterChange={onGlobalFilterChange}
            renderGridItem={(project: Project) => (
                <ProjectCard
                    project={project}
                    onEdit={handleEdit}
                />
            )}
            gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            emptyState={({ table }) => {
                const isFiltered = table.getState().columnFilters.length > 0 || !!table.getState().globalFilter;
                if (isFiltered) {
                    return (
                        <DataTableEmptyState
                            title="No hay resultados"
                            description="No se encontraron proyectos que coincidan con los filtros aplicados."
                            icon={FolderSearch}
                            action={
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        table.resetColumnFilters();
                                        table.setGlobalFilter("");
                                        onGlobalFilterChange?.("");
                                    }}
                                >
                                    Limpiar filtros
                                </Button>
                            }
                        />
                    );
                }
                return (
                    <DataTableEmptyState
                        title="No hay proyectos"
                        description="Aún no has creado ningún proyecto en esta organización."
                        icon={Ban}
                        action={<CreateProjectButton organizationId={organizationId} currentProjectCount={projects.length} maxProjects={maxProjects} />}
                    />
                );
            }}
        />
    );
}
