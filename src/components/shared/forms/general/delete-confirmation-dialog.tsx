"use client";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description: React.ReactNode;
    /**
     * If provided, the user must type this text to enable the confirm button.
     * Useful for "Dangerous" deletions (e.g. Project Name).
     */
    validationText?: string;
    /**
     * Custom prompt for validation. Use {text} as placeholder for the validation text.
     * @default "Type {text} to confirm:"
     */
    validationPrompt?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /**
     * Label shown while deleting
     */
    deletingLabel?: string;
    isDeleting?: boolean;
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    validationText,
    validationPrompt = "Escribe {text} para confirmar:",
    confirmLabel = "Eliminar",
    cancelLabel = "Cancelar",
    deletingLabel = "Eliminando...",
    isDeleting = false
}: DeleteConfirmationDialogProps) {
    const [inputValue, setInputValue] = useState("");

    // Reset input when dialog opens/closes or when validation text changes (different item selected)
    useEffect(() => {
        setInputValue("");
    }, [open, validationText]);

    const isConfirmDisabled = validationText
        ? inputValue.trim() !== validationText.trim()
        : false;

    const handleConfirm = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isConfirmDisabled) {
            onConfirm();
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!isConfirmDisabled && !isDeleting) {
                        onConfirm();
                    }
                }}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4">
                            <div className="text-muted-foreground">
                                {description}
                            </div>
                            {validationText && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        {validationPrompt.split('{text}').map((part, i, arr) => (
                                            <span key={i}>
                                                {part}
                                                {i < arr.length - 1 && <span className="font-bold text-foreground">{validationText}</span>}
                                            </span>
                                        ))}
                                    </p>
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={validationText}
                                        className="border-destructive/50 focus-visible:ring-destructive"
                                        autoComplete="off"
                                    />
                                </div>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>{cancelLabel}</AlertDialogCancel>
                    <button
                        type="submit"
                        disabled={isConfirmDisabled || isDeleting}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 cursor-pointer"
                    >
                        {isDeleting ? (deletingLabel || "Deleting...") : confirmLabel}
                    </button>
                </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

