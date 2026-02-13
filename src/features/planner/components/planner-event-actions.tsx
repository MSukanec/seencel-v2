"use client";

import * as React from "react";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/features/planner/types";
import { deleteCalendarEvent } from "@/features/planner/actions";

interface PlannerEventActionsProps {
    event: CalendarEvent;
    onEdit: () => void;
    /** Optimistic delete callback — removes event from parent list instantly */
    onOptimisticDelete?: (eventId: string) => void;
    className?: string;
}

import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { useState } from "react";

export function PlannerEventActions({ event, onEdit, onOptimisticDelete, className }: PlannerEventActionsProps) {
    const [deleteOpen, setDeleteOpen] = useState(false);

    const handleDelete = async () => {
        // Optimistic: remove from UI immediately
        setDeleteOpen(false);
        onOptimisticDelete?.(event.id);

        try {
            await deleteCalendarEvent(event.id);
            toast.success("Evento eliminado correctamente");
        } catch (error) {
            toast.error("Error al eliminar el evento");
            console.error(error);
            // Parent will rollback via revalidation
        }
    };

    return (
        <>
            <DeleteConfirmationDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={handleDelete}
                title="¿Eliminar evento?"
                description="Esta acción eliminará el evento del calendario. ¿Estás seguro?"
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className={className}>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteOpen(true);
                        }}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
