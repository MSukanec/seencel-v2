"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Types ───────────────────────────────────────────────
interface UseTableActionsOptions<T> {
    /** 
     * The delete function. Receives the item and returns { success: boolean }.
     * Called for each item in single and bulk delete.
     */
    onDelete: (item: T) => Promise<{ success: boolean }>;
    /** Entity name in singular for toast messages (e.g., "movimiento", "material") */
    entityName: string;
    /** Entity name in plural for toast messages (e.g., "movimientos", "materiales") */
    entityNamePlural?: string;
    /** Custom success message override */
    successMessage?: string;
    /** Custom error message override */
    errorMessage?: string;
    /** Whether to refresh the router after successful delete (default: true) */
    refreshAfterDelete?: boolean;
}

interface UseTableActionsReturn<T> {
    /** Opens the delete confirmation dialog for a single item */
    handleDelete: (item: T) => void;
    /** Opens the delete confirmation dialog for multiple items (bulk) */
    handleBulkDelete: (items: T[], resetSelection: () => void) => void;
    /** Whether a delete operation is in progress */
    isDeleting: boolean;
    /** The confirmation dialog component — render this at the bottom of your JSX */
    DeleteConfirmDialog: React.FC;
}

// ─── Hook ────────────────────────────────────────────────
export function useTableActions<T>(
    options: UseTableActionsOptions<T>
): UseTableActionsReturn<T> {
    const {
        onDelete,
        entityName,
        entityNamePlural,
        refreshAfterDelete = true,
    } = options;

    const plural = entityNamePlural || `${entityName}s`;
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState<T[]>([]);
    const [resetSelectionFn, setResetSelectionFn] = useState<(() => void) | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    const handleDelete = useCallback((item: T) => {
        setItemsToDelete([item]);
        setResetSelectionFn(null);
        setIsOpen(true);
    }, []);

    const handleBulkDelete = useCallback((items: T[], resetSelection: () => void) => {
        setItemsToDelete(items);
        setResetSelectionFn(() => resetSelection);
        setIsOpen(true);
    }, []);

    const confirmDelete = useCallback(() => {
        if (itemsToDelete.length === 0) return;

        startDeleteTransition(async () => {
            try {
                let successCount = 0;
                let failCount = 0;

                for (const item of itemsToDelete) {
                    const result = await onDelete(item);
                    if (result.success) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                }

                if (failCount === 0) {
                    toast.success(
                        itemsToDelete.length === 1
                            ? `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} eliminado`
                            : `${successCount} ${plural} eliminados`
                    );
                } else {
                    toast.warning(`${successCount} eliminados, ${failCount} con error`);
                }

                setIsOpen(false);
                setItemsToDelete([]);
                resetSelectionFn?.();
                if (refreshAfterDelete) router.refresh();
            } catch (error) {
                console.error(error);
                toast.error(options.errorMessage || `Error al eliminar ${entityName}`);
            }
        });
    }, [itemsToDelete, onDelete, entityName, plural, resetSelectionFn, refreshAfterDelete, router, options.errorMessage]);

    // ─── Dialog Component ────────────────────────────────
    const DeleteConfirmDialog: React.FC = useCallback(() => {
        const isSingle = itemsToDelete.length === 1;
        return (
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isSingle
                                ? `¿Eliminar ${entityName}?`
                                : `¿Eliminar ${itemsToDelete.length} ${plural}?`
                            }
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isSingle
                                ? `Esta acción no se puede deshacer. Se eliminará el ${entityName}.`
                                : `Esta acción no se puede deshacer. Se eliminarán ${itemsToDelete.length} ${plural}.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting
                                ? "Eliminando..."
                                : isSingle
                                    ? "Eliminar"
                                    : `Eliminar ${itemsToDelete.length}`
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }, [isOpen, itemsToDelete, isDeleting, entityName, plural, confirmDelete]);

    return {
        handleDelete,
        handleBulkDelete,
        isDeleting,
        DeleteConfirmDialog,
    };
}
