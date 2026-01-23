"use client";

import {
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { CHART_DEFAULTS, formatCurrency } from '../chart-config';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

interface BaseDonutChartProps {
    data: any[];
    nameKey: string;
    valueKey: string;
    title?: string;
    description?: string;
    height?: number;
    className?: string;
    chartClassName?: string;
    tooltipFormatter?: (value: number) => string;
    centerLabel?: string;
    // Shadcn
    config?: ChartConfig;
}

export function BaseDonutChart({
    data,
    nameKey,
    valueKey,
    title,
    description,
    height = 300,
    className,
    chartClassName,
    tooltipFormatter = formatCurrency,
    centerLabel,
    config = {}
}: BaseDonutChartProps) {
    const ChartContent = (
        <ChartContainer config={config} className={cn("mx-auto aspect-square max-h-[300px]", chartClassName)} style={{ height }}>
            <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                    data={data}
                    dataKey={valueKey}
                    nameKey={nameKey}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    strokeWidth={5}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.fill || entry.color || `var(--color-${entry[nameKey]}, var(--chart-${(index % 5) + 1}))`}
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

