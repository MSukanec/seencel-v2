"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { KanbanBoard, PRIORITY_CONFIG } from "@/features/planner/types";
import { Project } from "@/types/project";
import { useLayoutStore } from "@/stores/layout-store";
import { KanbanBoard as KanbanBoardComponent } from "@/features/planner/components/kanban-board";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Search, Filter, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useModal } from "@/stores/modal-store";
import { KanbanBoardForm } from "@/features/planner/forms/kanban-board-form";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteBoard } from "@/features/planner/actions";
import { toast } from "sonner";

interface KanbanDashboardProps {
    boards: KanbanBoard[];
    activeBoardId: string | null;
    activeBoardData: any | null; // Full board data with lists/cards
    organizationId: string;
    projectId?: string | null;
    projects?: Project[];
    /** Base URL for navigation (e.g., "/organization/kanban" or "/project/123/kanban") */
    baseUrl: string;
    /** Max boards allowed by plan (-1 = unlimited) */
    maxBoards?: number;
}

export function KanbanDashboard({
    boards: initialBoards,
    activeBoardId,
    activeBoardData,
    organizationId,
    projectId,
    projects = [],
    baseUrl,
    maxBoards = -1
}: KanbanDashboardProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const { actions } = useLayoutStore();
    const [isSwitching, setIsSwitching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const debouncedSetSearch = useCallback((value: string) => {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => setSearchQuery(value), 300);
    }, []);
    // Optimistic state for boards
    const [optimisticBoards, setOptimisticBoards] = useState(initialBoards);

    // Set active context to organization
    useEffect(() => {
        actions.setActiveContext('organization');
    }, [actions]);

    // Sync loading state with board switching
    useEffect(() => {
        setIsSwitching(false);
    }, [activeBoardId]);

    // Sync optimistic boards when prop changes (navigation, etc)
    useEffect(() => {
        setOptimisticBoards(initialBoards);
    }, [initialBoards]);

    // Plan limits
    const isUnlimited = maxBoards === -1;
    const canCreateBoard = isUnlimited || optimisticBoards.length < maxBoards;

    const handleBoardSwitch = (boardId: string) => {
        if (boardId === activeBoardId) return;
        setIsSwitching(true);
        router.push(`${baseUrl}?boardId=${boardId}`);
    };

    const handleCreateBoard = () => {
        openModal(
            <KanbanBoardForm
                organizationId={organizationId}
                onSuccess={(newBoard: KanbanBoard) => {
                    closeModal();
                    router.push(`${baseUrl}?boardId=${newBoard.id}`);
                }}
            />,
            {
                title: "Nuevo Panel",
                description: "Crea un nuevo panel para organizar tus tareas",
                size: "md"
            }
        );
    };

    const handleChangeBoard = (board: KanbanBoard) => {
        openModal(
            <KanbanBoardForm
                organizationId={organizationId}
                initialData={board}
                onSuccess={(updatedBoard: KanbanBoard) => {
                    // Optimistic update
                    setOptimisticBoards(prev => prev.map(b => b.id === board.id ? { ...b, ...updatedBoard } : b));
                    closeModal();
                }}
            />,
            {
                title: "Editar Panel",
                description: `Modifica los detalles de ${board.name}`,
                size: "md"
            }
        );
    };

    const handleDeleteBoard = (boardId: string) => {
        openModal(
            <div className="flex flex-col gap-4">
                <p>¿Estás seguro de eliminar este tablero? Esta acción también eliminará todas las listas y tarjetas asociadas.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeModal}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={async () => {
                            // Optimistic delete
                            const remaining = optimisticBoards.filter(b => b.id !== boardId);
                            setOptimisticBoards(remaining);
                            closeModal();

                            try {
                                await deleteBoard(boardId);
                                toast.success("Panel eliminado");

                                if (remaining.length > 0) {
                                    router.push(`${baseUrl}?boardId=${remaining[0].id}`);
                                } else {
                                    router.push(`${baseUrl}`);
                                }
                            } catch (error) {
                                // Rollback on error
                                setOptimisticBoards(initialBoards);
                                toast.error("Error al eliminar el tablero");
                            }
                        }}
                    >
                        Eliminar
                    </Button>
                </div>
            </div>,
            {
                title: "Eliminar Panel",
                description: "Esta acción no se puede deshacer."
            }
        );
    };

    const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
    const [selectedPriorities, setSelectedPriorities] = useState<Set<string>>(new Set());

    const handleLabelSelect = (value: string) => {
        const next = new Set(selectedLabels);
        if (next.has(value)) {
            next.delete(value);
        } else {
            next.add(value);
        }
        setSelectedLabels(next);
    };

    const handlePrioritySelect = (value: string) => {
        const next = new Set(selectedPriorities);
        if (next.has(value)) {
            next.delete(value);
        } else {
            next.add(value);
        }
        setSelectedPriorities(next);
    };

    // ... EMPTY STATE ...

    // Mock labels for demonstration - in real app pass these via props
    const labelOptions = activeBoardData?.labels?.map((l: any) => ({
        label: l.name,
        value: l.id,
        // You might want to add color/icon support to FacetedFilter if it supports it
    })) || [];

    const priorityOptions = Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
        label: config.label,
        value: key,
    }));

    return (
        <div className="flex flex-col h-full">
            {/* UNIFIED TOOLBAR - Portaled to Header */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={debouncedSetSearch}
                searchPlaceholder="Buscar tarjetas..."
                leftActions={
                    <div className="flex items-center gap-1">
                        {optimisticBoards.map((board) => (
                            <div key={board.id} className="group relative flex items-center">
                                <button
                                    onClick={() => handleBoardSwitch(board.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap border pr-7",
                                        activeBoardId === board.id
                                            ? "bg-background border-border shadow-sm text-foreground ring-1 ring-primary/20"
                                            : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                    )}
                                >
                                    {board.color && (
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: board.color }} />
                                    )}
                                    {board.name}
                                </button>

                                {/* Hover Actions Menu */}
                                <div className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted">
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem onClick={() => handleChangeBoard(board)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteBoard(board.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                }
                filterContent={
                    <div className="flex items-center gap-2">
                        <FacetedFilter
                            title="Prioridad"
                            options={priorityOptions}
                            selectedValues={selectedPriorities}
                            onSelect={handlePrioritySelect}
                            onClear={() => setSelectedPriorities(new Set())}
                        />
                        <FacetedFilter
                            title="Etiquetas"
                            options={labelOptions}
                            selectedValues={selectedLabels}
                            onSelect={handleLabelSelect}
                            onClear={() => setSelectedLabels(new Set())}
                        />
                    </div>
                }
                actions={[{
                    label: "Nuevo Panel",
                    icon: Plus,
                    onClick: handleCreateBoard,
                    featureGuard: {
                        isEnabled: canCreateBoard,
                        featureName: "Crear más paneles",
                        requiredPlan: "PRO",
                        customMessage: `Has alcanzado el límite de ${maxBoards} panel${maxBoards !== 1 ? 'es' : ''} de tu plan actual (${optimisticBoards.length}/${maxBoards}). Actualiza a PRO para crear paneles ilimitados.`
                    }
                }]}
            />

            {/* BOARD CONTENT */}
            <div className="flex-1 overflow-hidden relative">
                {isSwitching ? (
                    <div className="flex items-center justify-center h-full w-full absolute inset-0 bg-background/50 backdrop-blur-sm z-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : null}

                {initialBoards.length === 0 ? (
                    // Empty State - No boards exist
                    <div className="h-full flex items-center justify-center p-8">
                        <ViewEmptyState
                            mode="empty"
                            icon={LayoutDashboard}
                            viewName="Panel de Tareas"
                            featureDescription="El panel de tareas es tu espacio para organizar ideas, pendientes y cosas por hacer. Creá columnas que representen estados (por hacer, en progreso, listo) y arrastrá tarjetas entre ellas. Podés asignar responsables, definir fechas límite y prioridades para coordinar el trabajo con tu equipo de forma visual."
                            onAction={handleCreateBoard}
                            actionLabel="Nuevo Panel"
                            docsPath="/docs/agenda/kanban"
                        />
                    </div>
                ) : activeBoardData ? (
                    <KanbanBoardComponent
                        board={activeBoardData.board}
                        lists={activeBoardData.lists}
                        labels={activeBoardData.labels}
                        members={activeBoardData.members || []}
                        projects={projects}
                        searchQuery={searchQuery}
                        selectedPriorities={Array.from(selectedPriorities)}
                        selectedLabels={Array.from(selectedLabels)}
                    />
                ) : (
                    // Loading skeletons for board content
                    <div className="p-8 space-y-4">
                        <div className="flex gap-4">
                            <Skeleton className="h-[500px] w-80 rounded-xl" />
                            <Skeleton className="h-[500px] w-80 rounded-xl" />
                            <Skeleton className="h-[500px] w-80 rounded-xl" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

