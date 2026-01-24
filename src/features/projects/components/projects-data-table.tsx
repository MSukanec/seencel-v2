"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Project } from "@/types/project";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "@/i18n/routing";
import { useLayoutStore } from "@/store/layout-store";
import { ProjectStatusBadge } from "./project-status-badge";
import { deleteProject } from "@/features/projects/actions";
import { useModal } from "@/providers/modal-store";
import { CreateProjectButton } from "./create-project-button";
import { useState } from "react";
import { toast } from "sonner";
import { ProjectCard } from "@/features/projects/components/project-card";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

import { Circle, Timer, CheckCircle2, Ban, FolderSearch } from "lucide-react";
import { DataTableEmptyState } from "@/components/shared/data-table/data-table-empty-state";
import { Button } from "@/components/ui/button";

import { ProjectForm } from "./project-form";

interface ProjectsDataTableProps {
    projects: Project[];
    organizationId: string;
    lastActiveProjectId?: string | null;
    viewToggle?: React.ReactNode;
    pageSize?: number;
    viewMode: "table" | "grid";
}

export function ProjectsDataTable({ projects, organizationId, lastActiveProjectId, viewToggle, viewMode = "table" }: ProjectsDataTableProps) {
    const router = useRouter();
    const { actions } = useLayoutStore();
    const { openModal, closeModal } = useModal();
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    // 🚀 OPTIMISTIC UI: Instant visual updates for delete
    const {
        optimisticItems: optimisticProjects,
        removeItem: optimisticRemove,
        isPending
    } = useOptimisticList({
        items: projects,
        getItemId: (project) => project.id,
    });

    const statusOptions = [
        {
            value: "active",
            label: "Activo",
            icon: Circle,
        },
        {
            value: "planning",
            label: "En Planificación",
            icon: Timer,
        },
        {
            value: "completed",
            label: "Completado",
            icon: CheckCircle2,
        },
        {
            value: "inactive",
            label: "Inactivo",
            icon: Ban,
        },
    ];

    const typeOptions = Array.from(new Set(optimisticProjects.map(p => p.project_type_name).filter(Boolean)))
        .map(type => ({
            label: type!,
            value: type!,
        }));

    const modalityOptions = Array.from(new Set(optimisticProjects.map(p => p.project_modality_name).filter(Boolean)))
        .map(modality => ({
            label: modality!,
            value: modality!,
        }));


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

    // 🚀 OPTIMISTIC DELETE: Project disappears instantly, server in background
    const handleConfirmDelete = () => {
        if (!projectToDelete) return;
        const projectId = projectToDelete.id;
        setProjectToDelete(null); // Close dialog immediately

        optimisticRemove(projectId, async () => {
            try {
                const result = await deleteProject(projectId);
                if (result.success) {
                    toast.success("Proyecto eliminado correctamente");
                } else {
                    toast.error(result.error || "Error al eliminar el proyecto");
                    router.refresh(); // Recover on error
                }
            } catch (error) {
                toast.error("Error inesperado al eliminar");
                router.refresh();
            }
        });
    };

    const handleDelete = (project: Project) => {
        setProjectToDelete(project);
    };

    const columns: ColumnDef<Project>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Proyecto" />,
            cell: ({ row }) => {
                const project = row.original;
                const isActive = project.id === lastActiveProjectId;
                return (
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
                                {isActive && (
                                    <Badge variant="success" className="h-5 px-1.5 text-[10px] uppercase">
                                        Activo
                                    </Badge>
                                )}
                            </div>
                            {project.code && (
                                <span className="text-xs text-muted-foreground font-mono">{project.code}</span>
                            )}
                        </div>
                    </div>
                );
            },
            enableHiding: false,
        },
        {
            accessorKey: "project_type_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
            cell: ({ row }) => {
                const typeName = row.getValue("project_type_name") as string | null;
                return typeName ? (
                    <Badge variant="secondary" className="font-normal">
                        {typeName}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "project_modality_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Modalidad" />,
            cell: ({ row }) => {
                const modalityName = row.getValue("project_modality_name") as string | null;
                return modalityName ? (
                    <Badge variant="secondary" className="font-normal">
                        {modalityName}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Creación" />,
            cell: ({ row }) => {
                const date = row.getValue("created_at") as string | null;
                return date ? (
                    <span className="text-muted-foreground text-sm">
                        {format(new Date(date), 'dd MMM yyyy', { locale: es })}
                    </span>
                ) : "-";
            },
        },
        {
            accessorKey: "last_active_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Últ. Actividad" />,
            cell: ({ row }) => {
                const date = row.getValue("last_active_at") as string | null;
                return date ? (
                    <span className="text-muted-foreground text-sm">
                        {format(new Date(date), 'dd MMM yyyy', { locale: es })}
                    </span>
                ) : "-";
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return <ProjectStatusBadge status={status} />;
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
    ];

    return (
        <>
            <DataTable
                columns={columns}
                data={optimisticProjects}
                searchPlaceholder="Buscar proyectos..."
                onRowClick={handleNavigateToProject}
                toolbar={<CreateProjectButton organizationId={organizationId} />}
                leftActions={viewToggle}
                facetedFilters={[
                    {
                        columnId: "status",
                        title: "Estado",
                        options: statusOptions
                    },
                    {
                        columnId: "project_type_name",
                        title: "Tipo",
                        options: typeOptions
                    },
                    {
                        columnId: "project_modality_name",
                        title: "Modalidad",
                        options: modalityOptions
                    }
                ]}
                pageSize={50}
                viewMode={viewMode}
                toolbarInHeader={true}
                enableRowActions={true}
                onView={handleNavigateToProject}
                onEdit={handleEdit}
                onDelete={handleDelete}
                renderGridItem={(project: Project) => (
                    <ProjectCard
                        project={project}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
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
                            action={<CreateProjectButton organizationId={organizationId} />}
                        />
                    );
                }}
            />
            <DeleteConfirmationDialog
                open={!!projectToDelete}
                onOpenChange={(open) => !open && setProjectToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Proyecto"
                description={
                    <span>
                        ¿Estás seguro de que deseas eliminar el proyecto <span className="font-medium text-foreground">"{projectToDelete?.name}"</span>?
                        <br />
                        Esta acción moverá el proyecto a la papelera.
                    </span>
                }
                validationText={projectToDelete?.name}
                confirmLabel="Eliminar Proyecto"
                deletingLabel="Eliminando..."
                isDeleting={isPending}
            />
        </>
    );
}

