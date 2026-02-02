"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Project } from "@/types/project";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "@/i18n/routing";
import { useLayoutStore } from "@/store/layout-store";
import { useModal } from "@/providers/modal-store";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
    LayoutGrid,
    List,
    Plus,
    FolderSearch,
    Ban,
    Activity,
    CheckCircle,
    Clock,
    CircleOff
} from "lucide-react";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";

import { EmptyState } from "@/components/ui/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectsProjectForm } from "../forms/projects-project-form";
import { deleteProject } from "@/features/projects/actions";

interface ProjectsListViewProps {
    projects: Project[];
    organizationId: string;
    lastActiveProjectId?: string | null;
    /** Max projects allowed by plan (-1 = unlimited) */
    maxProjects?: number;
}

type ViewMode = "grid" | "table";

export function ProjectsListView({ projects, organizationId, lastActiveProjectId, maxProjects = -1 }: ProjectsListViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();
    const { actions } = useLayoutStore();
    const { openModal, closeModal } = useModal();
    const tForm = useTranslations('Project.form');

    // 🚀 OPTIMISTIC UI: Instant visual updates for delete
    const { optimisticItems: optimisticProjects } = useOptimisticList({
        items: projects,
        getItemId: (project) => project.id,
    });

    // Plan limits
    const isUnlimited = maxProjects === -1;
    const canCreateProject = isUnlimited || projects.length < maxProjects;

    // === HANDLERS ===

    const handleSuccess = () => {
        router.refresh();
        closeModal();
    };

    const handleCreateProject = () => {
        openModal(
            <ProjectsProjectForm
                mode="create"
                organizationId={organizationId}
                onCancel={closeModal}
                onSuccess={handleSuccess}
            />,
            {
                title: tForm('createTitle'),
                description: tForm('description'),
                key: 'create-project',
            }
        );
    };

    const handleEdit = (project: Project) => {
        openModal(
            <ProjectsProjectForm
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

    const handleNavigateToProject = (project: Project) => {
        actions.setActiveProjectId(project.id);
        actions.setActiveContext('project');
        router.push(`/project/${project.id}` as any);
    };

    const handleDelete = (project: Project) => {
        setProjectToDelete(project);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteProject(projectToDelete.id);
            if (result.success) {
                toast.success("Proyecto eliminado correctamente");
                setProjectToDelete(null);
                router.refresh();
            } else {
                toast.error(result.error || "Error al eliminar el proyecto");
            }
        } catch (error) {
            toast.error("Error inesperado al eliminar");
        } finally {
            setIsDeleting(false);
        }
    };

    // === STATUS BADGE HELPER ===

    const getStatusBadgeProps = (status: string) => {
        const statusKey = status?.toLowerCase() || 'active';
        const statusConfig: Record<string, { variant: "success" | "info" | "warning" | "system" | "secondary"; icon: typeof Activity; label: string }> = {
            active: { variant: "success", icon: Activity, label: "Activo" },
            completed: { variant: "info", icon: CheckCircle, label: "Completado" },
            planning: { variant: "warning", icon: Clock, label: "Planificación" },
            inactive: { variant: "system", icon: CircleOff, label: "Inactivo" },
        };
        return statusConfig[statusKey] || { variant: "secondary" as const, icon: Activity, label: status };
    };

    // === COLUMNS ===

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
            cell: ({ row }) => {
                const { variant, icon: Icon, label } = getStatusBadgeProps(row.original.status);
                return <Badge variant={variant} icon={<Icon className="h-3.5 w-3.5" />}>{label}</Badge>;
            },
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

    // === VIEW TOGGLE ===

    const viewToggle = (
        <ToolbarTabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "grid" | "table")}
            options={[
                { value: "grid", label: "Tarjetas", icon: LayoutGrid },
                { value: "table", label: "Tabla", icon: List },
            ]}
        />
    );

    // === EARLY RETURN: Empty State (alto completo) ===
    if (projects.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    leftActions={viewToggle}
                    actions={[{
                        label: "Nuevo Proyecto",
                        icon: Plus,
                        onClick: handleCreateProject,
                        featureGuard: {
                            isEnabled: canCreateProject,
                            featureName: "Crear más proyectos",
                            requiredPlan: "PRO",
                            customMessage: `Has alcanzado el límite de ${maxProjects} proyecto${maxProjects !== 1 ? 's' : ''} de tu plan actual (${projects.length}/${maxProjects}). Actualiza a PRO para crear proyectos ilimitados.`
                        }
                    }]}
                />
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={Ban}
                        title="No hay proyectos"
                        description="Aún no has creado ningún proyecto en esta organización."
                    />
                </div>
            </>
        );
    }

    // === RENDER ===

    return (
        <div className="space-y-4">
            {/* Toolbar - Portals to header */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar proyectos..."
                leftActions={viewToggle}
                actions={[{
                    label: "Nuevo Proyecto",
                    icon: Plus,
                    onClick: handleCreateProject,
                    featureGuard: {
                        isEnabled: canCreateProject,
                        featureName: "Crear más proyectos",
                        requiredPlan: "PRO",
                        customMessage: `Has alcanzado el límite de ${maxProjects} proyecto${maxProjects !== 1 ? 's' : ''} de tu plan actual (${projects.length}/${maxProjects}). Actualiza a PRO para crear proyectos ilimitados.`
                    }
                }]}
            />

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={optimisticProjects}
                onRowClick={handleNavigateToProject}
                pageSize={50}
                viewMode={viewMode}
                enableRowActions={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
                globalFilter={searchQuery}
                onGlobalFilterChange={setSearchQuery}
                renderGridItem={(project: Project) => (
                    <ProjectCard
                        project={project}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
                gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={!!projectToDelete}
                onOpenChange={(open) => !open && setProjectToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar proyecto permanentemente?"
                description={
                    <div className="space-y-3">
                        <p>
                            Estás a punto de eliminar el proyecto <span className="font-semibold text-foreground">"{projectToDelete?.name}"</span>.
                        </p>
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                            <p className="font-medium text-destructive mb-2">⚠️ Esta acción es irreversible</p>
                            <p className="text-muted-foreground">
                                Se eliminarán permanentemente todos los datos asociados: tareas, archivos,
                                registros de bitácora, finanzas, materiales y configuraciones del proyecto.
                            </p>
                        </div>
                    </div>
                }
                validationText={projectToDelete?.name}
                validationPrompt="Para confirmar, escribí el nombre del proyecto:"
                confirmLabel="Eliminar permanentemente"
                deletingLabel="Eliminando..."
                isDeleting={isDeleting}
            />
        </div>
    );
}
