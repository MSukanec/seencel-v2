"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskElement } from "../types";

// ============================================================================
// Types
// ============================================================================

interface ElementGeneralViewProps {
    element: TaskElement;
}

// ============================================================================
// Component
// ============================================================================

export function ElementGeneralView({ element }: ElementGeneralViewProps) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Información del Elemento</CardTitle>
                    <CardDescription>
                        Datos generales del elemento constructivo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-muted-foreground">Nombre</span>
                            <p className="font-medium">{element.name}</p>
                        </div>
                        {element.code && (
                            <div>
                                <span className="text-sm text-muted-foreground">Código</span>
                                <p>
                                    <Badge variant="outline" className="font-mono">
                                        {element.code}
                                    </Badge>
                                </p>
                            </div>
                        )}
                        {element.description && (
                            <div className="col-span-2">
                                <span className="text-sm text-muted-foreground">Descripción</span>
                                <p className="text-muted-foreground">{element.description}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
