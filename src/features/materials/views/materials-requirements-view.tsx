"use client";

import { useState, useMemo } from "react";
import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { Package, ClipboardList, Layers, AlertCircle, Boxes } from "lucide-react";
import { MaterialRequirement } from "../types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Simple number formatter for display
const formatNumber = (value: number): string => {
    return value.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};

interface MaterialsRequirementsViewProps {
    projectId?: string;
    orgId: string;
    requirements: MaterialRequirement[];
}

export function MaterialsRequirementsView({
    projectId,
    orgId,
    requirements
}: MaterialsRequirementsViewProps) {
    // Search state for Toolbar
    const [searchQuery, setSearchQuery] = useState("");

    // Filter requirements by search
    const filteredRequirements = useMemo(() => {
        if (!searchQuery) return requirements;
        return requirements.filter(r =>
            r.material_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.unit_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [requirements, searchQuery]);

    // Calculate summary stats (from filtered)
    const totalMaterials = filteredRequirements.length;
    const totalTasks = new Set(filteredRequirements.flatMap(r => r.construction_task_ids)).size;
    const categoriesUsed = new Set(filteredRequirements.map(r => r.category_name).filter(Boolean)).size;

    // Group requirements by category for better organization
    const groupedByCategory = useMemo(() => {
        const groups: Record<string, MaterialRequirement[]> = {};
        filteredRequirements.forEach(req => {
            const category = req.category_name || "Sin Categoría";
            if (!groups[category]) groups[category] = [];
            groups[category].push(req);
        });
        return groups;
    }, [filteredRequirements]);

    return (
        <>
            {/* Toolbar with portal to header */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar materiales..."
            />

            <ContentLayout variant="wide" className="pb-6">
                {/* Empty State - sin botón, esta vista es read-only */}
                {(!requirements || requirements.length === 0) ? (
                    <ViewEmptyState
                        mode="empty"
                        icon={Package}
                        viewName="Necesidades de Materiales"
                        featureDescription="Las necesidades de materiales aparecerán cuando tengas tareas de construcción con recetas de materiales asignadas."
                    />
                ) : (
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <DashboardKpiCard
                                title="Materiales Requeridos"
                                value={totalMaterials.toString()}
                                icon={<Boxes className="h-5 w-5" />}
                                iconClassName="bg-primary/10 text-primary"
                            />
                            <DashboardKpiCard
                                title="Tareas Origen"
                                value={totalTasks.toString()}
                                icon={<ClipboardList className="h-5 w-5" />}
                                iconClassName="bg-blue-500/10 text-blue-600"
                            />
                            <DashboardKpiCard
                                title="Categorías"
                                value={categoriesUsed.toString()}
                                icon={<Layers className="h-5 w-5" />}
                                iconClassName="bg-violet-500/10 text-violet-600"
                                className="col-span-2 lg:col-span-1"
                            />
                        </div>

                        {/* Materials Grid - Grouped by Category */}
                        {Object.entries(groupedByCategory).map(([category, materials]) => (
                            <div key={category} className="space-y-3">
                                {/* Category Header */}
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs font-medium">
                                        {category}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {materials.length} material{materials.length !== 1 ? 'es' : ''}
                                    </span>
                                </div>

                                {/* Materials Cards - Single Column */}
                                <div className="flex flex-col gap-2">
                                    {materials.map((req) => (
                                        <Card
                                            key={req.material_id}
                                            className="group hover:shadow-md transition-all duration-200 hover:border-primary/30"
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    {/* Left: Material Info */}
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        {/* Material Icon */}
                                                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                                            <Package className="h-5 w-5" />
                                                        </div>

                                                        {/* Material Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                                                                {req.material_name}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {req.unit_name || "Sin unidad"}
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {req.task_count} tarea{req.task_count !== 1 ? 's' : ''} de origen
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right: Quantity */}
                                                    <div className="text-right shrink-0">
                                                        <p className="text-3xl font-bold tabular-nums text-primary">
                                                            {formatNumber(req.total_required)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground font-medium">
                                                            {req.unit_name || "unidades"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}

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
                )}
            </ContentLayout>
        </>
    );
}
