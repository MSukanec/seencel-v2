"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, Loader2, Bug, Clock } from "lucide-react";
import { getSystemErrors, type SystemError } from "../actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function SystemErrorsViewer() {
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<SystemError[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchErrors = async () => {
        setLoading(true);
        setError(null);
        const result = await getSystemErrors(48); // Last 48 hours
        if (result.success && result.errors) {
            setErrors(result.errors);
        } else {
            setError(result.error || "Error desconocido");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchErrors();
    }, []);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'destructive';
            case 'warning': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bug className="h-5 w-5 text-destructive" />
                        <CardTitle>Errores del Sistema</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                    </Button>
                </div>
                <CardDescription>
                    Errores de pagos y funciones críticas (últimas 48h)
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-md">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}

                {!loading && !error && errors.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        ✅ Sin errores en las últimas 48 horas
                    </div>
                )}

                {!loading && errors.length > 0 && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {errors.map((err) => (
                            <div
                                key={err.id}
                                className="border rounded-lg p-3 space-y-2 bg-muted/30"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant={getSeverityColor(err.severity)}>
                                            {err.severity}
                                        </Badge>
                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                            {err.functionName}
                                        </code>
                                    </div>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(err.createdAt), { addSuffix: true, locale: es })}
                                    </span>
                                </div>

                                <p className="text-sm font-medium text-destructive">
                                    {err.message}
                                </p>

                                {err.context && Object.keys(err.context).length > 0 && (
                                    <details className="text-xs">
                                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                            Ver contexto ({Object.keys(err.context).length} campos)
                                        </summary>
                                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                            {JSON.stringify(err.context, null, 2)}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
