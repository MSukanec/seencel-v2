
"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMoney } from "@/hooks/use-money";
import type { MoneyInput } from "@/lib/money";

/** Currency breakdown item for bi-monetary display */
export interface CurrencyBreakdownItem {
    currencyCode: string;
    symbol: string;
    nativeTotal: number;
    functionalTotal: number;
    isPrimary: boolean;
}

interface DashboardKpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    /** 
     * @deprecated Use `amount` instead for automatic currency formatting.
     * Pre-formatted display value (legacy mode) 
     */
    value?: string | number;
    /** 
     * Raw monetary amount - will be formatted automatically using useMoney.
     * Preferred over `value` for new code.
     */
    amount?: number;
    /**
     * Optional array of monetary items for automatic breakdown calculation.
     * Only used when `amount` is provided.
     */
    items?: MoneyInput[];
    icon?: React.ReactNode;
    trend?: {
        value: string | number;
        label?: string; // e.g. "vs last month"
        direction: "up" | "down" | "neutral";
    };
    description?: string;
    iconClassName?: string;
    /** Optional currency breakdown for bi-monetary KPIs */
    currencyBreakdown?: CurrencyBreakdownItem[];
    /** Decimal places for formatting (0, 1, or 2) */
    decimalPlaces?: number;
    /** Use compact notation for large numbers (e.g., 31.4M instead of 31,400,000) */
    compact?: boolean;
    /** 
     * Size variant for the KPI value
     * - 'default': text-3xl (current)
     * - 'large': text-4xl with separated prefix
     * - 'hero': text-5xl for main dashboard KPIs
     */
    size?: 'default' | 'large' | 'hero';
}

/**
 * Format a number in compact notation (K, M, B)
 * @example formatCompact(31431097) => { prefix: "$", value: "31.4", suffix: "M" }
 */
function formatCompactValue(value: number, locale: string = 'es-AR'): { value: string; suffix: string } {
    const absValue = Math.abs(value);

    if (absValue >= 1_000_000_000) {
        return {
            value: (value / 1_000_000_000).toLocaleString(locale, { maximumFractionDigits: 1 }),
            suffix: 'B'
        };
    }
    if (absValue >= 1_000_000) {
        return {
            value: (value / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 }),
            suffix: 'M'
        };
    }
    if (absValue >= 1_000) {
        return {
            value: (value / 1_000).toLocaleString(locale, { maximumFractionDigits: 1 }),
            suffix: 'K'
        };
    }
    return {
        value: value.toLocaleString(locale, { maximumFractionDigits: 0 }),
        suffix: ''
    };
}

/**
 * Parse a value string to extract prefix (currency symbol), number, and any suffix
 * @example parseValueString("$ 31.431.097,69") => { prefix: "$", number: 31431097.69 }
 */
function parseValueString(value: string): { prefix: string; number: number | null } {
    // Match currency symbol/prefix at the start, then the number
    const match = value.match(/^([^\d\-]*)([\d.,\-]+)/);
    if (!match) {
        return { prefix: '', number: null };
    }

    const prefix = match[1].trim();
    // Convert locale number to actual number (handle 1.000,00 format)
    const numStr = match[2]
        .replace(/\./g, '') // Remove thousand separators
        .replace(',', '.'); // Convert decimal separator

    return {
        prefix,
        number: parseFloat(numStr)
    };
}

export function DashboardKpiCard({
    title,
    value,
    amount,
    items,
    icon,
    trend,
    className,
    iconClassName,
    description,
    currencyBreakdown: externalBreakdown,
    decimalPlaces: externalDecimalPlaces,
    compact = true,  // Default to compact for modern look
    size = 'large',  // Default to large for impact
    ...props
}: DashboardKpiCardProps) {
    // Use useMoney for automatic formatting when amount is provided
    const money = useMoney();

    // Use organization preference for compact mode (default to false = full numbers)
    const useCompact = compact ?? money.config.kpiCompactFormat ?? false;

    // Calculate sum from items if provided (for bimonetary support)
    const sumResult = items && items.length > 0 ? money.sum(items) : null;

    // Priority: items (bimonetary) -> amount (single value) -> value (legacy string)
    let displayValue: string | number;
    if (sumResult) {
        // Use the aggregated total from useMoney.sum() - this respects displayMode!
        displayValue = money.format(sumResult.total);
    } else if (amount !== undefined) {
        displayValue = money.format(amount);
    } else {
        displayValue = value ?? '';
    }

    // Auto-calculate breakdown from sumResult if available
    const currencyBreakdown = sumResult
        ? sumResult.breakdown.map(b => ({
            ...b,
            functionalTotal: b.nativeTotal
        }))
        : externalBreakdown;

    // Use config decimal places when using amount/items mode
    const decimalPlaces = (sumResult || amount !== undefined)
        ? money.config.decimalPlaces
        : (externalDecimalPlaces ?? 2);

    // Only show breakdown if there are 2+ currencies AND we're in mix mode
    const showBreakdown = currencyBreakdown && currencyBreakdown.length > 1 && money.displayMode === 'mix';

    const formatValue = (val: number) => {
        return val.toLocaleString('es-AR', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces
        });
    };

    // Render the main value based on compact and size options
    const renderValue = () => {
        const sizeClasses = {
            'default': 'text-3xl',
            'large': 'text-4xl',
            'hero': 'text-5xl'
        };

        // Dynamic size: smaller text for full numbers, larger for compact
        const effectiveSize = useCompact ? size : (size === 'hero' ? 'large' : size === 'large' ? 'default' : size);

        // If compact mode and displayValue is a string with a number, parse and format
        if (useCompact && typeof displayValue === 'string') {
            // Special case: percentage values - render as-is with suffix styling
            if (displayValue.endsWith('%')) {
                const numPart = displayValue.slice(0, -1);
                return (
                    <h2 className={cn("font-bold tracking-tight mt-2 flex items-baseline gap-1", sizeClasses[size])}>
                        <span>{numPart}</span>
                        <span className="text-lg font-semibold text-muted-foreground">%</span>
                    </h2>
                );
            }

            const parsed = parseValueString(displayValue);
            if (parsed.number !== null) {
                const formatted = formatCompactValue(parsed.number);
                return (
                    <h2 className={cn("font-bold tracking-tight mt-2 flex items-baseline gap-1", sizeClasses[size])}>
                        {parsed.prefix && (
                            <span className="text-lg font-semibold text-muted-foreground">{parsed.prefix}</span>
                        )}
                        <span>{formatted.value}</span>
                        {formatted.suffix && (
                            <span className="text-lg font-semibold text-muted-foreground">{formatted.suffix}</span>
                        )}
                    </h2>
                );
            }
        }

        // If compact mode and displayValue is a number
        if (useCompact && typeof displayValue === 'number') {
            const formatted = formatCompactValue(displayValue);
            return (
                <h2 className={cn("font-bold tracking-tight mt-2 flex items-baseline gap-1", sizeClasses[size])}>
                    <span>{formatted.value}</span>
                    {formatted.suffix && (
                        <span className="text-lg font-semibold text-muted-foreground">{formatted.suffix}</span>
                    )}
                </h2>
            );
        }

        // For large/hero sizes without compact, still try to separate prefix
        if (size !== 'default' && typeof displayValue === 'string') {
            const parsed = parseValueString(displayValue);
            if (parsed.prefix) {
                // Get the remaining part after prefix
                const remaining = displayValue.substring(displayValue.indexOf(parsed.prefix) + parsed.prefix.length).trim();
                return (
                    <h2 className={cn("font-bold tracking-tight mt-2 flex items-baseline gap-1", sizeClasses[size])}>
                        <span className="text-lg font-semibold text-muted-foreground">{parsed.prefix}</span>
                        <span>{remaining}</span>
                    </h2>
                );
            }
        }

        // Default: render displayValue as-is
        return (
            <h2 className={cn("font-bold tracking-tight mt-2", sizeClasses[size])}>{displayValue}</h2>
        );
    };

    return (
        <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)} {...props}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        {renderValue()}

                        {/* Currency Breakdown */}
                        {showBreakdown && (
                            <p className="mt-1 text-xs text-muted-foreground font-medium">
                                {currencyBreakdown.map((item, index) => {
                                    const isNegative = item.nativeTotal < 0;
                                    const displayValue = Math.abs(item.nativeTotal);
                                    return (
                                        <span key={item.currencyCode}>
                                            {index > 0 && (isNegative ? " - " : " + ")}
                                            {index === 0 && isNegative && "-"}
                                            {item.symbol} {formatValue(displayValue)}
                                        </span>
                                    );
                                })}
                            </p>
                        )}
                    </div>
                    {icon && (
                        <div className={cn("p-3 rounded-xl bg-primary/10 text-primary transition-colors", iconClassName)}>
                            {icon}
                        </div>
                    )}
                </div>
                {(trend || description) && (
                    <div className="mt-4 flex items-center gap-2 text-xs">
                        {trend && (
                            <span className={cn(
                                "font-medium px-2 py-0.5 rounded-full flex items-center gap-1 transition-shadow",
                                trend.direction === "up" && "bg-amount-positive/10 text-amount-positive glow-positive",
                                trend.direction === "down" && "bg-amount-negative/10 text-amount-negative glow-negative",
                                trend.direction === "neutral" && "bg-muted text-muted-foreground"
                            )}>
                                {trend.direction === "up" && <TrendingUp className="w-3 h-3" />}
                                {trend.direction === "down" && <TrendingDown className="w-3 h-3" />}
                                {trend.direction === "neutral" && <Minus className="w-3 h-3" />}
                                {trend.value}
                            </span>
                        )}
                        {trend?.label && (
                            <span className="text-muted-foreground">{trend.label}</span>
                        )}
                        {description && !trend?.label && (
                            <span className="text-muted-foreground">{description}</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


