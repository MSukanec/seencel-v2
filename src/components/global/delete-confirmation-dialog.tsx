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
    confirmLabel?: string;
    cancelLabel?: string;
    isDeleting?: boolean;
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "¿Estás absolutamente seguro?",
    description,
    validationText,
    confirmLabel = "Eliminar",
    cancelLabel = "Cancelar",
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
                                        Escribe <span className="font-bold text-foreground">{validationText}</span> para confirmar:
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
                        {isDeleting ? "Eliminando..." : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
