"use client";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { CHART_COLORS, CHART_DEFAULTS, formatCurrency } from './chart-config';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface BaseDonutChartProps {
    data: any[];
    nameKey: string;
    valueKey: string;
    title?: string;
    description?: string;
    height?: number;
    className?: string;
    colors?: string[];
    tooltipFormatter?: (value: number) => string;
    centerLabel?: string;
}

const CustomTooltip = ({ active, payload, formatter }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="rounded-lg border bg-background p-3 shadow-lg ring-1 ring-black/5 flex items-center gap-2">
                <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: data.payload.fill }}
                />
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">
                        {data.name}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                        {formatter ? formatter(data.value) : data.value}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export function BaseDonutChart({
    data,
    nameKey,
    valueKey,
    title,
    description,
    height = 300,
    className,
    colors = CHART_COLORS.categorical,
    tooltipFormatter = formatCurrency,
    centerLabel
}: BaseDonutChartProps) {
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
                <div style={{ height }} className="relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey={valueKey}
                                nameKey={nameKey}
                                animationDuration={CHART_DEFAULTS.animationDuration}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color || colors[index % colors.length]}
                                        strokeWidth={1}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                content={<CustomTooltip formatter={tooltipFormatter} />}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Custom Legend */}
                    <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        {data.slice(0, 6).map((entry, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: entry.color || colors[i % colors.length] }}
                                />
                                <span className="truncate max-w-[120px]" title={entry[nameKey]}>
                                    {entry[nameKey]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
