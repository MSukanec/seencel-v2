"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from 'recharts';
import { CHART_COLORS, CHART_DEFAULTS, formatCurrency, formatCompactNumber } from './chart-config';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface BaseAreaChartProps {
    data: any[];
    xKey: string;
    yKey: string;
    title?: string;
    description?: string;
    height?: number;
    className?: string;
    color?: string;
    showGrid?: boolean;
    yAxisFormatter?: (value: number) => string;
    xAxisFormatter?: (value: string) => string;
    tooltipFormatter?: (value: number) => string;
    gradient?: boolean;
}

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-3 shadow-lg ring-1 ring-black/5">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-foreground">
                        {formatter ? formatter(payload[0].value as number) : payload[0].value}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export function BaseAreaChart({
    data,
    xKey,
    yKey,
    title,
    description,
    height = 300,
    className,
    color = CHART_COLORS.primary,
    showGrid = true,
    yAxisFormatter = formatCompactNumber,
    xAxisFormatter,
    tooltipFormatter = formatCurrency,
    gradient = true
}: BaseAreaChartProps) {
    const gradientId = `gradient-${xKey}-${yKey}`;

    return (
        <Card className={cn("flex flex-col border-none shadow-none bg-transparent", className)}>
            {(title || description) && (
                <CardHeader className="px-0 pt-0 pb-4">
                    {title && (
                        <CardTitle className="text-base font-semibold text-muted-foreground flex items-center gap-2">
                            {title}
                        </CardTitle>
                    )}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent className="px-0 pb-0 flex-1 min-h-0">
                <div style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                {gradient && (
                                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
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
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis
                                tickFormatter={yAxisFormatter}
                                fontSize={CHART_DEFAULTS.fontSize}
                                tickLine={false}
                                axisLine={false}
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <Tooltip
                                content={<CustomTooltip formatter={tooltipFormatter} />}
                                cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area
                                type="monotone"
                                dataKey={yKey}
                                stroke={color}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={gradient ? `url(#${gradientId})` : "none"}
                                animationDuration={CHART_DEFAULTS.animationDuration}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
