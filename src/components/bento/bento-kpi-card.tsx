"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import { useMemo } from "react";

/** Chart type for embedded visualization */
type ChartType = 'sparkline' | 'area' | 'bar' | 'none';

/** Chart position within the card */
type ChartPosition = 'background' | 'bottom' | 'right';

/** Size variants */
type BentoSize = 'sm' | 'md' | 'lg' | 'wide' | 'tall';

interface BentoKpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** KPI title */
    title: string;
    /** Display value (pre-formatted) */
    value?: string | number;
    /** Raw monetary amount (uses useMoney for formatting) */
    amount?: number;
    /** Trend indicator */
    trend?: {
        value: string | number;
        direction: 'up' | 'down' | 'neutral';
        label?: string;
    };
    /** Icon component */
    icon?: React.ReactNode;
    /** Embedded chart type */
    chartType?: ChartType;
    /** Chart data points */
    chartData?: number[];
    /** Chart color (CSS color) */
    chartColor?: string;
    /** Chart position */
    chartPosition?: ChartPosition;
    /** Card size */
    size?: BentoSize;
    /** Accent color for glow effect */
    accentColor?: string;
}

const sizeStyles: Record<BentoSize, string> = {
    sm: 'col-span-1 row-span-1',
    md: 'col-span-1 md:col-span-2 row-span-1',
    lg: 'col-span-1 md:col-span-2 row-span-2',
    wide: 'col-span-full row-span-1',
    tall: 'col-span-1 row-span-2'
};

/**
 * Sparkline SVG component
 */
function Sparkline({
    data,
    color = '#a3e635',
    height = 60,
    fill = false
}: {
    data: number[];
    color?: string;
    height?: number;
    fill?: boolean;
}) {
    const points = useMemo(() => {
        if (!data || data.length < 2) return '';
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        const width = 100;
        const stepX = width / (data.length - 1);

        return data.map((d, i) => {
            const x = i * stepX;
            const y = height - ((d - min) / range) * (height - 10) - 5;
            return `${x},${y}`;
        }).join(' ');
    }, [data, height]);

    if (!data || data.length < 2) return null;

    const fillPath = fill ? `M0,${height} L${points} L100,${height} Z` : '';

    return (
        <svg
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            className="w-full h-full"
        >
            {fill && (
                <defs>
                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
            )}
            {fill && (
                <path
                    d={`M0,${height} L${points} L100,${height} Z`}
                    fill="url(#sparkFill)"
                />
            )}
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/**
 * Bar chart SVG component
 */
function MiniBarChart({
    data,
    color = '#a3e635',
    height = 60
}: {
    data: number[];
    color?: string;
    height?: number;
}) {
    if (!data || data.length < 1) return null;

    const max = Math.max(...data);
    const barWidth = 100 / data.length - 2;

    return (
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-full">
            {data.map((value, i) => {
                const barHeight = (value / max) * (height - 10);
                const x = (100 / data.length) * i + 1;
                return (
                    <rect
                        key={i}
                        x={x}
                        y={height - barHeight}
                        width={barWidth}
                        height={barHeight}
                        rx={2}
                        fill={color}
                        opacity={0.8 + (i / data.length) * 0.2}
                    />
                );
            })}
        </svg>
    );
}

/**
 * BentoKpiCard - KPI card with integrated chart visualization
 * 
 * @example
 * ```tsx
 * <BentoKpiCard
 *   title="Revenue"
 *   amount={94127}
 *   trend={{ value: "+13%", direction: "up" }}
 *   chartType="area"
 *   chartData={[10, 25, 15, 30, 45, 35, 50]}
 *   chartPosition="background"
 * />
 * ```
 */
export function BentoKpiCard({
    title,
    value,
    amount,
    trend,
    icon,
    chartType = 'none',
    chartData,
    chartColor = '#a3e635',
    chartPosition = 'bottom',
    size = 'sm',
    accentColor,
    className,
    ...props
}: BentoKpiCardProps) {
    const money = useMoney();

    // Format display value
    const displayValue = useMemo(() => {
        if (amount !== undefined) {
            return money.format(amount);
        }
        return value ?? '';
    }, [amount, value, money]);

    // Render chart based on type and position
    const renderChart = () => {
        if (chartType === 'none' || !chartData) return null;

        const chartHeight = chartPosition === 'background' ? 80 : 50;

        return (
            <div className={cn(
                "pointer-events-none",
                chartPosition === 'background' && "absolute inset-0 flex items-end opacity-50",
                chartPosition === 'bottom' && "mt-auto h-12",
                chartPosition === 'right' && "absolute right-4 top-1/2 -translate-y-1/2 w-24 h-16"
            )}>
                {chartType === 'sparkline' || chartType === 'area' ? (
                    <Sparkline
                        data={chartData}
                        color={chartColor}
                        height={chartHeight}
                        fill={chartType === 'area'}
                    />
                ) : chartType === 'bar' ? (
                    <MiniBarChart data={chartData} color={chartColor} height={chartHeight} />
                ) : null}
            </div>
        );
    };

    return (
        <Card
            className={cn(
                "relative overflow-hidden transition-all duration-300",
                "bg-card/60 backdrop-blur-sm border-border/50",
                "hover:scale-[1.02] hover:shadow-lg hover:border-primary/30",
                sizeStyles[size],
                className
            )}
            style={accentColor ? {
                boxShadow: `0 0 40px -10px ${accentColor}40`
            } : undefined}
            {...props}
        >
            <CardContent className="p-5 h-full flex flex-col relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{title}</span>
                    {icon && (
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            {icon}
                        </div>
                    )}
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-2 my-1">
                    <span className="text-3xl font-bold tracking-tight">{displayValue}</span>
                </div>

                {/* Trend */}
                {trend && (
                    <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                            "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                            trend.direction === 'up' && "bg-emerald-500/10 text-emerald-500",
                            trend.direction === 'down' && "bg-red-500/10 text-red-500",
                            trend.direction === 'neutral' && "bg-muted text-muted-foreground"
                        )}>
                            {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
                            {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
                            {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
                            {trend.value}
                        </span>
                        {trend.label && (
                            <span className="text-xs text-muted-foreground">{trend.label}</span>
                        )}
                    </div>
                )}

                {/* Chart */}
                {chartPosition !== 'background' && renderChart()}
            </CardContent>

            {/* Background Chart */}
            {chartPosition === 'background' && renderChart()}
        </Card>
    );
}
