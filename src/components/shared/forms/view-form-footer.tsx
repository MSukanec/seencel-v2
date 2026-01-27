"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface ViewFormFooterProps {
    /**
     * Handler for the Edit button
     */
    onEdit?: () => void;
    /**
     * Handler for the Close button
     */
    onClose: () => void;
    /**
     * Edit button label
     */
    editLabel?: string;
    /**
     * Close button label
     */
    closeLabel?: string;
    /**
     * Whether to show the edit button
     */
    showEdit?: boolean;
    /**
     * Additional className for the container
     */
    className?: string;
}

/**
 * Footer component for View modals
 * Shows "Editar" and "Cerrar" buttons in the standard sticky footer pattern
 */
export function ViewFormFooter({
    onEdit,
    onClose,
    editLabel = "Editar",
    closeLabel = "Cerrar",
    showEdit = true,
    className
}: ViewFormFooterProps) {
    return (
        <div
            data-slot="view-form-footer"
            className={cn(
                "flex-none p-3 border-t border-border bg-background",
                className
            )}
        >
            <div className={cn("grid gap-3", showEdit ? "grid-cols-4" : "grid-cols-1")}>
                {showEdit && onEdit && (
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onEdit}
                        className="w-full col-span-1"
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        {editLabel}
                    </Button>
                )}
                <Button
                    type="button"
                    onClick={onClose}
                    className={cn("w-full", showEdit ? "col-span-3" : "col-span-1")}
                >
                    {closeLabel}
                </Button>
            </div>
        </div>
    );
}
