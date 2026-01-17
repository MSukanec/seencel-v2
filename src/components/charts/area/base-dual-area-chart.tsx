"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from 'recharts';
import { CHART_DEFAULTS, formatCurrency, formatCompactNumber } from '../chart-config';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

interface BaseDualAreaChartProps {
    data: any[];
    xKey: string;
    /** Primary (main) data key - typically shown with gradient fill */
    primaryKey: string;
    /** Secondary data key - shown as line/area for comparison */
    secondaryKey: string;
    /** Labels for legend and tooltip */
    primaryLabel?: string;
    secondaryLabel?: string;
    /** Colors - defaults to chart CSS variables */
    primaryColor?: string;
    secondaryColor?: string;
    title?: string;
    description?: string;
    height?: number;
    className?: string;
    chartClassName?: string;
    showGrid?: boolean;
    yAxisFormatter?: (value: number) => string;
    xAxisFormatter?: (value: string) => string;
    tooltipFormatter?: (value: number) => string;
    /** Show gradient fill for primary area */
    gradient?: boolean;
    /** Show legend at bottom */
    showLegend?: boolean;
    config?: ChartConfig;
}

export function BaseDualAreaChart({
    data,
    xKey,
    primaryKey,
    secondaryKey,
    primaryLabel = "Primary",
    secondaryLabel = "Secondary",
    primaryColor = "var(--chart-1)",
    secondaryColor = "var(--chart-2)",
    title,
    description,
    height = 300,
    className,
    chartClassName,
    showGrid = true,
    yAxisFormatter = formatCompactNumber,
    xAxisFormatter,
    tooltipFormatter = formatCurrency,
    gradient = true,
    showLegend = true,
    config
}: BaseDualAreaChartProps) {
    const gradientId = `fill-${primaryKey}`;

    // Build config from props if not provided
    const chartConfig: ChartConfig = config || {
        [primaryKey]: {
            label: primaryLabel,
            color: primaryColor
        },
        [secondaryKey]: {
            label: secondaryLabel,
            color: secondaryColor
        }
    };

    const ChartContent = (
        <ChartContainer config={chartConfig} className={cn("w-full", chartClassName)} style={{ height }}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: showLegend ? 30 : 0 }}>
                <defs>
                    {gradient && (
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={`var(--color-${primaryKey}, ${primaryColor})`} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={`var(--color-${primaryKey}, ${primaryColor})`} stopOpacity={0} />
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
                    cursor={{ stroke: `var(--color-${primaryKey})`, strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={<ChartTooltipContent formatter={tooltipFormatter as any} />}
                />
                {showLegend && (
                    <Legend
                        verticalAlign="bottom"
                        height={24}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                )}
                {/* Primary Area - with gradient fill */}
                <Area
                    type="monotone"
                    dataKey={primaryKey}
                    name={primaryLabel}
                    stroke={`var(--color-${primaryKey}, ${primaryColor})`}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={gradient ? `url(#${gradientId})` : "none"}
                    animationDuration={CHART_DEFAULTS.animationDuration}
                />
                {/* Secondary Area - line only, no fill */}
                <Area
                    type="monotone"
                    dataKey={secondaryKey}
                    name={secondaryLabel}
                    stroke={`var(--color-${secondaryKey}, ${secondaryColor})`}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={0}
                    fill="none"
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
