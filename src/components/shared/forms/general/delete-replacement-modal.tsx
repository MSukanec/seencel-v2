"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

interface Option {
    id: string;
    name: string;
}

interface DeleteReplacementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (replacementId: string | null, deleteChildren?: boolean) => Promise<void>;
    itemToDelete: Option | null;
    replacementOptions: Option[];
    entityLabel: string; // e.g., "tipo de proyecto"
    title?: string;
    description?: string;
    /** Show "Delete with children" option (for hierarchical items) */
    showDeleteWithChildren?: boolean;
    /** Label for children (e.g., "sub-rubros") */
    childrenLabel?: string;
}

export function DeleteReplacementModal({
    isOpen,
    onClose,
    onConfirm,
    itemToDelete,
    replacementOptions,
    entityLabel,
    title,
    description,
    showDeleteWithChildren = false,
    childrenLabel = "sub-elementos",
}: DeleteReplacementModalProps) {
    const [action, setAction] = useState<"delete" | "replace" | "delete-children">("delete");
    const [replacementId, setReplacementId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirm = async () => {
        if (action === "replace" && !replacementId) return;

        setIsProcessing(true);
        try {
            await onConfirm(
                action === "replace" ? replacementId : null,
                action === "delete-children"
            );
            onClose();
        } catch (error) {
            console.error("Error confirming delete/replace:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!itemToDelete) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        {title || `Eliminar ${entityLabel}`}
                    </DialogTitle>
                    <DialogDescription>
                        {description || `Estás a punto de eliminar "${itemToDelete.name}". ¿Qué deseas hacer con los elementos asociados?`}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <RadioGroup value={action} onValueChange={(v: string) => setAction(v as "delete" | "replace")}>
                        <div
                            className="flex items-start space-x-3 p-3 rounded-md border border-transparent hover:border-border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => setAction("delete")}
                        >
                            <RadioGroupItem value="delete" id="opt-delete" className="mt-1" />
                            <div className="space-y-1 pointe-events-none">
                                <Label htmlFor="opt-delete" className="font-semibold cursor-pointer pointer-events-none">
                                    Solo eliminar
                                </Label>
                                <p className="text-sm text-muted-foreground pointer-events-none">
                                    Los elementos asociados quedarán sin {entityLabel} asignado.
                                </p>
                            </div>
                        </div>

                        <div
                            className="flex items-start space-x-3 p-3 rounded-md border border-transparent hover:border-border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => setAction("replace")}
                        >
                            <RadioGroupItem value="replace" id="opt-replace" className="mt-1" />
                            <div className="space-y-1 flex-1">
                                <Label htmlFor="opt-replace" className="font-semibold cursor-pointer pointer-events-none">
                                    Reemplazar por otro existente
                                </Label>
                                <p className="text-sm text-muted-foreground mb-2 pointer-events-none">
                                    Reasigna todos los elementos a otro {entityLabel} antes de eliminar.
                                </p>

                                <div
                                    className={`transition-all duration-200 ${action === 'replace' ? 'opacity-100 h-auto mt-2' : 'opacity-50 pointer-events-none h-0 overflow-hidden'}`}
                                    onClick={(e) => e.stopPropagation()} // Allow clicking select without re-triggering parent
                                >
                                    <Select
                                        value={replacementId || ""}
                                        onValueChange={setReplacementId}
                                        disabled={action !== 'replace'}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={`Seleccionar ${entityLabel}...`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {replacementOptions.map(opt => (
                                                <SelectItem key={opt.id} value={opt.id}>
                                                    {opt.name}
                                                </SelectItem>
                                            ))}
                                            {replacementOptions.length === 0 && (
                                                <div className="p-2 text-sm text-muted-foreground text-center">
                                                    No hay otras opciones disponibles
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {showDeleteWithChildren && (
                            <div
                                className="flex items-start space-x-3 p-3 rounded-md border border-transparent hover:border-destructive/30 hover:bg-destructive/5 transition-colors cursor-pointer"
                                onClick={() => setAction("delete-children")}
                            >
                                <RadioGroupItem value="delete-children" id="opt-delete-children" className="mt-1" />
                                <div className="space-y-1">
                                    <Label htmlFor="opt-delete-children" className="font-semibold cursor-pointer pointer-events-none">
                                        Eliminar con {childrenLabel}
                                    </Label>
                                    <p className="text-sm text-muted-foreground pointer-events-none">
                                        Se eliminará este {entityLabel} y todos sus {childrenLabel} de forma permanente.
                                    </p>
                                </div>
                            </div>
                        )}
                    </RadioGroup>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isProcessing || (action === "replace" && !replacementId)}
                    >
                        {isProcessing
                            ? "Procesando..."
                            : action === "replace"
                                ? "Reemplazar y Eliminar"
                                : action === "delete-children"
                                    ? "Eliminar Todo"
                                    : "Eliminar"
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

