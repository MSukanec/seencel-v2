"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Package, ShoppingCart, ChevronDown, ChevronRight } from "lucide-react";

import { MaterialRequirement } from "../types";

import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DataTable } from "@/components/shared/data-table";
import { createTextColumn, createProjectColumn } from "@/components/shared/data-table/columns";
import { ViewEmptyState } from "@/components/shared/empty-state";

import { useActiveProjectId } from "@/stores/layout-store";
import { usePanel } from "@/stores/panel-store";

import { Badge } from "@/components/ui/badge";

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
    providers?: any[];
    financialData?: any;
}

export function MaterialsRequirementsView({
    orgId,
    requirements,
    providers = [],
    financialData,
}: MaterialsRequirementsViewProps) {
    const activeProjectId = useActiveProjectId();
    const { openPanel } = usePanel();

    // Search state for Toolbar
    const [searchQuery, setSearchQuery] = useState("");

    // ========================================
    // FILTERING
    // ========================================
    const filteredRequirements = useMemo(() => {
        let items = requirements;

        // Project context filter
        if (activeProjectId) {
            items = items.filter(r => r.project_id === activeProjectId);
        }

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(r =>
                r.material_name?.toLowerCase().includes(q) ||
                r.category_name?.toLowerCase().includes(q) ||
                r.unit_name?.toLowerCase().includes(q) ||
                r.project_name?.toLowerCase().includes(q)
            );
        }

        return items;
    }, [requirements, activeProjectId, searchQuery]);



    // ========================================
    // COLUMNS
    // ========================================
    const columns = useMemo(() => {
        const cols: ColumnDef<MaterialRequirement>[] = [
            // Hidden column used by groupBy
            createTextColumn<MaterialRequirement>({
                accessorKey: "category_name",
                title: "Categoría",
                emptyValue: "Sin Categoría",
            }),
            createTextColumn<MaterialRequirement>({
                accessorKey: "material_name",
                title: "Material",
                truncate: 220,
            }),
            createTextColumn<MaterialRequirement>({
                accessorKey: "unit_name",
                title: "Unidad",
                muted: true,
                emptyValue: "Sin unidad",
            }),
            {
                accessorKey: "total_required",
                header: ({ column }) => (
                    <button
                        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Cant. Requerida
                    </button>
                ),
                cell: ({ row }) => {
                    const value = row.getValue("total_required") as number;
                    const unit = row.original.unit_name || "u";
                    return (
                        <div className="text-right">
                            <span className="font-semibold tabular-nums text-base">
                                {formatNumber(value)}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1.5">
                                {unit}
                            </span>
                        </div>
                    );
                },
                enableSorting: true,
            },
            createTextColumn<MaterialRequirement>({
                accessorKey: "task_count",
                title: "Tareas",
                customRender: (value) => {
                    const count = Number(value) || 0;
                    return (
                        <Badge variant="secondary" className="text-xs tabular-nums">
                            {count} {count === 1 ? "tarea" : "tareas"}
                        </Badge>
                    );
                },
            }),
            {
                accessorKey: "total_ordered",
                header: ({ column }) => (
                    <button
                        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Ordenado
                    </button>
                ),
                cell: ({ row }) => {
                    const value = row.getValue("total_ordered") as number;
                    const unit = row.original.unit_name || "u";
                    if (value === 0) {
                        return (
                            <div className="text-right text-muted-foreground text-sm">
                                —
                            </div>
                        );
                    }
                    return (
                        <div className="text-right">
                            <span className="font-semibold tabular-nums text-base">
                                {formatNumber(value)}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1.5">
                                {unit}
                            </span>
                        </div>
                    );
                },
                enableSorting: true,
            },
            {
                accessorKey: "coverage_status",
                header: () => (
                    <span className="text-xs font-medium text-muted-foreground">
                        Estado
                    </span>
                ),
                cell: ({ row }) => {
                    const status = row.getValue("coverage_status") as string;
                    const statusConfig: Record<string, { label: string; className: string }> = {
                        none: {
                            label: "Sin ordenar",
                            className: "bg-muted text-muted-foreground",
                        },
                        partial: {
                            label: "Parcial",
                            className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                        },
                        covered: {
                            label: "Cubierto",
                            className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        },
                    };
                    const config = statusConfig[status] || statusConfig.none;
                    return (
                        <Badge variant="secondary" className={`text-xs ${config.className}`}>
                            {config.label}
                        </Badge>
                    );
                },
                enableSorting: true,
            },
        ];

        // Show project column only when viewing org-wide (no project filter)
        if (!activeProjectId) {
            cols.splice(1, 0, createProjectColumn<MaterialRequirement>({
                accessorKey: "project_name",
                emptyValue: "Sin proyecto",
            }));
        }

        return cols;
    }, [activeProjectId]);

    // ========================================
    // ACTIONS
    // ========================================
    const handleCreatePO = () => {
        openPanel(
            'purchase-order-form',
            {
                organizationId: orgId,
                projectId: activeProjectId || undefined,
                providers,
                requirements: filteredRequirements,
            }
        );
    };

    // ========================================
    // RENDER
    // ========================================

    // Determine what data set has items (raw vs filtered)
    const hasAnyData = requirements.length > 0;
    const hasFilteredData = filteredRequirements.length > 0;

    return (
        <>
            {/* Toolbar — always present */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar materiales..."
                actions={hasAnyData ? [
                    {
                        label: "Crear Orden de Compra",
                        icon: ShoppingCart,
                        onClick: handleCreatePO,
                    },
                ] : []}
            />

            <ContentLayout variant="wide" className="pb-6">
                {/* Empty State: no data at all */}
                {!hasAnyData ? (
                    <ViewEmptyState
                        mode="empty"
                        icon={Package}
                        viewName="Necesidades de Materiales"
                        featureDescription="Las necesidades de materiales se calculan automáticamente a partir de las tareas de construcción y sus recetas de materiales. Creá tareas con recetas para ver los materiales requeridos."
                    />
                ) : !hasFilteredData ? (
                    /* No results from filters */
                    <ViewEmptyState
                        mode="no-results"
                        icon={Package}
                        viewName="necesidades de materiales"
                        filterContext={activeProjectId ? "en este proyecto" : "con esa búsqueda"}
                        onResetFilters={() => {
                            setSearchQuery("");
                        }}
                    />
                ) : (
                    <DataTable
                        columns={columns}
                        data={filteredRequirements}
                        enableRowSelection={false}
                        groupBy="category_name"
                        groupItemLabel={{ singular: "material", plural: "materiales" }}
                        renderGroupHeader={(groupValue, rows, isExpanded) => (
                            <div className="flex items-center gap-2">
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span className="font-semibold text-sm text-foreground">
                                    {groupValue}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({rows.length} {rows.length === 1 ? "material" : "materiales"})
                                </span>
                            </div>
                        )}
                        initialSorting={[{ id: "material_name", desc: false }]}
                    />
                )}
            </ContentLayout>
        </>
    );
}
