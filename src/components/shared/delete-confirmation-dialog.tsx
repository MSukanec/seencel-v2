"use client";

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
import { Input } from "@/components/ui/input";
import { useState } from "react";

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
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled || isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? (deletingLabel || "Deleting...") : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

