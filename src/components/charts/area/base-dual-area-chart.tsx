"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
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

    // Custom legend component for top position
    const TopLegend = showLegend && (
        <div className="flex items-center justify-end gap-4 mb-2">
            <div className="flex items-center gap-1.5 text-xs">
                <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: chartConfig[primaryKey]?.color || primaryColor }}
                />
                <span className="text-muted-foreground">{primaryLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
                <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: chartConfig[secondaryKey]?.color || secondaryColor }}
                />
                <span className="text-muted-foreground">{secondaryLabel}</span>
            </div>
        </div>
    );

    const ChartContent = (
        <div className={cn("w-full min-w-0 max-w-full overflow-hidden", chartClassName)}>
            {TopLegend}
            <ChartContainer
                config={chartConfig}
                className="w-full"
                style={{ height: showLegend ? height - 24 : height }}
            >
                <AreaChart
                    data={data}
                    margin={{
                        top: 4,
                        right: 4,
                        left: -20, // Negative to pull Y-axis labels closer to edge
                        bottom: 0
                    }}
                >
                    <defs>
                        {/* Primary gradient - more pronounced for visual impact */}
                        {gradient && (
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={`var(--color-${primaryKey}, ${primaryColor})`} stopOpacity={0.5} />
                                <stop offset="50%" stopColor={`var(--color-${primaryKey}, ${primaryColor})`} stopOpacity={0.15} />
                                <stop offset="100%" stopColor={`var(--color-${primaryKey}, ${primaryColor})`} stopOpacity={0} />
                            </linearGradient>
                        )}
                        {/* Secondary gradient */}
                        {gradient && (
                            <linearGradient id={`${gradientId}-secondary`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={`var(--color-${secondaryKey}, ${secondaryColor})`} stopOpacity={0.4} />
                                <stop offset="50%" stopColor={`var(--color-${secondaryKey}, ${secondaryColor})`} stopOpacity={0.1} />
                                <stop offset="100%" stopColor={`var(--color-${secondaryKey}, ${secondaryColor})`} stopOpacity={0} />
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
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={20}
                        tick={{ fill: '#a1a1aa' }}
                        dy={4}
                    />
                    <YAxis
                        tickFormatter={yAxisFormatter}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                        tick={{ fill: '#a1a1aa' }}
                    />
                    <ChartTooltip
                        cursor={{ stroke: `var(--color-${primaryKey})`, strokeWidth: 1, strokeDasharray: '4 4' }}
                        content={<ChartTooltipContent formatter={tooltipFormatter as any} />}
                    />
                    {/* Secondary Area - with subtle gradient fill */}
                    <Area
                        type="monotone"
                        dataKey={secondaryKey}
                        name={secondaryLabel}
                        stroke={`var(--color-${secondaryKey}, ${secondaryColor})`}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={gradient ? `url(#${gradientId}-secondary)` : "none"}
                        animationDuration={CHART_DEFAULTS.animationDuration}
                    />
                    {/* Primary Area - with gradient fill (rendered on top) */}
                    <Area
                        type="monotone"
                        dataKey={primaryKey}
                        name={primaryLabel}
                        stroke={`var(--color-${primaryKey}, ${primaryColor})`}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill={gradient ? `url(#${gradientId})` : "none"}
                        animationDuration={CHART_DEFAULTS.animationDuration}
                    />
                </AreaChart>
            </ChartContainer>
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
                </CardContent>
            </Card>
        );
    }
    return ChartContent;
}

