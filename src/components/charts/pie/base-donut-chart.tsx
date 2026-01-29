"use client";

import { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { CHART_DEFAULTS, formatCurrency } from '../chart-config';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { useMoney } from '@/hooks/use-money';

interface BaseDonutChartProps {
    data: any[];
    nameKey: string;
    valueKey: string;
    title?: string;
    description?: string;
    height?: number;
    className?: string;
    chartClassName?: string;
    /** 
     * Custom tooltip formatter. If not provided and autoFormat is true,
     * uses useMoney().format automatically.
     */
    tooltipFormatter?: (value: number) => string;
    centerLabel?: string;
    // Legend
    showLegend?: boolean;
    showPercentage?: boolean;
    legendFormatter?: (value: number) => string;
    maxLegendItems?: number;
    // Shadcn
    config?: ChartConfig;
    /**
     * If true (default), uses useMoney for formatting.
     * Set to false to use legacy formatCurrency or custom formatter.
     */
    autoFormat?: boolean;
}

export function BaseDonutChart({
    data,
    nameKey,
    valueKey,
    title,
    description,
    height = 160,
    className,
    chartClassName,
    tooltipFormatter,
    centerLabel,
    showLegend = true,
    showPercentage = true,
    legendFormatter,
    maxLegendItems = 8,
    config = {},
    autoFormat = true
}: BaseDonutChartProps) {
    // Use useMoney for automatic formatting when autoFormat is enabled
    const money = useMoney();

    // Determine the formatter to use
    const effectiveTooltipFormatter = tooltipFormatter ?? (autoFormat ? money.format : formatCurrency);
    const formatValue = legendFormatter ?? effectiveTooltipFormatter;

    // Sort data by value descending and calculate totals
    const { sortedData, total, legendData, othersValue } = useMemo(() => {
        const sorted = [...data].sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0));
        const totalVal = sorted.reduce((sum, item) => sum + (item[valueKey] || 0), 0);

        // If more items than max, group the rest as "Otros"
        let legend = sorted;
        let others = 0;

        if (sorted.length > maxLegendItems) {
            legend = sorted.slice(0, maxLegendItems - 1);
            others = sorted.slice(maxLegendItems - 1).reduce((sum, item) => sum + (item[valueKey] || 0), 0);
        }

        return { sortedData: sorted, total: totalVal, legendData: legend, othersValue: others };
    }, [data, valueKey, maxLegendItems]);

    const getPercentage = (value: number) => total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div className={cn("flex items-center gap-4 w-full h-full min-h-0", className)}>
            {/* Pie Chart - Left side */}
            <div className="flex-shrink-0">
                <ChartContainer
                    config={config}
                    className={cn("min-w-0 overflow-hidden", chartClassName)}
                    style={{ width: height, height }}
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent formatter={effectiveTooltipFormatter as any} hideLabel />}
                        />
                        <Pie
                            data={sortedData}
                            dataKey={valueKey}
                            nameKey={nameKey}
                            innerRadius="60%"
                            outerRadius="85%"
                            paddingAngle={2}
                            strokeWidth={0}
                        >
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.fill || entry.color || `var(--color-${entry[nameKey]}, var(--chart-${(index % 8) + 1}))`}
                                />
                            ))}
                        </Pie>
                        {centerLabel && (
                            <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                            >
                                <tspan
                                    x="50%"
                                    dy="-10"
                                    className="fill-muted-foreground text-xs font-bold"
                                >
                                    {centerLabel}
                                </tspan>
                            </text>
                        )}
                    </PieChart>
                </ChartContainer>
            </div>

            {/* Legend - Right side */}
            {showLegend && (
                <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
                    {legendData.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.fill || item.color || `var(--chart-${(i % 8) + 1})` }}
                            />
                            <span className="flex-1 truncate text-muted-foreground text-xs">
                                {item[nameKey]}
                            </span>
                            {showPercentage && (
                                <span className="text-muted-foreground text-xs tabular-nums w-7 text-right">
                                    {getPercentage(item[valueKey])}%
                                </span>
                            )}
                            <span className="font-medium text-xs tabular-nums min-w-[70px] text-right">
                                {formatValue(item[valueKey])}
                            </span>
                        </div>
                    ))}
                    {/* "Otros" if items were grouped */}
                    {othersValue > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0 bg-muted-foreground/50"
                            />
                            <span className="flex-1 truncate text-muted-foreground text-xs">
                                Otros
                            </span>
                            {showPercentage && (
                                <span className="text-muted-foreground text-xs tabular-nums w-7 text-right">
                                    {getPercentage(othersValue)}%
                                </span>
                            )}
                            <span className="font-medium text-xs tabular-nums min-w-[70px] text-right">
                                {formatValue(othersValue)}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
