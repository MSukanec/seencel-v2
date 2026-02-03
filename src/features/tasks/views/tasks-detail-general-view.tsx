"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsSection } from "@/components/shared/settings-section";
import { Combobox } from "@/components/ui/combobox";
import { Monitor, Building2, Settings } from "lucide-react";
import { toast } from "sonner";
import { updateTaskOrganization } from "@/features/tasks/actions";
import type { TaskView, TaskDivision } from "@/features/tasks/types";

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
    isAdminMode?: boolean;
    organizations?: Organization[];
}

// ============================================================================
// Component
// ============================================================================

export function TasksDetailGeneralView({
    task,
    divisions,
    isAdminMode = false,
    organizations = [],
}: TasksDetailGeneralViewProps) {
    const router = useRouter();
    const [selectedOrgId, setSelectedOrgId] = useState(task.organization_id || "");

    // Find division name if needed
    const divisionName = task.division_name ||
        divisions.find(d => d.id === task.task_division_id)?.name ||
        "Sin división";

    // Org options for combobox - include "Sistema" option
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

    return (
        <div className="space-y-6">
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
    );
}
