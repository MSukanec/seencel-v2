"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Monitor, Building2 } from "lucide-react";

import { TasksByDivision, Unit, TaskDivision, TaskKind } from "@/features/tasks/types";
import { TaskCatalog } from "@/features/tasks/components/catalog/task-catalog";
import { TaskForm } from "@/features/tasks/components/forms/task-form";
import { TaskTypeSelector, TaskCreationType } from "@/features/tasks/components/forms/task-type-selector";
import { ParametricTaskForm } from "@/features/tasks/components/forms/parametric-task-form";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { useModal } from "@/providers/modal-store";

// Filter type for origin
type OriginFilter = "all" | "system" | "organization";

interface TasksCatalogViewProps {
    groupedTasks: TasksByDivision[];
    orgId: string;
    units: Unit[];
    divisions: TaskDivision[];
    kinds?: TaskKind[];
    isAdminMode?: boolean;
}

export function TasksCatalogView({
    groupedTasks,
    orgId,
    units,
    divisions,
    kinds = [],
    isAdminMode = false
}: TasksCatalogViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [originFilter, setOriginFilter] = useState<OriginFilter>("all");

    // ========================================================================
    // Modal Handlers
    // ========================================================================

    const handleOpenTypeSelector = () => {
        openModal(
            <TaskTypeSelector
                onSelect={handleTypeSelected}
                onCancel={closeModal}
            />,
            {
                title: "Crear Nueva Tarea",
                description: "Elegí el tipo de tarea que querés crear",
                size: "lg"
            }
        );
    };

    const handleTypeSelected = (type: TaskCreationType) => {
        closeModal();

        if (type === "own") {
            // Open regular task form
            openModal(
                <TaskForm
                    mode="create"
                    organizationId={orgId}
                    units={units}
                    divisions={divisions}
                    isAdminMode={isAdminMode}
                    onCancel={closeModal}
                    onSuccess={() => {
                        closeModal();
                        router.refresh();
                    }}
                />,
                {
                    title: "Nueva Tarea Propia",
                    description: "Crear una tarea personalizada para tu organización",
                    size: "lg"
                }
            );
        } else {
            // Open parametric task wizard
            openModal(
                <ParametricTaskForm
                    divisions={divisions}
                    units={units}
                    kinds={kinds}
                    onCancel={closeModal}
                    onSuccess={() => {
                        closeModal();
                        router.refresh();
                    }}
                    onBack={handleOpenTypeSelector}
                />,
                {
                    title: "Nueva Tarea Paramétrica",
                    description: "Crear una tarea estandarizada para el catálogo global",
                    size: "lg"
                }
            );
        }
    };

    // For admin mode, go directly to parametric form (or show selector)
    const handleCreateTask = () => {
        if (isAdminMode && kinds.length > 0) {
            // Admin mode with kinds available: show selector
            handleOpenTypeSelector();
        } else if (isAdminMode) {
            // Admin mode but no kinds: use regular form
            openModal(
                <TaskForm
                    mode="create"
                    organizationId={orgId}
                    units={units}
                    divisions={divisions}
                    isAdminMode={isAdminMode}
                    onCancel={closeModal}
                    onSuccess={() => {
                        closeModal();
                        router.refresh();
                    }}
                />,
                {
                    title: "Nueva Tarea de Sistema",
                    description: "Crear una tarea del sistema disponible para todas las organizaciones",
                    size: "lg"
                }
            );
        } else {
            // Organization mode: show type selector
            handleOpenTypeSelector();
        }
    };

    return (
        <>
            <Toolbar
                portalToHeader={true}
                searchPlaceholder="Buscar tareas por nombre, código o descripción..."
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                leftActions={
                    <ToolbarTabs
                        value={originFilter}
                        onValueChange={(v) => setOriginFilter(v as OriginFilter)}
                        options={[
                            { label: "Todos", value: "all" },
                            { label: "Sistema", value: "system", icon: Monitor },
                            { label: "Propios", value: "organization", icon: Building2 },
                        ]}
                    />
                }
                actions={[{
                    label: "Nueva Tarea",
                    icon: Plus,
                    onClick: handleCreateTask,
                }]}
            />
            <TaskCatalog
                groupedTasks={groupedTasks}
                orgId={orgId}
                units={units}
                divisions={divisions}
                isAdminMode={isAdminMode}
                searchQuery={searchQuery}
                originFilter={originFilter}
            />
        </>
    );
}
