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
import { Trash2, AlertTriangle, CheckCircle2, Loader2, User } from "lucide-react";
import { cleanupTestPurchase } from "../actions";

interface PurchaseCleanupToolProps {
    userEmail: string | null;
    userId: string | null;
    orgId: string | null;
    orgName: string | null;
}

export function PurchaseCleanupTool({ userEmail, userId, orgId, orgName }: PurchaseCleanupToolProps) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const isDisabled = !userEmail || !orgId;

    const handleConfirmedCleanup = async () => {
        if (!userEmail || !orgId) return;

        setShowConfirm(false);
        setLoading(true);
        setResult(null);

        try {
            console.log("[PurchaseCleanupTool] Calling cleanupTestPurchase for:", userEmail, orgId);
            const response = await cleanupTestPurchase(userEmail, orgId);
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
                        {userEmail ? (
                            <>Limpia todos los datos de compra de <span className="font-medium text-foreground">{userEmail}</span></>
                        ) : (
                            <span className="text-muted-foreground italic">Selecciona un usuario arriba</span>
                        )}
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
                        disabled={loading || isDisabled}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Limpiando...
                            </>
                        ) : isDisabled ? (
                            <>
                                <User className="h-4 w-4 mr-2" />
                                Selecciona Usuario/Org
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
                                    <p><strong>Email:</strong> {userEmail}</p>
                                    <p><strong>Organización:</strong> {orgName || orgId}</p>
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
