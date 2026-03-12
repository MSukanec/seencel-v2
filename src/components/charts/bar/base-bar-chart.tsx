"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Cell,
    ReferenceLine
} from 'recharts';
import { useId } from 'react';
import { CHART_DEFAULTS, formatCurrency, formatCompactNumber } from '../chart-config';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { useMoney } from '@/hooks/use-money';

interface BaseBarChartProps {
    data: any[];
    xKey: string;
    yKey: string;
    title?: string;
    description?: string;
    height?: number;
    className?: string; // Class for the wrapper Card
    chartClassName?: string; // Class for the ChartContainer
    color?: string; // Now used as a fallback if not in config
    showGrid?: boolean;
    showYAxis?: boolean;
    yAxisFormatter?: (value: number) => string;
    xAxisFormatter?: (value: string) => string;
    /** Custom tooltip formatter. If not provided, uses useMoney().format */
    tooltipFormatter?: (value: number) => string;
    layout?: 'horizontal' | 'vertical';
    barSize?: number;
    radius?: [number, number, number, number];
    // Shadcn Config
    config?: ChartConfig;
    /**
     * If true (default), uses useMoney for formatting.
     * Set to false to use legacy formatCurrency/formatCompactNumber.
     */
    autoFormat?: boolean;
    /** Optional horizontal reference line value (e.g., average) */
    referenceValue?: number;
    /** Label for the reference line (e.g., "Avg $12,000") */
    referenceLabel?: string;
    /** Enable vertical gradient fill on bars */
    gradient?: boolean;
}

export function BaseBarChart({
    data,
    xKey,
    yKey,
    title,
    description,
    height = 300,
    className,
    chartClassName,
    color = "var(--primary)", // Default to primary
    showGrid = true,
    showYAxis = true,
    yAxisFormatter,
    xAxisFormatter,
    tooltipFormatter,
    layout = 'horizontal',
    barSize,
    radius = [4, 4, 0, 0], // Top rounded
    config = {
        [yKey]: {
            label: title || "Valor",
            color: color
        }
    },
    autoFormat = true,
    referenceValue,
    referenceLabel,
    gradient = false,
}: BaseBarChartProps) {
    // Use useMoney for automatic formatting
    const money = useMoney();
    const gradientId = useId().replace(/:/g, '') + '-bar-gradient';

    // Determine effective formatters
    const effectiveTooltipFormatter = tooltipFormatter ?? (autoFormat ? money.format : formatCurrency);
    const effectiveYAxisFormatter = yAxisFormatter ?? (autoFormat
        ? (value: number) => money.formatCompact(value)
        : formatCompactNumber);
    const useFlexHeight = chartClassName?.includes('h-');
    const ChartContent = (
        <ChartContainer config={config} className={cn("w-full", chartClassName)} style={useFlexHeight ? undefined : { height }}>
            <BarChart
                layout={layout}
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
                {gradient && (
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={`var(--color-${yKey}, ${color})`} stopOpacity={1} />
                            <stop offset="100%" stopColor={`var(--color-${yKey}, ${color})`} stopOpacity={0.4} />
                        </linearGradient>
                    </defs>
                )}
                {showGrid && (
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        horizontal={layout === 'horizontal'}
                        stroke={CHART_DEFAULTS.gridColor}
                    />
                )}
                <XAxis
                    type={layout === 'vertical' ? 'number' : 'category'}
                    dataKey={layout === 'vertical' ? undefined : xKey}
                    tickFormatter={xAxisFormatter}
                    fontSize={CHART_DEFAULTS.fontSize}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'currentColor', className: 'text-muted-foreground' }}
                />
                {showYAxis && (
                    <YAxis
                        type={layout === 'vertical' ? 'category' : 'number'}
                        dataKey={layout === 'vertical' ? xKey : undefined}
                        tickFormatter={effectiveYAxisFormatter}
                        fontSize={CHART_DEFAULTS.fontSize}
                        tickLine={false}
                        axisLine={false}
                        width={layout === 'vertical' ? 100 : undefined}
                    />
                )}
                <ChartTooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                    content={<ChartTooltipContent formatter={effectiveTooltipFormatter as any} hideLabel={false} />}
                />
                <Bar
                    dataKey={yKey}
                    fill={gradient ? `url(#${gradientId})` : `var(--color-${yKey}, ${color})`}
                    radius={radius}
                    barSize={barSize}
                    animationDuration={CHART_DEFAULTS.animationDuration}
                />
                {referenceValue != null && (
                    <ReferenceLine
                        y={referenceValue}
                        stroke="var(--muted-foreground)"
                        strokeDasharray="4 4"
                        label={referenceLabel ? ({viewBox}: any) => {
                            const { x, y } = viewBox;
                            const labelWidth = referenceLabel.length * 5.5 + 20;
                            const pillHeight = 22;
                            const pillY = y - pillHeight / 2;
                            return (
                                <g>
                                    <rect
                                        x={x}
                                        y={pillY}
                                        width={labelWidth}
                                        height={pillHeight}
                                        rx={6}
                                        ry={6}
                                        fill="var(--background)"
                                        stroke="var(--border)"
                                        strokeOpacity={0.5}
                                        strokeWidth={1}
                                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))"
                                    />
                                    <text
                                        x={x + labelWidth / 2}
                                        y={y + 1}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize={11}
                                        fontWeight={500}
                                        fill="var(--foreground)"
                                    >
                                        {referenceLabel}
                                    </text>
                                </g>
                            );
                        } : undefined}
                    />
                )}
            </BarChart>
        </ChartContainer>
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
                </CardContent>
            </Card>
        );
    }

    return ChartContent;
}

