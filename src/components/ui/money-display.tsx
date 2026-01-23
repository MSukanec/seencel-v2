"use client";

import { useCurrencyOptional } from '@/providers/currency-context';
import { Currency } from '@/types/currency';
import { formatCurrency } from '@/lib/currency-utils';
import { cn } from '@/lib/utils';

interface MoneyDisplayProps {
    /** Amount in native currency */
    amount: number;

    /** Currency of the amount (code string or Currency object) */
    currency?: Currency | string;

    /** Exchange rate at the time of transaction */
    exchangeRate?: number;

    /** Pre-calculated functional amount (if available from DB) */
    functionalAmount?: number;

    /** Display mode: original, functional, or both */
    display?: 'original' | 'functional' | 'both' | 'auto';

    /** Show currency code after amount */
    showCode?: boolean;

    /** Custom className */
    className?: string;

    /** Smaller secondary amount style */
    compactBreakdown?: boolean;
}

/**
 * MoneyDisplay - Enterprise-grade monetary amount display component
 * 
 * Automatically handles bi-currency display based on:
 * - CurrencyContext display preference
 * - Explicit display prop override
 * - Showing breakdown when amount is in secondary currency
 * 
 * Usage:
 * <MoneyDisplay amount={1000} currency="USD" exchangeRate={1500} />
 * // Renders: "$1.500.000" or "U$D 1.000" or both based on context
 */
export function MoneyDisplay({
    amount,
    currency,
    exchangeRate = 1,
    functionalAmount,
    display = 'auto',
    showCode = false,
    className,
    compactBreakdown = true,
}: MoneyDisplayProps) {
    const currencyContext = useCurrencyOptional();

    // Extract currency info
    const currencyCode = typeof currency === 'string'
        ? currency
        : currency?.code;

    const currencySymbol = typeof currency === 'object'
        ? currency.symbol
        : undefined;

    // Determine primary currency code from context
    const primaryCode = currencyContext?.primaryCurrency?.code || 'ARS';

    // Calculate functional amount if not provided
    const calculatedFunctionalAmount = functionalAmount
        ?? (currencyCode === primaryCode
            ? amount
            : amount * exchangeRate);

    // Determine what to display
    const effectiveDisplay = display === 'auto'
        ? currencyContext?.displayCurrency || 'primary'
        : display;

    // Is this in the primary (functional) currency?
    const isInPrimary = !currencyCode || currencyCode === primaryCode;

    // Format amounts
    const formattedOriginal = formatCurrency(amount, currency);
    const formattedFunctional = formatCurrency(
        calculatedFunctionalAmount,
        currencyContext?.primaryCurrency || 'ARS'
    );

    // Render based on display mode
    if (effectiveDisplay === 'original' || (effectiveDisplay === 'primary' && isInPrimary)) {
        return (
            <span className={cn("font-medium tabular-nums", className)}>
                {formattedOriginal}
                {showCode && currencyCode && (
                    <span className="text-muted-foreground ml-1 text-xs">{currencyCode}</span>
                )}
            </span>
        );
    }

    if (effectiveDisplay === 'functional' || effectiveDisplay === 'primary') {
        return (
            <span className={cn("font-medium tabular-nums", className)}>
                {formattedFunctional}
                {showCode && (
                    <span className="text-muted-foreground ml-1 text-xs">{primaryCode}</span>
                )}
            </span>
        );
    }

    // Both mode - show functional with original breakdown
    if (effectiveDisplay === 'both' || effectiveDisplay === 'secondary') {
        if (isInPrimary) {
            // No conversion needed, just show the amount
            return (
                <span className={cn("font-medium tabular-nums", className)}>
                    {formattedOriginal}
                </span>
            );
        }

        // Show functional amount with original in parentheses
        return (
            <span className={cn("font-medium tabular-nums", className)}>
                {formattedFunctional}
                {compactBreakdown ? (
                    <span className="text-muted-foreground text-xs ml-1">
                        ({formattedOriginal})
                    </span>
                ) : (
                    <span className="block text-muted-foreground text-sm">
                        {formattedOriginal} @ {exchangeRate.toLocaleString()}
                    </span>
                )}
            </span>
        );
    }

    // Fallback
    return (
        <span className={cn("font-medium tabular-nums", className)}>
            {formattedOriginal}
        </span>
    );
}

/**
 * Simplified version for KPI cards that shows breakdown
 */
interface MoneyKpiProps {
    /** Total in functional currency */
    totalFunctional: number;

    /** Optional breakdown by native currency */
    breakdown?: {
        currencyCode: string;
        symbol: string;
        nativeTotal: number;
        isPrimary: boolean;
    }[];

    className?: string;
}

export function MoneyKpi({ totalFunctional, breakdown, className }: MoneyKpiProps) {
    const currencyContext = useCurrencyOptional();
    const primarySymbol = currencyContext?.primaryCurrency?.symbol || '$';

    const formattedTotal = formatCurrency(
        totalFunctional,
        currencyContext?.primaryCurrency || 'ARS'
    );

    return (
        <div className={cn("space-y-1", className)}>
            <span className="text-2xl font-bold tabular-nums">
                {formattedTotal}
            </span>
            {breakdown && breakdown.length > 1 && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                    {breakdown.map((b) => (
                        <div key={b.currencyCode}>
                            {b.isPrimary ? (
                                <span>{b.symbol} {b.nativeTotal.toLocaleString()} nativo</span>
                            ) : (
                                <span>+ {b.currencyCode} {b.nativeTotal.toLocaleString()}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

