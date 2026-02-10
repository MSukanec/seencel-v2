"use client";

import { cn } from "@/lib/utils";
import { BentoCard } from "../bento-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Minus, Maximize2 } from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import { useMemo, useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    YAxis,
} from "recharts";

/** Chart type for embedded visualization */
type ChartType = 'sparkline' | 'area' | 'bar' | 'none';

/** Chart position within the card */
type ChartPosition = 'background' | 'bottom' | 'right';

/** Size variants */
type BentoSize = 'sm' | 'md' | 'lg' | 'wide' | 'tall';

/** Chart data point with label */
export interface ChartDataPoint {
    label: string;
    value: number;
}

interface BentoKpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** KPI title */
    title: string;
    /** Description/subtitle */
    subtitle?: string;
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
    /** Chart data points (legacy number[] or new ChartDataPoint[]) */
    chartData?: number[] | ChartDataPoint[];
    /** Chart color (CSS color) */
    chartColor?: string;
    /** Chart position */
    chartPosition?: ChartPosition;
    /** Card size */
    size?: BentoSize;
    /** Accent color (kept for API compat, no visual effect) */
    accentColor?: string;
    /** Footer content */
    footer?: React.ReactNode;
    /** Enable expand to fullscreen */
    expandable?: boolean;
}

/**
 * Normalize chart data to ChartDataPoint[] format
 */
function normalizeChartData(data: number[] | ChartDataPoint[] | undefined): ChartDataPoint[] {
    if (!data || data.length === 0) return [];

    // Check if already in ChartDataPoint format
    if (typeof data[0] === 'object' && 'label' in data[0]) {
        return data as ChartDataPoint[];
    }

    // Convert number[] to ChartDataPoint[] with index labels
    return (data as number[]).map((value, index) => ({
        label: String(index + 1),
        value
    }));
}

/**
 * Custom tooltip for Recharts
 */
function CustomTooltip({
    active,
    payload,
    color,
    formatValue
}: {
    active?: boolean;
    payload?: Array<{ value: number; payload: ChartDataPoint }>;
    color: string;
    formatValue?: (value: number) => string;
}) {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];
    const formattedValue = formatValue ? formatValue(data.value) : data.value.toLocaleString('es-AR');

    return (
        <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-xl">
            <p className="text-xs text-muted-foreground">{data.payload.label}</p>
            <p className="text-sm font-semibold" style={{ color }}>{formattedValue}</p>
        </div>
    );
}

/**
 * Mini sparkline chart (for inline display)
 */
function MiniSparkline({
    data,
    color,
    fill = false,
    showLabels = false
}: {
    data: ChartDataPoint[];
    color: string;
    fill?: boolean;
    showLabels?: boolean;
}) {
    if (data.length < 2) return null;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id={`gradient-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={fill ? 0.4 : 0} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <YAxis hide domain={[0, 'auto']} />
                {showLabels && (
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                        interval="preserveStartEnd"
                    />
                )}
                <Tooltip
                    content={<CustomTooltip color={color} />}
                    cursor={{ stroke: color, strokeOpacity: 0.3, strokeDasharray: '3 3' }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2.5}
                    fill={`url(#gradient-${color.replace(/[^a-z0-9]/gi, '')})`}
                    dot={false}
                    activeDot={{ r: 4, fill: color, stroke: 'var(--background)', strokeWidth: 2 }}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

/**
 * Mini bar chart
 */
function MiniBarChart({
    data,
    color,
    showLabels = false
}: {
    data: ChartDataPoint[];
    color: string;
    showLabels?: boolean;
}) {
    if (data.length < 1) return null;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <YAxis hide domain={[0, 'auto']} />
                {showLabels && (
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                    />
                )}
                <Tooltip
                    content={<CustomTooltip color={color} />}
                    cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
                />
                <Bar
                    dataKey="value"
                    fill={color}
                    radius={[4, 4, 0, 0]}
                    opacity={0.85}
                    isAnimationActive={false}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

/**
 * Full chart for expanded view
 */
function FullChart({
    data,
    color,
    chartType,
    formatValue
}: {
    data: ChartDataPoint[];
    color: string;
    chartType: ChartType;
    formatValue?: (value: number) => string;
}) {
    if (chartType === 'bar') {
        return (
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data} margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        tickFormatter={(value) => formatValue ? formatValue(value) : value.toLocaleString('es-AR')}
                    />
                    <Tooltip content={<CustomTooltip color={color} formatValue={formatValue} />} />
                    <Bar
                        dataKey="value"
                        fill={color}
                        radius={[6, 6, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data} margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
                <defs>
                    <linearGradient id="fullGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickFormatter={(value) => formatValue ? formatValue(value) : value.toLocaleString('es-AR')}
                />
                <Tooltip content={<CustomTooltip color={color} formatValue={formatValue} />} />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={3}
                    fill="url(#fullGradient)"
                    dot={{ r: 4, fill: color, stroke: 'var(--background)', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: color, stroke: 'var(--background)', strokeWidth: 2 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

/**
 * BentoKpiCard - KPI card with integrated chart visualization
 * 
 * Composes BentoCard (parent shell) with KPI-specific content:
 * value display, trend indicator, and embedded charts.
 */
export function BentoKpiCard({
    title,
    subtitle,
    value,
    amount,
    trend,
    icon,
    chartType = 'none',
    chartData,
    chartColor = 'oklch(69.766% 0.16285 126.686)',
    chartPosition = 'bottom',
    size = 'sm',
    accentColor,
    footer,
    expandable = false,
    className,
    ...props
}: BentoKpiCardProps) {
    const money = useMoney();
    const [isExpanded, setIsExpanded] = useState(false);

    // Normalize chart data
    const normalizedData = useMemo(() => normalizeChartData(chartData), [chartData]);

    // Format display value
    const displayValue = useMemo(() => {
        if (amount !== undefined) {
            return money.format(amount);
        }
        return value ?? '';
    }, [amount, value, money]);

    // Render chart based on type and position
    const renderChart = (showLabels = false) => {
        if (chartType === 'none' || normalizedData.length === 0) return null;

        const hasEnoughDataForLabels = normalizedData.length <= 12;

        return (
            <div className={cn(
                "w-full min-h-0",
                chartPosition === 'background' && "absolute inset-0 flex items-end opacity-50",
                chartPosition === 'bottom' && "flex-1",
                chartPosition === 'right' && "absolute right-3 top-1/2 -translate-y-1/2 w-24 h-14"
            )}>
                {chartType === 'sparkline' || chartType === 'area' ? (
                    <MiniSparkline
                        data={normalizedData}
                        color={chartColor}
                        fill={chartType === 'area'}
                        showLabels={showLabels && hasEnoughDataForLabels}
                    />
                ) : chartType === 'bar' ? (
                    <MiniBarChart
                        data={normalizedData}
                        color={chartColor}
                        showLabels={showLabels && hasEnoughDataForLabels}
                    />
                ) : null}
            </div>
        );
    };

    return (
        <>
            <BentoCard
                size={size}
                headerless
                className={cn("relative", className)}
                {...props}
            >
                {/* === CUSTOM HEADER (with expand button) === */}
                <div className="flex items-center gap-2 -mt-1 mb-1">
                    {icon && (
                        <div className="shrink-0 p-1.5 rounded-lg bg-primary/10 text-primary">
                            {icon}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium truncate block">{title}</span>
                        {subtitle && (
                            <span className="text-xs text-muted-foreground truncate block">{subtitle}</span>
                        )}
                    </div>
                    {expandable && chartType !== 'none' && normalizedData.length > 0 && (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            title="Expandir gráfico"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* === VALUE + TREND === */}
                <div className="shrink-0 py-1 mb-3">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold tracking-tight">{displayValue}</span>
                    </div>

                    {/* Trend */}
                    {trend && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                                "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full",
                                trend.direction === 'up' && "bg-amount-positive/10 text-amount-positive",
                                trend.direction === 'down' && "bg-amount-negative/10 text-amount-negative",
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
                </div>

                {/* Chart (bottom position) */}
                {chartPosition === 'bottom' && renderChart(true)}

                {/* Background Chart */}
                {chartPosition === 'background' && renderChart(false)}

                {/* Right Chart */}
                {chartPosition === 'right' && renderChart(false)}
            </BentoCard>

            {/* Expanded Chart Dialog */}
            <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {icon}
                            <span>{title}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="text-3xl font-bold mb-2">{displayValue}</div>
                        {trend && (
                            <div className="flex items-center gap-2 mb-6">
                                <span className={cn(
                                    "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
                                    trend.direction === 'up' && "bg-amount-positive/10 text-amount-positive",
                                    trend.direction === 'down' && "bg-amount-negative/10 text-amount-negative",
                                    trend.direction === 'neutral' && "bg-muted text-muted-foreground"
                                )}>
                                    {trend.direction === 'up' && <TrendingUp className="w-4 h-4" />}
                                    {trend.direction === 'down' && <TrendingDown className="w-4 h-4" />}
                                    {trend.direction === 'neutral' && <Minus className="w-4 h-4" />}
                                    {trend.value}
                                </span>
                                {trend.label && (
                                    <span className="text-sm text-muted-foreground">{trend.label}</span>
                                )}
                            </div>
                        )}
                        <FullChart
                            data={normalizedData}
                            color={chartColor}
                            chartType={chartType}
                            formatValue={(v) => money.format(v)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
