"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Monitor, Building2, ClipboardList } from "lucide-react";

import { TasksByDivision, Unit, TaskDivision, TaskKind } from "@/features/tasks/types";
import { TaskCatalog } from "@/features/tasks/components/tasks-catalog";
import { TasksForm, TasksTypeSelector, TaskCreationType, TasksParametricForm } from "@/features/tasks/forms";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { EmptyState } from "@/components/ui/empty-state";
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
    const [originFilter, setOriginFilter] = useState<Set<string>>(new Set());

    // Flatten all tasks to count total
    const allTasks = useMemo(() => {
        return groupedTasks.flatMap(g => g.tasks);
    }, [groupedTasks]);

    // Calculate facet counts for origin filter
    const originFacets = useMemo(() => {
        const facets = new Map<string, number>();
        facets.set("system", allTasks.filter(t => t.is_system).length);
        facets.set("organization", allTasks.filter(t => !t.is_system).length);
        return facets;
    }, [allTasks]);

    // Convert Set filter to the legacy filter format for TaskCatalog
    const computedOriginFilter: OriginFilter = useMemo(() => {
        if (originFilter.size === 0) return "all";
        if (originFilter.size === 2) return "all"; // Both selected = all
        if (originFilter.has("system")) return "system";
        if (originFilter.has("organization")) return "organization";
        return "all";
    }, [originFilter]);

    // ========================================================================
    // Filter handlers
    // ========================================================================
    const handleOriginSelect = (value: string) => {
        const newSet = new Set(originFilter);
        if (newSet.has(value)) {
            newSet.delete(value);
        } else {
            newSet.add(value);
        }
        setOriginFilter(newSet);
    };

    const handleOriginClear = () => {
        setOriginFilter(new Set());
    };

    // ========================================================================
    // Modal Handlers
    // ========================================================================

    const handleOpenTypeSelector = () => {
        openModal(
            <TasksTypeSelector
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
                <TasksForm
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
                <TasksParametricForm
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
                <TasksForm
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

    // Origin filter options
    const originOptions = [
        { label: "Sistema", value: "system", icon: Monitor },
        { label: "Propios", value: "organization", icon: Building2 },
    ];

    // ========================================================================
    // EmptyState: early return pattern (SKILL compliance)
    // ========================================================================
    if (allTasks.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader={true}
                    leftActions={
                        <FacetedFilter
                            title="Origen"
                            options={originOptions}
                            selectedValues={originFilter}
                            onSelect={handleOriginSelect}
                            onClear={handleOriginClear}
                            facets={originFacets}
                        />
                    }
                    actions={[{
                        label: "Nueva Tarea",
                        icon: Plus,
                        onClick: handleCreateTask,
                    }]}
                />
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={ClipboardList}
                        title="No hay tareas"
                        description="Agregá tareas para comenzar a construir tu catálogo técnico."
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar
                portalToHeader={true}
                searchPlaceholder="Buscar tareas por nombre, código o descripción..."
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                leftActions={
                    <FacetedFilter
                        title="Origen"
                        options={originOptions}
                        selectedValues={originFilter}
                        onSelect={handleOriginSelect}
                        onClear={handleOriginClear}
                        facets={originFacets}
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
                originFilter={computedOriginFilter}
            />
        </>
    );
}
