"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cleanupTestPurchase } from "../actions";

export function PurchaseCleanupTool() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleCleanup = async () => {
        if (!email.trim()) {
            setResult({ success: false, message: "Ingresá un email" });
            return;
        }

        // Confirmación
        const confirmed = window.confirm(
            `⚠️ ATENCIÓN: Esto borrará TODOS los datos de compra del usuario:\n\n${email}\n\n• Enrollments de cursos\n• Suscripciones\n• Pagos\n• Transferencias\n• Preferencias de pago\n• Cupones usados\n\n¿Estás seguro?`
        );

        if (!confirmed) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await cleanupTestPurchase(email);
            setResult(response);
            if (response.success) {
                setEmail("");
            }
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
                    Cleanup de Compras de Prueba
                </CardTitle>
                <CardDescription>
                    Elimina todos los datos de compra de un usuario (enrollments, suscripciones, pagos, etc.)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email del usuario</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="test@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <Button
                    variant="destructive"
                    onClick={handleCleanup}
                    disabled={loading || !email.trim()}
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
                            Limpiar Datos de Compra
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
