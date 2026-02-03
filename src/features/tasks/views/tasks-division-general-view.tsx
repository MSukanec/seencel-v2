"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskDivision } from "../types";

// ============================================================================
// Types
// ============================================================================

interface DivisionGeneralViewProps {
    division: TaskDivision;
}

// ============================================================================
// Component
// ============================================================================

export function TasksDivisionGeneralView({ division }: DivisionGeneralViewProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    {division.name}
                    {(division as any).code && (
                        <Badge variant="outline" className="font-mono">
                            {(division as any).code}
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Información general del rubro
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-muted-foreground">Código</label>
                        <p className="font-mono">{(division as any).code || "—"}</p>
                    </div>
                    <div>
                        <label className="text-sm text-muted-foreground">Orden</label>
                        <p>{division.order ?? "—"}</p>
                    </div>
                </div>
                {division.description && (
                    <div>
                        <label className="text-sm text-muted-foreground">Descripción</label>
                        <p className="text-foreground">{division.description}</p>
                    </div>
                )}
                {division.parent_id && (
                    <div>
                        <label className="text-sm text-muted-foreground">Rubro padre</label>
                        <p className="text-muted-foreground text-sm">Este rubro es un sub-rubro.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
