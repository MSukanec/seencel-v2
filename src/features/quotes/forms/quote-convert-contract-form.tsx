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
import { FileSignature, AlertTriangle } from "lucide-react";

interface QuoteConvertContractFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    contractValue: number;
    currencySymbol: string;
    isConverting: boolean;
}

export function QuoteConvertContractForm({
    open,
    onOpenChange,
    onConfirm,
    contractValue,
    currencySymbol,
    isConverting
}: QuoteConvertContractFormProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-xl">
                        <FileSignature className="h-5 w-5 text-primary" />
                        Confirmar Conversión a Contrato
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4 pt-2">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100">
                            <p className="font-medium">¿Estás seguro de convertir esta cotización en un Contrato?</p>
                        </div>

                        <div className="space-y-2 text-sm">
                            <p>Al realizar esta acción:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>El presupuesto pasará a ser un <strong>Contrato Vinculante</strong>.</li>
                                <li>Se habilitará la gestión de <strong>Adicionales (Change Orders)</strong>.</li>
                                <li>
                                    El valor actual de <strong>{currencySymbol} {contractValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong> se congelará como el "Valor Original del Contrato".
                                </li>
                                <li>Cualquier cambio futuro deberá gestionarse mediante Adicionales.</li>
                            </ul>
                        </div>

                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-sm font-medium pt-2">
                            <AlertTriangle className="h-4 w-4" />
                            Esta acción no se puede deshacer.
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isConverting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isConverting}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isConverting ? "Convirtiendo..." : "Sí, Convertir en Contrato"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
