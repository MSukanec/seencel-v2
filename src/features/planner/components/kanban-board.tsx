
"use client";

import { KanbanBoard as KanbanBoardType, KanbanCard, KanbanLabel, KanbanList, KanbanMember } from "@/features/planner/types";
import { Project } from "@/types/project";
import { KanbanColumn } from "./kanban-column";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, Columns3 } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useState, useCallback, useEffect } from "react";
import { useModal } from "@/stores/modal-store";
import { useActiveProjectId } from "@/stores/layout-store";
import { KanbanCardForm } from "../forms/kanban-card-form";
import { KanbanListForm } from "../forms/kanban-list-form";
import { MoveListModal } from "./move-list-modal";
import { toast } from "sonner";
import { deleteList, reorderLists, moveCard, reorderCards } from "@/features/planner/actions";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { PRIORITY_CONFIG } from "@/features/planner/types";

interface KanbanBoardProps {
    board: KanbanBoardType;
    lists: KanbanList[];
    labels: KanbanLabel[];
    members: KanbanMember[];
    projects?: Project[];
    searchQuery?: string;
    selectedPriorities?: string[];
    selectedLabels?: string[];
    /** Whether the organization can invite members (Teams plan) */
    isTeamsEnabled?: boolean;
}

export function KanbanBoard({
    board,
    lists,
    labels,
    members,
    projects = [],
    searchQuery = "",
    selectedPriorities = [],
    selectedLabels = [],
    isTeamsEnabled = false
}: KanbanBoardProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const activeProjectId = useActiveProjectId();
    const [orderedLists, setOrderedLists] = useState(lists);

    useEffect(() => {
        setOrderedLists(lists);
    }, [lists]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, type } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Move List
        if (type === "list") {
            const items = Array.from(orderedLists);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);

            setOrderedLists(items);

            try {
                const listIds = items.map(l => l.id);
                await reorderLists(board.id, listIds);
            } catch (error) {
                toast.error("Error al reordenar columnas");
                setOrderedLists(lists);
            }
        }

        // Move Card
        if (type === "card") {
            const newOrderedLists = [...orderedLists];
            const sourceListIndex = newOrderedLists.findIndex(l => l.id === source.droppableId);
            const destListIndex = newOrderedLists.findIndex(l => l.id === destination.droppableId);

            if (sourceListIndex === -1 || destListIndex === -1) return;

            const sourceList = newOrderedLists[sourceListIndex];
            const destList = newOrderedLists[destListIndex];

            // Moving within the same list
            if (source.droppableId === destination.droppableId) {
                const newCards = Array.from(sourceList.cards || []);
                const [movedCard] = newCards.splice(source.index, 1);
                newCards.splice(destination.index, 0, movedCard);

                const newList = { ...sourceList, cards: newCards };
                newOrderedLists[sourceListIndex] = newList;
                setOrderedLists(newOrderedLists);

                try {
                    const cardIds = newCards.map(c => c.id);
                    await reorderCards(sourceList.id, cardIds);
                } catch (error) {
                    toast.error("Error al reordenar tarjeta");
                    setOrderedLists(lists);
                }
            }
            // Moving to a different list
            else {
                const sourceCards = Array.from(sourceList.cards || []);
                const [movedCard] = sourceCards.splice(source.index, 1);
                const destCards = Array.from(destList.cards || []);

                // Update the card's list_id
                const updatedCard = { ...movedCard, list_id: destList.id };
                destCards.splice(destination.index, 0, updatedCard);

                const newSourceList = { ...sourceList, cards: sourceCards };
                const newDestList = { ...destList, cards: destCards };

                newOrderedLists[sourceListIndex] = newSourceList;
                newOrderedLists[destListIndex] = newDestList;
                setOrderedLists(newOrderedLists);

                try {
                    await moveCard(movedCard.id, destList.id, destination.index);
                } catch (error) {
                    toast.error("Error al mover tarjeta");
                    setOrderedLists(lists);
                }
            }
        }
    };

    // Filter cards based on search, priorities, labels, and project context
    const filterCards = (cards: KanbanCard[]) => {
        return cards.filter(card => {
            // Project context filter
            if (activeProjectId && card.project_id && card.project_id !== activeProjectId) {
                return false;
            }

            // Text Search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = card.title.toLowerCase().includes(query);
                const matchesDesc = card.description?.toLowerCase().includes(query);
                if (!matchesTitle && !matchesDesc) return false;
            }

            // Priority Filter
            if (selectedPriorities.length > 0) {
                if (!selectedPriorities.includes(card.priority)) return false;
            }

            // Labels Filter
            if (selectedLabels.length > 0) {
                if (!card.labels || card.labels.length === 0) return false;
                // Check if card has AT LEAST ONE of the selected labels
                const hasLabel = card.labels.some(l => selectedLabels.includes(l.id));
                if (!hasLabel) return false;
            }

            return true;
        });
    };

    // Optimistic card management
    const addOptimisticCard = useCallback((tempCard: KanbanCard) => {
        setOrderedLists(prev => prev.map(list => {
            if (list.id === tempCard.list_id) {
                return { ...list, cards: [...(list.cards || []), tempCard] };
            }
            return list;
        }));
    }, []);

    const updateOptimisticCard = useCallback((updatedCard: KanbanCard) => {
        setOrderedLists(prev => prev.map(list => {
            if (list.id === updatedCard.list_id) {
                return {
                    ...list,
                    cards: (list.cards || []).map(c => c.id === updatedCard.id ? { ...c, ...updatedCard } : c)
                };
            }
            return list;
        }));
    }, []);

    // Open card creation modal
    const handleAddCard = useCallback((listId: string) => {
        openModal(
            <KanbanCardForm
                organizationId={board.organization_id}
                boardId={board.id}
                listId={listId}
                projectId={activeProjectId || board.project_id}
                projects={projects}
                members={members}
                isTeamsEnabled={isTeamsEnabled}
                onOptimisticCreate={addOptimisticCard}
                onRollback={() => setOrderedLists(lists)}
            />,
            {
                title: "Nueva Tarjeta",
                description: "Crea una nueva tarjeta en este panel",
                size: "md"
            }
        );
    }, [board.id, openModal, members, addOptimisticCard, lists]);

    // Optimistic list management
    const addOptimisticList = useCallback((tempList: KanbanList) => {
        setOrderedLists(prev => [...prev, tempList]);
    }, []);

    const updateOptimisticList = useCallback((updatedList: KanbanList) => {
        setOrderedLists(prev => prev.map(l => l.id === updatedList.id ? { ...l, ...updatedList } : l));
    }, []);

    const removeOptimisticList = useCallback((listId: string) => {
        setOrderedLists(prev => prev.filter(l => l.id !== listId));
    }, []);

    const replaceOptimisticList = useCallback((tempId: string, realList: KanbanList) => {
        setOrderedLists(prev => prev.map(l => l.id === tempId ? { ...realList, cards: l.cards || [] } : l));
    }, []);

    // Open list creation modal
    const handleAddList = useCallback(() => {
        openModal(
            <KanbanListForm
                boardId={board.id}
                organizationId={board.organization_id}
                onOptimisticCreate={addOptimisticList}
                onSuccess={(realList) => {
                    // Replace temp list with real one
                    setOrderedLists(prev => {
                        const tempIdx = prev.findIndex(l => l.id.startsWith('temp-'));
                        if (tempIdx >= 0) {
                            const updated = [...prev];
                            updated[tempIdx] = { ...realList, cards: [] };
                            return updated;
                        }
                        return prev;
                    });
                }}
            />,
            {
                title: "Nueva Columna",
                description: "Agrega una nueva columna al panel",
                size: "md"
            }
        );
    }, [board.id, openModal, addOptimisticList]);

    // Open list edit modal
    const handleEditList = useCallback((list: KanbanList) => {
        openModal(
            <KanbanListForm
                boardId={board.id}
                organizationId={board.organization_id}
                initialData={list}
                onOptimisticUpdate={updateOptimisticList}
                onRollback={(listId) => {
                    // Restore original list on error
                    setOrderedLists(lists);
                }}
            />,
            {
                title: "Editar Columna",
                description: `Modifica los detalles de ${list.name}`,
                size: "md"
            }
        );
    }, [board.id, openModal, lists, updateOptimisticList]);

    // Handle delete list
    const handleDeleteList = useCallback((list: KanbanList) => {
        openModal(
            <div className="flex flex-col gap-4">
                <p>¿Estás seguro de eliminar la columna <strong>{list.name}</strong>? Esta acción no se puede deshacer.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeModal}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={async () => {
                            // Optimistic delete
                            removeOptimisticList(list.id);
                            closeModal();

                            try {
                                await deleteList(list.id);
                                toast.success("Columna eliminada");
                            } catch (error) {
                                // Rollback on error
                                setOrderedLists(lists);
                                toast.error("Error al eliminar la columna");
                            }
                        }}
                    >
                        Eliminar
                    </Button>
                </div>
            </div>,
            {
                title: "Eliminar Columna",
                description: "Confirmación de eliminación"
            }
        );
    }, [openModal, closeModal, removeOptimisticList, lists]);

    // 🚀 OPTIMISTIC DELETE CARD: Remove card from UI instantly
    const handleOptimisticDeleteCard = useCallback((cardId: string) => {
        setOrderedLists(prev =>
            prev.map(list => ({
                ...list,
                cards: (list.cards || []).filter(c => c.id !== cardId)
            }))
        );
    }, []);

    // Handle move list to another board (optimistic: remove from current view)
    const handleMoveList = useCallback((list: KanbanList) => {
        openModal(
            <MoveListModal
                listId={list.id}
                currentBoardId={board.id}
                organizationId={board.organization_id}
                onSuccess={() => {
                    // Optimistic: remove list from current board
                    removeOptimisticList(list.id);
                    closeModal();
                }}
            />,
            {
                title: "Mover columna",
                description: `Mover la columna "${list.name}" a otro panel`,
                size: "md"
            }
        );
    }, [board.id, openModal, closeModal, removeOptimisticList]);

    // Open card edit modal
    const handleCardClick = useCallback((card: KanbanCard) => {
        openModal(
            <KanbanCardForm
                organizationId={board.organization_id}
                boardId={board.id}
                listId={card.list_id || ''}
                projectId={activeProjectId || board.project_id}
                projects={projects}
                initialData={card}
                members={members}
                isTeamsEnabled={isTeamsEnabled}
                onOptimisticUpdate={updateOptimisticCard}
                onRollback={() => setOrderedLists(lists)}
            />,
            {
                title: "Editar Tarjeta",
                description: `Modifica los detalles de ${card.title}`,
                size: "md"
            }
        );
    }, [board.id, openModal, members, updateOptimisticCard, lists]);

    return (
        <div className="flex flex-col h-full">
            {orderedLists.length === 0 ? (
                /* Empty State - No columns yet, centered */
                <div className="flex-1 flex items-center justify-center p-8">
                    <ViewEmptyState
                        mode="empty"
                        icon={Columns3}
                        viewName="Columnas"
                        featureDescription="Las columnas te permiten organizar tus tarjetas en diferentes estados o categorías. Creá columnas como 'Por hacer', 'En progreso' y 'Listo' para gestionar el flujo de trabajo de tu equipo."
                        onAction={handleAddList}
                        actionLabel="Crear primera columna"
                        docsPath="/docs/planificador/kanban"
                    />
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    {/* Mobile: Full-bleed snap carousel. Desktop: Normal horizontal scroll */}
                    <div className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar md:scrollbar-default">
                        <Droppable droppableId="board" type="list" direction="horizontal">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="flex h-full gap-3 md:gap-4 px-[10vw] md:px-8 py-4 snap-x snap-mandatory md:snap-none scroll-smooth"
                                >
                                    {/* Columns */}
                                    {orderedLists.map((list, index) => (
                                        <Draggable key={list.id} draggableId={list.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="shrink-0 w-[80vw] md:w-[320px] snap-center h-full"
                                                >
                                                    <KanbanColumn
                                                        draggableProps={{}}
                                                        dragHandleProps={provided.dragHandleProps}
                                                        isDragOver={snapshot.isDragging}
                                                        list={list}
                                                        cards={filterCards(list.cards || [])}
                                                        members={members}
                                                        onAddCard={() => handleAddCard(list.id)}
                                                        onCardClick={handleCardClick}
                                                        onEditList={() => handleEditList(list)}
                                                        onDeleteList={() => handleDeleteList(list)}
                                                        onMoveList={() => handleMoveList(list)}
                                                        onOptimisticDeleteCard={handleOptimisticDeleteCard}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {/* Add Column Button */}
                                    <div className="shrink-0 w-[80vw] md:w-[280px] snap-center">
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
                                            onClick={handleAddList}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Agregar columna
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    </div>
                </DragDropContext>
            )}
        </div>
    );
}

