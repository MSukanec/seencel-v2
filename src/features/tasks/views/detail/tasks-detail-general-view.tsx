"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsSection } from "@/components/shared/settings-section";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Combobox } from "@/components/ui/combobox";
import { Monitor, Building2, Settings, Pencil, Boxes, Zap, Layers } from "lucide-react";
import { toast } from "sonner";
import { updateTaskOrganization } from "@/features/tasks/actions";
import { TasksForm } from "@/features/tasks/forms/tasks-form";
import type { TaskView, TaskDivision, Unit, Task } from "@/features/tasks/types";

// ============================================================================
// Types
// ============================================================================

interface Organization {
    id: string;
    name: string;
}

interface TasksDetailGeneralViewProps {
    task: TaskView;
    divisions: TaskDivision[];
    units: Unit[];
    organizationId: string;
    isAdminMode?: boolean;
    organizations?: Organization[];
}

// ============================================================================
// Component
// ============================================================================

export function TasksDetailGeneralView({
    task,
    divisions,
    units,
    organizationId,
    isAdminMode = false,
    organizations = [],
}: TasksDetailGeneralViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [selectedOrgId, setSelectedOrgId] = useState(task.organization_id || "");

    // ========================================================================
    // Edit Handler
    // ========================================================================

    const handleEdit = () => {
        // Map TaskView to partial Task for the form's initialData
        const taskForForm: Task = {
            id: task.id,
            name: task.name || task.custom_name || "",
            custom_name: task.custom_name || null,
            code: task.code || null,
            description: task.description || null,
            unit_id: task.unit_id || "",
            task_division_id: task.task_division_id || null,
            organization_id: task.organization_id || null,
            is_system: task.is_system || false,
            is_published: task.is_published ?? false,
            is_deleted: false,
            deleted_at: null,
            created_at: task.created_at || "",
            updated_at: task.updated_at || "",
        };

        openModal(
            <TasksForm
                mode="edit"
                initialData={taskForForm}
                organizationId={organizationId}
                units={units}
                divisions={divisions}
                isAdminMode={isAdminMode}
                onCancel={() => closeModal()}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Editar Tarea",
                description: "Modificá los datos generales de la tarea.",
                size: "lg",
            }
        );
    };

    // ========================================================================
    // Derived data
    // ========================================================================

    const divisionName = task.division_name ||
        divisions.find(d => d.id === task.task_division_id)?.name ||
        "Sin división";

    // Admin: org options for combobox
    const orgOptions = [
        { value: "", label: "Sistema (sin organización)" },
        ...organizations.map(org => ({
            value: org.id,
            label: org.name,
        }))
    ];

    const handleOrgChange = async (newOrgId: string) => {
        setSelectedOrgId(newOrgId);

        const result = await updateTaskOrganization(
            task.id,
            newOrgId || null
        );

        if (result.error) {
            toast.error(result.error);
            setSelectedOrgId(task.organization_id || "");
        } else {
            toast.success("Organización actualizada");
            router.refresh();
        }
    };

    // Only allow editing non-system tasks (org tasks)
    const canEdit = !task.is_system || isAdminMode;

    return (
        <>
            {/* Toolbar con botón Editar en header */}
            <Toolbar
                portalToHeader
                actions={canEdit ? [
                    {
                        label: "Editar Tarea",
                        icon: Pencil,
                        onClick: handleEdit,
                    },
                ] : undefined}
            />

            <div className="space-y-6 p-4">
                {/* Basic Info Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Información de la Tarea</CardTitle>
                                <CardDescription>Datos generales de la tarea</CardDescription>
                            </div>
                            <Badge
                                variant={task.is_system ? "system" : "default"}
                                className="gap-1"
                            >
                                {task.is_system ? (
                                    <>
                                        <Monitor className="h-3 w-3" />
                                        Sistema
                                    </>
                                ) : (
                                    <>
                                        <Building2 className="h-3 w-3" />
                                        Organización
                                    </>
                                )}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Código</p>
                                <p className="font-medium">{task.code || "—"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Nombre</p>
                                <p className="font-medium">{task.name || task.custom_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Unidad</p>
                                <p className="font-medium">{task.unit_name || "—"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">División</p>
                                <p className="font-medium">{divisionName}</p>
                            </div>

                            {/* Campos adicionales de tasks_view */}
                            {task.element_name && (
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Boxes className="h-3.5 w-3.5" />
                                        Elemento
                                    </p>
                                    <p className="font-medium">{task.element_name}</p>
                                </div>
                            )}
                            {task.action_name && (
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Zap className="h-3.5 w-3.5" />
                                        Acción
                                    </p>
                                    <p className="font-medium">
                                        {task.action_name}
                                        {task.action_short_code && (
                                            <span className="text-muted-foreground font-mono text-xs ml-1">
                                                ({task.action_short_code})
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                            {task.is_parametric && (
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Layers className="h-3.5 w-3.5" />
                                        Tipo
                                    </p>
                                    <Badge variant="outline" className="text-xs">Paramétrica</Badge>
                                </div>
                            )}

                            {task.description && (
                                <div className="col-span-4">
                                    <p className="text-sm text-muted-foreground">Descripción</p>
                                    <p className="font-medium">{task.description}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Admin Settings */}
                {isAdminMode && (
                    <SettingsSection
                        icon={Settings}
                        title="Configuración Admin"
                        description="Cambiar la propiedad de la tarea"
                    >
                        <div className="max-w-sm">
                            <Combobox
                                options={orgOptions}
                                value={selectedOrgId}
                                onValueChange={handleOrgChange}
                                placeholder="Seleccionar organización..."
                                searchPlaceholder="Buscar organización..."
                                emptyMessage="No se encontraron organizaciones"
                            />
                        </div>
                    </SettingsSection>
                )}
            </div>
        </>
    );
}
