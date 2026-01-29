/**
 * Money Column Factory
 * Standard 19.3 - Reusable Money Column
 * 
 * Creates a standardized money column with:
 * - Automatic decimal formatting via useMoney (respects org preferences)
 * - Optional prefix (+/-)
 * - Optional color mode (positive/negative)
 * - Optional exchange rate subtitle
 */

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { useMoney } from "@/hooks/use-money";
import { cn } from "@/lib/utils";

export type MoneyColorMode = "positive" | "negative" | "auto" | "none";
export type MoneyPrefix = "+" | "-" | "auto" | "none";

export interface MoneyColumnOptions<TData> {
    /** Column accessor key for the amount */
    accessorKey: string;
    /** Column header title (default: "Monto") */
    title?: string;
    /** Prefix to show before amount (default: "none") */
    prefix?: MoneyPrefix;
    /** Color mode for the amount (default: "none") */
    colorMode?: MoneyColorMode;
    /** Key for currency symbol in row data (default: "currency_symbol") */
    currencyKey?: string;
    /** Key for exchange rate in row data (default: "exchange_rate") */
    exchangeRateKey?: string;
    /** Show exchange rate as subtitle when rate > 1 (default: true) */
    showExchangeRate?: boolean;
    /** Text alignment (default: "right") */
    align?: "left" | "right";
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** 
     * Key in row data used to determine sign (for prefix="auto" and colorMode="auto")
     * If provided, uses this field instead of amount sign
     * Example: "amount_sign" where 1 = positive, -1 = negative
     * Or: "type" where "contribution" = positive
     */
    signKey?: string;
    /** 
     * Value that signifies positive when signKey is used.
     * For numeric signKey: default is positive when > 0
     * For string signKey: you must specify the positive value (e.g., "contribution")
     */
    signPositiveValue?: string | number;
}

/**
 * Internal cell component that uses the useMoney hook
 */
function MoneyCell<TData>({
    row,
    options,
}: {
    row: { original: TData };
    options: MoneyColumnOptions<TData>;
}) {
    const money = useMoney();

    const {
        accessorKey,
        prefix = "none",
        colorMode = "none",
        currencyKey = "currency_symbol",
        exchangeRateKey = "exchange_rate",
        showExchangeRate = true,
        align = "right",
        signKey,
        signPositiveValue,
    } = options;

    const amount = Number((row.original as any)[accessorKey]) || 0;
    const currencySymbol = (row.original as any)[currencyKey] || money.config.functionalCurrencySymbol;
    const exchangeRate = Number((row.original as any)[exchangeRateKey]) || 1;

    // Determine if this is a positive value
    let isPositive = amount >= 0;
    if (signKey) {
        const signValue = (row.original as any)[signKey];
        if (signPositiveValue !== undefined) {
            // Explicit positive value provided
            isPositive = signValue === signPositiveValue;
        } else if (typeof signValue === 'number') {
            // Numeric sign key (e.g., amount_sign: 1 or -1)
            isPositive = signValue > 0;
        } else if (typeof signValue === 'string') {
            // String but no positive value specified - default to false
            isPositive = false;
        }
    }

    // Determine prefix
    let displayPrefix = "";
    if (prefix === "+") displayPrefix = "+";
    else if (prefix === "-") displayPrefix = "-";
    else if (prefix === "auto") displayPrefix = isPositive ? "+" : "-";

    // Determine color class
    let colorClass = "";
    if (colorMode === "positive") colorClass = "text-amount-positive";
    else if (colorMode === "negative") colorClass = "text-amount-negative";
    else if (colorMode === "auto") {
        colorClass = isPositive ? "text-amount-positive" : "text-amount-negative";
    }

    // Format amount (uses org's decimal preferences automatically)
    const displayAmount = `${displayPrefix}${currencySymbol} ${Math.abs(amount).toLocaleString('es-AR', {
        minimumFractionDigits: money.config.decimalPlaces,
        maximumFractionDigits: money.config.decimalPlaces,
    })}`;

    const showRate = showExchangeRate && exchangeRate > 1;

    return (
        <div className={cn("flex flex-col", align === "right" ? "items-end text-right" : "items-start")}>
            <span className={cn("font-mono font-medium", colorClass)}>
                {displayAmount}
            </span>
            {showRate && (
                <span className="text-xs text-muted-foreground font-mono">
                    Cot: {exchangeRate.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
            )}
        </div>
    );
}

/**
 * Creates a money column with standard formatting
 * Uses useMoney hook to respect organization's decimal preferences
 */
export function createMoneyColumn<TData>(
    options: MoneyColumnOptions<TData>
): ColumnDef<TData, any> {
    const {
        accessorKey,
        title = "Monto",
        align = "right",
        enableSorting = true,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => (
            <DataTableColumnHeader
                column={column}
                title={title}
                className={align === "right" ? "justify-end" : undefined}
            />
        ),
        cell: ({ row }) => <MoneyCell row={row} options={options} />,
        enableSorting,
    };
}
