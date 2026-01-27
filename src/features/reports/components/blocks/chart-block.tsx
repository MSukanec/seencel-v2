"use client";

import type { BlockConfig, BlockType } from "../../views/reports-builder-view";
import { LazyAreaChart, LazyBarChart, LazyPieChart } from "@/components/charts/lazy-charts";

interface ChartBlockProps {
    type: BlockType;
    config: BlockConfig;
    organizationId: string;
}

// Mock data for demonstration
const MOCK_LINE_DATA = [
    { month: "Ene", value: 1200000 },
    { month: "Feb", value: 1450000 },
    { month: "Mar", value: 1380000 },
    { month: "Abr", value: 1560000 },
    { month: "May", value: 1720000 },
    { month: "Jun", value: 1890000 },
];

const MOCK_BAR_DATA = [
    { name: "Proyecto A", value: 45000 },
    { name: "Proyecto B", value: 32000 },
    { name: "Proyecto C", value: 28000 },
    { name: "Proyecto D", value: 18000 },
];

const MOCK_PIE_DATA = [
    { name: "Materiales", value: 45 },
    { name: "Mano de Obra", value: 30 },
    { name: "Subcontratos", value: 15 },
    { name: "Otros", value: 10 },
];

export function ChartBlock({ type, config, organizationId }: ChartBlockProps) {
    const { title, dataSource } = config;

    // In a real implementation, we would fetch data based on dataSource and projectIds
    // For now, using mock data

    return (
        <div className="space-y-3">
            {title && (
                <h4 className="font-semibold text-sm">{title}</h4>
            )}

            <div className="h-[200px] w-full">
                {type === "chart-line" && (
                    <LazyAreaChart
                        data={MOCK_LINE_DATA}
                        xKey="month"
                        yKey="value"
                        color="#22c55e"
                        showGrid
                        tooltipFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                        height={200}
                    />
                )}

                {type === "chart-bar" && (
                    <LazyBarChart
                        data={MOCK_BAR_DATA}
                        xKey="name"
                        yKey="value"
                        color="#3b82f6"
                        tooltipFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                        height={200}
                    />
                )}

                {type === "chart-pie" && (
                    <LazyPieChart
                        data={MOCK_PIE_DATA}
                        valueKey="value"
                        nameKey="name"
                        height={200}
                    />
                )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
                Fuente: {dataSource || "Datos de ejemplo"}
            </p>
        </div>
    );
}
