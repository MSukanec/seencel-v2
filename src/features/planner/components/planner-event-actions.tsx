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
    className?: string;
}

import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { useState } from "react";

export function PlannerEventActions({ event, onEdit, className }: PlannerEventActionsProps) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteCalendarEvent(event.id);
            toast.success("Evento eliminado correctamente");
            setDeleteOpen(false);
        } catch (error) {
            toast.error("Error al eliminar el evento");
            console.error(error);
        } finally {
            setIsDeleting(false);
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
                isDeleting={isDeleting}
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
