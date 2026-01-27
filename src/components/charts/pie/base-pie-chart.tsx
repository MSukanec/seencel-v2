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

interface BasePieChartProps {
    data: any[];
    nameKey: string;
    valueKey: string;
    title?: string;
    description?: string;
    height?: number;
    className?: string;
    chartClassName?: string;
    tooltipFormatter?: (value: number) => string;
    innerRadius?: number;
    outerRadius?: number;
    // Shadcn
    config?: ChartConfig;
}

export function BasePieChart({
    data,
    nameKey,
    valueKey,
    title,
    description,
    height = 300,
    className,
    chartClassName,
    tooltipFormatter = formatCurrency,
    innerRadius = 0,
    outerRadius = 80,
    config = {}
}: BasePieChartProps) {
    const ChartContent = (
        <ChartContainer config={config} className={cn("mx-auto", chartClassName)} style={{ height }}>
            <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                    data={data}
                    dataKey={valueKey}
                    nameKey={nameKey}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    strokeWidth={5}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.fill || entry.color || `var(--color-${entry[nameKey]}, var(--chart-${(index % 5) + 1}))`}
                        />
                    ))}
                </Pie>
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

