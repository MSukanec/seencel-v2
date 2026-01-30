"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Trash2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cleanupTestPurchase } from "../actions";

// Hardcoded test user - same as in actions.ts
const TEST_EMAIL = "matusukanec@gmail.com";
const TEST_ORG_ID = "0d5e28fe-8fe2-4fe4-9835-4fe21b4f2abb";

export function PurchaseCleanupTool() {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleConfirmedCleanup = async () => {
        setShowConfirm(false);
        setLoading(true);
        setResult(null);

        try {
            console.log("[PurchaseCleanupTool] Calling cleanupTestPurchase for:", TEST_EMAIL);
            const response = await cleanupTestPurchase(TEST_EMAIL);
            console.log("[PurchaseCleanupTool] Response:", response);
            setResult(response);
        } catch (error) {
            console.error("[PurchaseCleanupTool] Error:", error);
            setResult({ success: false, message: `Error de conexión: ${error instanceof Error ? error.message : "desconocido"}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-destructive" />
                        Resetear Usuario de Prueba
                    </CardTitle>
                    <CardDescription>
                        Limpia todos los datos de compra de <span className="font-medium text-foreground">{TEST_EMAIL}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Enrollments de cursos</p>
                        <p>• Suscripciones</p>
                        <p>• Pagos y transferencias</p>
                        <p>• Cupones usados</p>
                    </div>

                    <Button
                        variant="destructive"
                        onClick={() => setShowConfirm(true)}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Limpiando...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Resetear Datos de Compra
                            </>
                        )}
                    </Button>

                    {result && (
                        <Alert variant={result.success ? "default" : "destructive"}>
                            {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertTriangle className="h-4 w-4" />
                            )}
                            <AlertTitle>{result.success ? "¡Listo!" : "Error"}</AlertTitle>
                            <AlertDescription className="text-sm whitespace-pre-wrap">
                                {result.message}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            ¿Confirmar limpieza?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>Esto borrará <strong>TODOS</strong> los datos de compra de:</p>
                                <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                                    <p><strong>Email:</strong> {TEST_EMAIL}</p>
                                    <p><strong>Org ID:</strong> {TEST_ORG_ID}</p>
                                </div>
                                <p>Se eliminarán:</p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    <li>Enrollments de cursos</li>
                                    <li>Suscripciones de la organización</li>
                                    <li>Pagos y transferencias</li>
                                    <li>Preferencias de pago (MP, PayPal)</li>
                                    <li>Cupones usados</li>
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmedCleanup}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Sí, eliminar todo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
