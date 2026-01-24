"use client";

import { ContentLayout } from "@/components/layout";
import { EmptyState } from "@/components/ui/empty-state";
import { Package, ClipboardList, AlertCircle } from "lucide-react";
import { MaterialRequirement } from "../types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Simple number formatter for display
const formatNumber = (value: number): string => {
    return value.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};

interface MaterialsRequirementsViewProps {
    projectId: string;
    orgId: string;
    requirements: MaterialRequirement[];
}

export function MaterialsRequirementsView({
    projectId,
    orgId,
    requirements
}: MaterialsRequirementsViewProps) {
    // If no requirements, show empty state
    if (!requirements || requirements.length === 0) {
        return (
            <ContentLayout variant="wide" className="pb-6">
                <EmptyState
                    icon={Package}
                    title="Sin Necesidades de Materiales"
                    description="Las necesidades de materiales aparecerán cuando tengas tareas de construcción con recetas de materiales asignadas."
                />
            </ContentLayout>
        );
    }

    // Calculate summary stats
    const totalMaterials = requirements.length;
    const totalTasks = new Set(requirements.flatMap(r => r.construction_task_ids)).size;
    const categoriesUsed = new Set(requirements.map(r => r.category_name).filter(Boolean)).size;

    return (
        <ContentLayout variant="wide" className="pb-6">
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Materiales Requeridos</CardDescription>
                            <CardTitle className="text-2xl">{totalMaterials}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Tareas Origen</CardDescription>
                            <CardTitle className="text-2xl">{totalTasks}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Categorías</CardDescription>
                            <CardTitle className="text-2xl">{categoriesUsed}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Requirements Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Lista de Necesidades
                        </CardTitle>
                        <CardDescription>
                            Materiales calculados desde las tareas de construcción activas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Material</TableHead>
                                    <TableHead>Unidad</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-right">Necesitado</TableHead>
                                    <TableHead className="text-center">Tareas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requirements.map((req) => (
                                    <TableRow key={req.material_id}>
                                        <TableCell className="font-medium">
                                            {req.material_name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {req.unit_name || "—"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {req.category_name ? (
                                                <Badge variant="secondary">
                                                    {req.category_name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold tabular-nums">
                                            {formatNumber(req.total_required)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline">
                                                {req.task_count}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Info Alert */}
                <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">¿Cómo se calcula?</p>
                        <p>
                            Cantidad Necesitada = Σ (Cantidad de Tarea × Materiales por Unidad de Tarea)
                        </p>
                        <p className="mt-1">
                            Ejemplo: 100 m² de mampostería × 10 ladrillos/m² = 1,000 ladrillos
                        </p>
                    </div>
                </div>
            </div>
        </ContentLayout>
    );
}
