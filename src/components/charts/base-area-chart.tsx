"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { CHART_DEFAULTS, formatCurrency, formatCompactNumber } from './chart-config';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

interface BaseAreaChartProps {
    data: any[];
    xKey: string;
    yKey: string;
    title?: string;
    description?: string;
    height?: number;
    className?: string;
    chartClassName?: string;
    color?: string;
    showGrid?: boolean;
    yAxisFormatter?: (value: number) => string;
    xAxisFormatter?: (value: string) => string;
    tooltipFormatter?: (value: number) => string;
    gradient?: boolean;
    config?: ChartConfig;
}

export function BaseAreaChart({
    data,
    xKey,
    yKey,
    title,
    description,
    height = 300,
    className,
    chartClassName,
    color = "var(--primary)",
    showGrid = true,
    yAxisFormatter = formatCompactNumber,
    xAxisFormatter,
    tooltipFormatter = formatCurrency,
    gradient = true,
    config = {
        [yKey]: {
            label: "Valor",
            color: color
        }
    }
}: BaseAreaChartProps) {
    const gradientId = `fill-${yKey}`; // Simplificado usando el ID de Shadcn

    // If no specific color is provided in config[yKey].color, fallback to the `color` prop
    // However, ChartContainer uses CSS vars based on the config key.
    // We should map the color prop to the config if not present.

    const ChartContent = (
        <ChartContainer config={config} className={cn("w-full", chartClassName)} style={{ height }}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    {gradient && (
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={`var(--color-${yKey}, ${color})`} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={`var(--color-${yKey}, ${color})`} stopOpacity={0} />
                        </linearGradient>
                    )}
                </defs>
                {showGrid && (
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={CHART_DEFAULTS.gridColor}
                    />
                )}
                <XAxis
                    dataKey={xKey}
                    tickFormatter={xAxisFormatter}
                    fontSize={CHART_DEFAULTS.fontSize}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                />
                <YAxis
                    tickFormatter={yAxisFormatter}
                    fontSize={CHART_DEFAULTS.fontSize}
                    tickLine={false}
                    axisLine={false}
                />
                <ChartTooltip
                    cursor={{ stroke: `var(--color-${yKey})`, strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={<ChartTooltipContent formatter={tooltipFormatter} />}
                />
                <Area
                    type="monotone"
                    dataKey={yKey}
                    stroke={`var(--color-${yKey}, ${color})`}
                    fillOpacity={1}
                    fill={gradient ? `url(#${gradientId})` : "none"}
                    animationDuration={CHART_DEFAULTS.animationDuration}
                />
            </AreaChart>
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
