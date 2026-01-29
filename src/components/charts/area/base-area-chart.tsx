"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { CHART_DEFAULTS, formatCurrency, formatCompactNumber } from '../chart-config';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { useMoney } from '@/hooks/use-money';

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
    /** Custom tooltip formatter. If not provided, uses useMoney().format */
    tooltipFormatter?: (value: number) => string;
    tooltipLabelFormatter?: (value: string) => string;
    gradient?: boolean;
    config?: ChartConfig;
    /**
     * If true (default), uses useMoney for formatting.
     * Set to false to use legacy formatCurrency/formatCompactNumber.
     */
    autoFormat?: boolean;
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
    color = "var(--chart-1)",
    showGrid = true,
    yAxisFormatter,
    xAxisFormatter,
    tooltipFormatter,
    tooltipLabelFormatter,
    gradient = true,
    config = {
        [yKey]: {
            label: "Valor",
            color: color
        }
    },
    autoFormat = true
}: BaseAreaChartProps) {
    // Use useMoney for automatic formatting
    const money = useMoney();

    // Determine effective formatters - wrap to match expected signatures
    const effectiveTooltipFormatter = tooltipFormatter ?? (autoFormat ? money.format : formatCurrency);
    const effectiveYAxisFormatter = yAxisFormatter ?? (autoFormat
        ? (value: number) => money.formatCompact(value)
        : formatCompactNumber);

    const gradientId = `fill-${yKey}`; // Simplificado usando el ID de Shadcn

    // If no specific color is provided in config[yKey].color, fallback to the `color` prop
    // However, ChartContainer uses CSS vars based on the config key.
    // We should map the color prop to the config if not present.

    const ChartContent = (
        <ChartContainer
            config={config}
            className={cn("w-full min-w-0 max-w-full overflow-hidden", !height && "h-full", chartClassName)}
            style={height ? { height } : undefined}
        >
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                <defs>
                    {gradient && (
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={`var(--color-${yKey}, ${color})`} stopOpacity={0.5} />
                            <stop offset="50%" stopColor={`var(--color-${yKey}, ${color})`} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={`var(--color-${yKey}, ${color})`} stopOpacity={0} />
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
                    tickFormatter={effectiveYAxisFormatter}
                    fontSize={CHART_DEFAULTS.fontSize}
                    tickLine={false}
                    axisLine={false}
                />
                <ChartTooltip
                    cursor={{ stroke: `var(--color-${yKey})`, strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={
                        <ChartTooltipContent
                            formatter={effectiveTooltipFormatter as any}
                            labelFormatter={tooltipLabelFormatter}
                        />
                    }
                />
                <Area
                    type="monotone"
                    dataKey={yKey}
                    stroke={`var(--color-${yKey}, ${color})`}
                    strokeWidth={2.5}
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

