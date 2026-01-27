"use client";

import { useEffect, useState } from "react";
import type { BlockConfig } from "../../views/reports-builder-view";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { fetchReportData, type FetchReportDataResult } from "../../lib/data-fetchers";
import { type ColumnDefinition } from "../../lib/data-source-registry";

interface TableBlockProps {
    config: BlockConfig;
    organizationId: string;
    projects: { id: string; name: string; status: string }[];
}

export function TableBlock({ config, organizationId, projects }: TableBlockProps) {
    const { title, dataSourceId, dataTableId, dataFilters } = config;
    const projectId = dataFilters?.projectId; // Get projectId from filters

    // State for fetched data
    const [data, setData] = useState<Record<string, any>[]>([]);
    const [columns, setColumns] = useState<ColumnDefinition[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch data when config changes
    useEffect(() => {
        async function loadData() {
            // Only fetch if we have required config
            if (!projectId || !dataSourceId || !dataTableId) {
                setData([]);
                setColumns([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const result: FetchReportDataResult = await fetchReportData({
                    sourceId: dataSourceId,
                    tableId: dataTableId,
                    projectId,
                    filters: dataFilters || {},
                });

                if (result.error) {
                    setError(result.error);
                } else {
                    setData(result.data);
                    setColumns(result.columns);
                }
            } catch (e) {
                console.error("Error fetching table data:", e);
                setError("Error al cargar datos");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [projectId, dataSourceId, dataTableId, JSON.stringify(dataFilters)]);

    // Format cell value based on column type
    const formatValue = (row: Record<string, any>, col: ColumnDefinition): string => {
        const value = row[col.key];
        if (value === null || value === undefined) return "—";

        switch (col.type) {
            case "date":
                return new Date(value).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
            case "currency":
                const symbol = row.currency_symbol || "$";
                return `${symbol} ${Number(value).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`;
            case "number":
                return Number(value).toLocaleString("es-AR");
            default:
                return String(value);
        }
    };

    // Empty state: no data source configured
    if (!dataSourceId || !dataTableId) {
        return (
            <div className="space-y-3">
                {title && <h4 className="font-semibold text-sm">{title}</h4>}
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                    <p className="text-sm">Configurá la fuente de datos</p>
                    <p className="text-xs mt-1">Seleccioná una fuente y tabla en el panel de configuración</p>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="space-y-3">
                {title && <h4 className="font-semibold text-sm">{title}</h4>}
                <div className="border rounded-lg overflow-hidden">
                    <div className="p-4 space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-3">
                {title && <h4 className="font-semibold text-sm">{title}</h4>}
                <div className="border border-destructive/30 rounded-lg p-4 text-center">
                    <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            </div>
        );
    }

    // Empty data state
    if (data.length === 0) {
        return (
            <div className="space-y-3">
                {title && <h4 className="font-semibold text-sm">{title}</h4>}
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                    <p className="text-sm">No hay datos</p>
                    <p className="text-xs mt-1">No se encontraron registros con los filtros seleccionados</p>
                </div>
            </div>
        );
    }

    // Data table
    return (
        <div className="space-y-3">
            {title && <h4 className="font-semibold text-sm">{title}</h4>}

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            {columns.map((col) => (
                                <TableHead
                                    key={col.key}
                                    className={`text-xs font-semibold ${col.type === "currency" || col.type === "number"
                                        ? "text-right"
                                        : ""
                                        }`}
                                >
                                    {col.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow key={row.id || index}>
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.key}
                                        className={`text-sm ${col.type === "currency" || col.type === "number"
                                            ? "text-right font-mono"
                                            : ""
                                            }`}
                                    >
                                        {formatValue(row, col)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                Mostrando {data.length} registros
            </p>
        </div>
    );
}
