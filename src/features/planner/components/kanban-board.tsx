
"use client";

import { KanbanBoard as KanbanBoardType, KanbanCard, KanbanLabel, KanbanList, KanbanMember } from "@/features/planner/types";
import { KanbanColumn } from "./kanban-column";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useModal } from "@/providers/modal-store";
import { KanbanCardForm } from "./kanban-card-form";
import { KanbanListForm } from "./kanban-list-form";
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
    searchQuery?: string;
    selectedPriorities?: string[];
    selectedLabels?: string[];
}

export function KanbanBoard({
    board,
    lists,
    labels,
    members,
    searchQuery = "",
    selectedPriorities = [],
    selectedLabels = []
}: KanbanBoardProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
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

    // Filter cards based on search, priorities, and labels
    const filterCards = (cards: KanbanCard[]) => {
        return cards.filter(card => {
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

    // Open card creation modal
    const handleAddCard = useCallback((listId: string) => {
        openModal(
            <KanbanCardForm
                boardId={board.id}
                listId={listId}
                members={members}
                onSuccess={closeModal}
            />,
            {
                title: "Nueva Tarjeta",
                description: "Crea una nueva tarjeta en este tablero",
                size: "md"
            }
        );
    }, [board.id, openModal, closeModal, members]);

    // Open list creation modal
    const handleAddList = useCallback(() => {
        openModal(
            <KanbanListForm
                boardId={board.id}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Nueva Columna",
                description: "Agrega una nueva columna al tablero",
                size: "sm"
            }
        );
    }, [board.id, openModal, closeModal, router]);

    // Open list edit modal
    const handleEditList = useCallback((list: KanbanList) => {
        openModal(
            <KanbanListForm
                boardId={board.id}
                initialData={list}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Editar Columna",
                description: `Modifica los detalles de ${list.name}`,
                size: "sm"
            }
        );
    }, [board.id, openModal, closeModal, router]);

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
                            try {
                                await deleteList(list.id);
                                toast.success("Columna eliminada");
                                closeModal();
                                router.refresh();
                            } catch (error) {
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
    }, [openModal, closeModal, router]);

    // Handle move list to another board
    const handleMoveList = useCallback((list: KanbanList) => {
        openModal(
            <MoveListModal
                listId={list.id}
                currentBoardId={board.id}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Mover columna",
                description: `Mover la columna "${list.name}" a otro tablero`,
                size: "sm"
            }
        );
    }, [board.id, openModal, closeModal, router]);

    // Open card edit modal
    const handleCardClick = useCallback((card: KanbanCard) => {
        openModal(
            <KanbanCardForm
                boardId={board.id}
                listId={card.list_id}
                initialData={card}
                members={members}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Editar Tarjeta",
                description: `Modifica los detalles de ${card.title}`,
                size: "md"
            }
        );
    }, [board.id, openModal, closeModal, router, members]);

    return (
        <div className="flex flex-col h-full">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <Droppable droppableId="board" type="list" direction="horizontal">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="flex h-full gap-4 p-4"
                            >
                                {/* Columns */}
                                {orderedLists.map((list, index) => (
                                    <Draggable key={list.id} draggableId={list.id} index={index}>
                                        {(provided, snapshot) => (
                                            <KanbanColumn
                                                innerRef={provided.innerRef}
                                                draggableProps={provided.draggableProps}
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
                                            />
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}

                                {/* Add Column Button (end of board) */}
                                <div className="shrink-0 w-[280px]">
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
                                        onClick={handleAddList}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar columna
                                    </Button>
                                </div>

                                {/* Empty State */}
                                {orderedLists.length === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                                        <div className="rounded-full bg-muted p-4 mb-4">
                                            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1">
                                            Tablero vacío
                                        </h3>
                                        <p className="text-muted-foreground text-sm mb-4 max-w-xs">
                                            Comienza agregando columnas para organizar tus tarjetas
                                        </p>
                                        <Button onClick={handleAddList}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Crear primera columna
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </Droppable>
                </div>
            </DragDropContext>
        </div>
    );
}

