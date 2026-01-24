"use client";

import { TasksByDivision, Unit, TaskDivision } from "@/features/tasks/types";
import { TaskCatalog } from "@/features/tasks/components/catalog/task-catalog";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Plus } from "lucide-react";
import { useModal } from "@/providers/modal-store";
import { TaskForm } from "@/features/tasks/components/forms/task-form";
import { useRouter } from "next/navigation";

interface TasksCatalogViewProps {
    groupedTasks: TasksByDivision[];
    orgId: string;
    units: Unit[];
    divisions: TaskDivision[];
    isAdminMode?: boolean;
}

export function TasksCatalogView({
    groupedTasks,
    orgId,
    units,
    divisions,
    isAdminMode = false
}: TasksCatalogViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();

    const handleCreateTask = () => {
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
                title: isAdminMode ? "Nueva Tarea de Sistema" : "Nueva Tarea",
                description: isAdminMode
                    ? "Crear una tarea del sistema disponible para todas las organizaciones"
                    : "Agregar una tarea personalizada al catálogo de tu organización",
                size: "lg"
            }
        );
    };

    return (
        <>
            <Toolbar
                portalToHeader={true}
                searchPlaceholder="Buscar tareas por nombre, código o descripción..."
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
                showHeader={false}
            />
        </>
    );
}
