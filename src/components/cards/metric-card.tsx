"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMoney } from "@/hooks/use-money";
import type { MoneyInput } from "@/lib/money";
import { Sparkline } from "./sparkline";

// ============================================================================
// METRIC CARD — Displays a single important number (KPI)
// ============================================================================
// Unifies: DashboardKpiCard + BentoKpiCard
// Handles: multi-currency, compact notation, sparkline, trend badge, breakdown
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CurrencyBreakdownItem {
    currencyCode: string;
    symbol: string;
    nativeTotal: number;
    functionalTotal?: number;
    isPrimary: boolean;
}

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Card title */
    title: string;
    /**
     * Pre-formatted display value (legacy/custom mode).
     * Use `amount` instead for automatic currency formatting.
     */
    value?: string | number;
    /**
     * Raw monetary amount — formatted automatically via useMoney.
     * Preferred over `value` for new code.
     */
    amount?: number;
    /**
     * Array of MoneyInput items — summed automatically with currency conversion.
     * Generates breakdown automatically in mix mode.
     */
    items?: MoneyInput[];
    /** Card icon */
    icon?: React.ReactNode;
    /** Icon container className */
    iconClassName?: string;
    /** Trend badge */
    trend?: {
        value: string | number;
        direction: "up" | "down" | "neutral";
        label?: string;
    };
    /** Short description below the value */
    description?: string;
    /** External currency breakdown (auto-calculated if items are provided) */
    currencyBreakdown?: CurrencyBreakdownItem[];
    /** Use compact notation for large numbers (31.4M vs 31.400.000) */
    compact?: boolean;
    /**
     * Size variant for the value display
     * - default: text-3xl
     * - large: text-4xl with separated prefix
     * - hero: text-5xl for main dashboard KPIs
     */
    size?: "default" | "large" | "hero";
    /** Sparkline data (array of numbers) */
    sparkline?: number[];
    /** Sparkline intent for color */
    sparklineIntent?: "positive" | "negative" | "neutral" | "warning" | "info";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCompactValue(value: number, locale: string = "es-AR"): { value: string; suffix: string } {
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000_000) {
        return {
            value: (value / 1_000_000_000).toLocaleString(locale, { maximumFractionDigits: 1 }),
            suffix: "B",
        };
    }
    if (absValue >= 1_000_000) {
        return {
            value: (value / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 }),
            suffix: "M",
        };
    }
    if (absValue >= 1_000) {
        return {
            value: (value / 1_000).toLocaleString(locale, { maximumFractionDigits: 1 }),
            suffix: "K",
        };
    }
    return {
        value: value.toLocaleString(locale, { maximumFractionDigits: 0 }),
        suffix: "",
    };
}

function parseValueString(value: string): { prefix: string; number: number | null } {
    const match = value.match(/^([^\d\-]*)([\d.,\-]+)/);
    if (!match) return { prefix: "", number: null };

    const prefix = match[1].trim();
    const numStr = match[2].replace(/\./g, "").replace(",", ".");
    return { prefix, number: parseFloat(numStr) };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MetricCard({
    title,
    value,
    amount,
    items,
    icon,
    iconClassName,
    trend,
    description,
    currencyBreakdown: externalBreakdown,
    compact,
    size = "large",
    sparkline,
    sparklineIntent,
    className,
    ...props
}: MetricCardProps) {
    const money = useMoney();

    // Compact: use explicit or org preference
    const useCompact = compact !== undefined ? compact : (money.config.kpiCompactFormat ?? false);

    // Calculate sum from items (bimonetary support)
    const sumResult = items && items.length > 0 ? money.sum(items) : null;

    // Priority: items → amount → value
    let displayValue: string | number;
    if (sumResult) {
        displayValue = money.format(sumResult.total);
    } else if (amount !== undefined) {
        displayValue = money.format(amount);
    } else {
        displayValue = value ?? "";
    }

    // Auto-calculate breakdown from sumResult
    const currencyBreakdown = sumResult
        ? sumResult.breakdown.map((b) => ({ ...b, functionalTotal: b.nativeTotal }))
        : externalBreakdown;

    const decimalPlaces = (sumResult || amount !== undefined)
        ? money.config.decimalPlaces
        : 2;

    const showBreakdown = currencyBreakdown && currencyBreakdown.length > 1 && money.displayMode === "mix";

    const formatVal = (val: number) =>
        val.toLocaleString("es-AR", {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        });

    // Auto-detect sparkline intent from amount
    const resolvedIntent = sparklineIntent ?? (
        typeof amount === "number"
            ? amount >= 0 ? "positive" : "negative"
            : "neutral"
    );

    // ── Render value ─────────────────────────────────────────────────────
    const renderValue = () => {
        const sizeClasses = {
            default: "text-3xl",
            large: "text-4xl",
            hero: "text-5xl",
        };

        // Compact + string
        if (useCompact && typeof displayValue === "string") {
            if (displayValue.endsWith("%")) {
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

        // Compact + number
        if (useCompact && typeof displayValue === "number") {
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

        // Large/hero: separate prefix for visual hierarchy
        if (size !== "default" && typeof displayValue === "string") {
            const parsed = parseValueString(displayValue);
            if (parsed.prefix) {
                const remaining = displayValue
                    .substring(displayValue.indexOf(parsed.prefix) + parsed.prefix.length)
                    .trim();
                return (
                    <h2 className={cn("font-bold tracking-tight mt-2 flex items-baseline gap-1", sizeClasses[size])}>
                        <span className="text-lg font-semibold text-muted-foreground">{parsed.prefix}</span>
                        <span>{remaining}</span>
                    </h2>
                );
            }
        }

        // Default
        return (
            <h2 className={cn("font-bold tracking-tight mt-2", sizeClasses[size])}>
                {displayValue}
            </h2>
        );
    };

    // ── Main render ──────────────────────────────────────────────────────
    return (
        <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)} {...props}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        {renderValue()}

                        {/* Currency Breakdown */}
                        {showBreakdown && (
                            <p className="mt-1 text-xs text-muted-foreground font-medium">
                                {currencyBreakdown.map((item, index) => {
                                    const isNegative = item.nativeTotal < 0;
                                    const displayVal = Math.abs(item.nativeTotal);
                                    return (
                                        <span key={item.currencyCode}>
                                            {index > 0 && (isNegative ? " - " : " + ")}
                                            {index === 0 && isNegative && "-"}
                                            {item.symbol} {formatVal(displayVal)}
                                        </span>
                                    );
                                })}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {icon && (
                            <div className={cn("p-3 rounded-xl bg-primary/10 text-primary transition-colors", iconClassName)}>
                                {icon}
                            </div>
                        )}
                        {sparkline && sparkline.length >= 2 && (
                            <Sparkline data={sparkline} intent={resolvedIntent} width={80} height={32} />
                        )}
                    </div>
                </div>

                {/* Trend + Description footer */}
                {(trend || description) && (
                    <div className="mt-4 flex items-center gap-2 text-xs">
                        {trend && (
                            <span className={cn(
                                "font-medium px-2 py-0.5 rounded-full flex items-center gap-1 transition-shadow",
                                trend.direction === "up" && "bg-amount-positive/10 text-amount-positive",
                                trend.direction === "down" && "bg-amount-negative/10 text-amount-negative",
                                trend.direction === "neutral" && "bg-muted text-muted-foreground",
                            )}>
                                {trend.direction === "up" && <TrendingUp className="w-3 h-3" />}
                                {trend.direction === "down" && <TrendingDown className="w-3 h-3" />}
                                {trend.direction === "neutral" && <Minus className="w-3 h-3" />}
                                {trend.value}
                            </span>
                        )}
                        {trend?.label && <span className="text-muted-foreground">{trend.label}</span>}
                        {description && !trend?.label && <span className="text-muted-foreground">{description}</span>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
