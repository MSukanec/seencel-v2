"use client";

import { KanbanBoard } from "@/features/kanban/types";
import { KanbanBoardSelector } from "@/features/kanban/components/kanban-board-selector";
import { KanbanBoardForm } from "@/features/kanban/components/kanban-board-form";
import { useModal } from "@/providers/modal-store";
import { useCallback } from "react";

interface KanbanBoardSelectorWrapperProps {
    boards: KanbanBoard[];
    organizationId: string;
}

export function KanbanBoardSelectorWrapper({ boards, organizationId }: KanbanBoardSelectorWrapperProps) {
    const { openModal, closeModal } = useModal();

    const handleCreateBoard = useCallback(() => {
        openModal(
            <KanbanBoardForm
                organizationId={organizationId}
                onSuccess={closeModal}
            />,
            {
                title: "Nuevo Tablero",
                description: "Crea un nuevo tablero para organizar tus tareas",
                size: "md"
            }
        );
    }, [organizationId, openModal, closeModal]);

    return (
        <KanbanBoardSelector
            boards={boards}
            onCreateBoard={handleCreateBoard}
        />
    );
}
