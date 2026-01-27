"use client";

import { cn } from "@/lib/utils";

interface FinancialValueDisplayProps {
    /** The formatted value string (e.g., "$ 31.431.097,69" or just "31.431.097,69") */
    value: string;
    /** Additional CSS classes */
    className?: string;
    /** 
     * Size variant
     * - 'default': text-3xl
     * - 'large': text-4xl (recommended for main KPIs)
     * - 'hero': text-5xl
     * - 'secondary': text-xl (for breakdown items)
     */
    size?: 'default' | 'large' | 'hero' | 'secondary';
    /** Whether to use compact notation (31.4M instead of 31,400,000) */
    compact?: boolean;
}

/**
 * Format a number in compact notation (K, M, B)
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
    if (absValue >= 10_000) {
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
 * Parse a value string to extract prefix (currency symbol) and number
 */
function parseValueString(value: string): { prefix: string; number: number | null; remaining: string } {
    // Match currency symbol/prefix at the start, then the number
    const match = value.match(/^([^\d\-]*)([\d.,\-]+)(.*)?/);
    if (!match) {
        return { prefix: '', number: null, remaining: value };
    }

    const prefix = match[1].trim();
    const remaining = (match[3] || '').trim();

    // Convert locale number to actual number (handle 1.000,00 format)
    const numStr = match[2]
        .replace(/\./g, '') // Remove thousand separators
        .replace(',', '.'); // Convert decimal separator

    return {
        prefix,
        number: parseFloat(numStr),
        remaining
    };
}

const sizeClasses = {
    secondary: 'text-xl',
    default: 'text-3xl',
    large: 'text-4xl',
    hero: 'text-5xl'
};

const prefixSizeClasses = {
    secondary: 'text-sm',
    default: 'text-base',
    large: 'text-lg',
    hero: 'text-xl'
};

/**
 * A global component for displaying financial values with proper hierarchy.
 * - Currency symbol/prefix is smaller and muted
 * - Main number is large and bold
 * - Optional compact notation (31.4M)
 */
export function FinancialValueDisplay({
    value,
    className,
    size = 'large',
    compact = true
}: FinancialValueDisplayProps) {
    const parsed = parseValueString(value);

    // If we couldn't parse, just render as-is
    if (parsed.number === null) {
        return (
            <span className={cn("font-bold tracking-tight", sizeClasses[size], className)}>
                {value}
            </span>
        );
    }

    // Format the number
    let displayValue: string;
    let suffix = '';

    if (compact) {
        const formatted = formatCompactValue(parsed.number);
        displayValue = formatted.value;
        suffix = formatted.suffix;
    } else {
        displayValue = parsed.number.toLocaleString('es-AR', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        });
    }

    return (
        <span className={cn("font-bold tracking-tight flex items-baseline gap-1", sizeClasses[size], className)}>
            {parsed.prefix && (
                <span className={cn("font-semibold text-muted-foreground", prefixSizeClasses[size])}>
                    {parsed.prefix}
                </span>
            )}
            <span>{displayValue}</span>
            {suffix && (
                <span className={cn("font-semibold text-muted-foreground", prefixSizeClasses[size])}>
                    {suffix}
                </span>
            )}
            {parsed.remaining && (
                <span className={cn("font-semibold text-muted-foreground", prefixSizeClasses[size])}>
                    {parsed.remaining}
                </span>
            )}
        </span>
    );
}
