"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { CHART_DEFAULTS, formatCurrency, formatCompactNumber } from './chart-config';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

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
    yAxisFormatter?: (value: number) => string;
    xAxisFormatter?: (value: string) => string;
    tooltipFormatter?: (value: number) => string;
    layout?: 'horizontal' | 'vertical';
    barSize?: number;
    radius?: [number, number, number, number];
    // Shadcn Config
    config?: ChartConfig;
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
    yAxisFormatter = formatCompactNumber,
    xAxisFormatter,
    tooltipFormatter = formatCurrency,
    layout = 'horizontal',
    barSize,
    radius = [4, 4, 0, 0], // Top rounded
    config = {
        [yKey]: {
            label: title || "Valor",
            color: color
        }
    }
}: BaseBarChartProps) {
    const ChartContent = (
        <ChartContainer config={config} className={cn("w-full", chartClassName)} style={{ height }}>
            <BarChart
                layout={layout}
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
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
                />
                <YAxis
                    type={layout === 'vertical' ? 'category' : 'number'}
                    dataKey={layout === 'vertical' ? xKey : undefined}
                    tickFormatter={yAxisFormatter}
                    fontSize={CHART_DEFAULTS.fontSize}
                    tickLine={false}
                    axisLine={false}
                    width={layout === 'vertical' ? 100 : undefined}
                />
                <ChartTooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                    content={<ChartTooltipContent formatter={tooltipFormatter} hideLabel={false} />}
                />
                <Bar
                    dataKey={yKey}
                    fill={`var(--color-${yKey}, ${color})`}
                    radius={radius}
                    barSize={barSize}
                    animationDuration={CHART_DEFAULTS.animationDuration}
                />
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
