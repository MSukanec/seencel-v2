"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CHART_COLORS, getChartColor } from "../chart-config";

interface WaffleDataPoint {
    label: string;
    value: number;
    color?: string;
}

interface BaseWaffleChartProps {
    /** Array of data points with label, value, and optional color */
    data: WaffleDataPoint[];
    /** Height of the chart in pixels */
    height?: number;
    /** Number of columns in the waffle grid */
    columns?: number;
    /** Size of each cell in pixels */
    cellSize?: number;
    /** Gap between cells in pixels */
    cellGap?: number;
    /** Title above the chart */
    title?: string;
    /** Description/subtitle */
    description?: string;
    /** Card wrapper className */
    className?: string;
    /** Chart container className */
    chartClassName?: string;
    /** Show labels on hover/tooltip */
    showTooltip?: boolean;
    /** Show legend below chart */
    showLegend?: boolean;
    /** Format function for tooltip values */
    valueFormatter?: (value: number) => string;
    /** Sort data by value (descending) */
    sortByValue?: boolean;
}

/**
 * Waffle/Pixel Chart - Shows data as a grid of colored cells
 * Great for visualizing proportions and part-to-whole relationships
 * 
 * @example
 * <BaseWaffleChart
 *   data={[
 *     { label: "Enero", value: 5000 },
 *     { label: "Febrero", value: 7500 },
 *     { label: "Marzo", value: 9000 },
 *   ]}
 *   columns={10}
 *   showLegend
 * />
 */
export function BaseWaffleChart({
    data,
    height = 200,
    columns = 12,
    cellSize = 12,
    cellGap = 2,
    title,
    description,
    className,
    chartClassName,
    showTooltip = true,
    showLegend = true,
    valueFormatter = (v) => v.toLocaleString('es-AR'),
    sortByValue = false
}: BaseWaffleChartProps) {
    // Process data
    const processedData = useMemo(() => {
        let items = data.map((item, index) => ({
            ...item,
            color: item.color || getChartColor(index),
        }));

        if (sortByValue) {
            items = items.sort((a, b) => b.value - a.value);
        }

        return items;
    }, [data, sortByValue]);

    // Calculate cell counts for each item
    const maxValue = useMemo(() => {
        return Math.max(...processedData.map(d => d.value));
    }, [processedData]);

    // Calculate how many rows we need based on max value
    const maxCells = useMemo(() => {
        // Scale so the maximum value fills most of the available height
        const availableRows = Math.floor(height / (cellSize + cellGap));
        return availableRows * columns;
    }, [height, cellSize, cellGap, columns]);

    // Generate cells for each data point
    const cellsPerItem = useMemo(() => {
        return processedData.map(item => {
            // Scale proportionally to maxValue
            const cells = Math.round((item.value / maxValue) * maxCells * 0.9);
            return Math.max(1, cells); // At least 1 cell
        });
    }, [processedData, maxValue, maxCells]);

    // Calculate max cells used to determine actual height
    const maxCellsUsed = Math.max(...cellsPerItem);
    const actualRows = Math.ceil(maxCellsUsed / columns);

    const ChartContent = (
        <div className={cn("flex items-end gap-2 min-w-0 max-w-full overflow-x-auto", chartClassName)}>
            {processedData.map((item, itemIndex) => {
                const cellCount = cellsPerItem[itemIndex];
                const rows = Math.ceil(cellCount / columns);
                const cells = [];

                // Generate cells from bottom to top
                for (let row = 0; row < rows; row++) {
                    const rowCells = [];
                    const startIdx = row * columns;
                    const cellsInThisRow = Math.min(columns, cellCount - startIdx);

                    for (let col = 0; col < columns; col++) {
                        const isFilled = col < cellsInThisRow;
                        rowCells.push(
                            <div
                                key={`${row}-${col}`}
                                className={cn(
                                    "rounded-sm transition-all duration-200",
                                    isFilled ? "opacity-100" : "opacity-0"
                                )}
                                style={{
                                    width: cellSize,
                                    height: cellSize,
                                    backgroundColor: isFilled ? item.color : "transparent",
                                }}
                            />
                        );
                    }
                    cells.unshift(
                        <div key={row} className="flex" style={{ gap: cellGap }}>
                            {rowCells}
                        </div>
                    );
                }

                return (
                    <div
                        key={item.label}
                        className="flex flex-col items-center group relative"
                        style={{ gap: cellGap }}
                    >
                        {/* Cells */}
                        <div className="flex flex-col" style={{ gap: cellGap }}>
                            {cells}
                        </div>

                        {/* Label */}
                        <span className="text-xs text-muted-foreground mt-1 truncate max-w-[60px]">
                            {item.label}
                        </span>

                        {/* Tooltip */}
                        {showTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                <div className="text-xs font-medium">{item.label}</div>
                                <div className="text-sm font-bold" style={{ color: item.color }}>
                                    {valueFormatter(item.value)}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    // Legend
    const Legend = showLegend && (
        <div className="flex flex-wrap gap-3 mt-4">
            {processedData.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs">
                    <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.label}:</span>
                    <span className="font-medium">{valueFormatter(item.value)}</span>
                </div>
            ))}
        </div>
    );

    if (title || description) {
        return (
            <Card className={cn("flex flex-col border-none shadow-none bg-transparent", className)}>
                <CardHeader className="px-0 pt-0 pb-4">
                    {title && (
                        <CardTitle className="text-base font-semibold text-muted-foreground flex items-center gap-2">
                            {title}
                        </CardTitle>
                    )}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent className="px-0 pb-0 flex-1 min-h-0">
                    {ChartContent}
                    {Legend}
                </CardContent>
            </Card>
        );
    }

    return (
        <div>
            {ChartContent}
            {Legend}
        </div>
    );
}
