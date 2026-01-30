"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cleanupTestPurchase } from "../actions";

// Hardcoded test user - same as in actions.ts
const TEST_EMAIL = "matusukanec@gmail.com";
const TEST_ORG_ID = "0d5e28fe-8fe2-4fe4-9835-4fe21b4f2abb";

export function PurchaseCleanupTool() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleCleanup = async () => {
        // Confirmación
        const confirmed = window.confirm(
            `⚠️ ATENCIÓN: Esto borrará TODOS los datos de compra del usuario de prueba:\n\n${TEST_EMAIL}\nOrg: ${TEST_ORG_ID}\n\n• Enrollments de cursos\n• Suscripciones\n• Pagos\n• Transferencias\n• Preferencias de pago\n• Cupones usados\n\n¿Estás seguro?`
        );

        if (!confirmed) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await cleanupTestPurchase(TEST_EMAIL);
            setResult(response);
        } catch {
            setResult({ success: false, message: "Error de conexión" });
        } finally {
            setLoading(false);
        }
    };

    return (
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
                    onClick={handleCleanup}
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
    );
}
