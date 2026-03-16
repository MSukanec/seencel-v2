/**
 * Money Column Factory
 * Standard 19.3 - Reusable Money Column
 * 
 * Creates a standardized money column with:
 * - Automatic decimal formatting via useMoney (respects org preferences)
 * - Optional prefix (+/-)
 * - Optional color mode (positive/negative)
 * - Optional exchange rate subtitle
 * - Inline editing via click-to-input (no popover)
 */

"use client";

import * as React from "react";
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
    /** Column width in px (default: 130) */
    size?: number;
    /** Show currency symbol before amount (default: true). Set to false when currency has its own column. */
    showCurrencySymbol?: boolean;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Callback when amount changes (required if editable) */
    onUpdate?: (row: TData, newValue: number) => Promise<void> | void;
}

// ─── Editable Money Cell ─────────────────────────────────

function EditableMoneyCell<TData>({
    row,
    options,
}: {
    row: { original: TData };
    options: MoneyColumnOptions<TData>;
}) {
    const money = useMoney();
    const {
        accessorKey,
        currencyKey = "currency_symbol",
        align = "right",
        showCurrencySymbol = true,
        onUpdate,
    } = options;

    const amount = Number((row.original as any)[accessorKey]) || 0;
    const currencySymbol = (row.original as any)[currencyKey] || money.config.functionalCurrencySymbol;

    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Format for display
    const formattedNumber = Math.abs(amount).toLocaleString('es-AR', {
        minimumFractionDigits: money.config.decimalPlaces,
        maximumFractionDigits: money.config.decimalPlaces,
    });
    const displayAmount = showCurrencySymbol
        ? `${currencySymbol} ${formattedNumber}`
        : formattedNumber;

    const handleStartEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditValue(amount.toString());
        setIsEditing(true);
        // Focus after render
        setTimeout(() => inputRef.current?.select(), 10);
    };

    const handleSave = () => {
        setIsEditing(false);
        const parsed = parseFloat(editValue.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(parsed) && parsed !== amount && onUpdate) {
            onUpdate(row.original, parsed);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
        if (e.key === "Escape") {
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className={cn("flex", align === "right" ? "justify-end" : "justify-start")} onClick={(e) => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    className={cn(
                        "w-28 h-7 px-2 text-sm font-mono text-right bg-background border border-border rounded-md",
                        "focus:outline-none focus:ring-1 focus:ring-ring",
                    )}
                />
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col", align === "right" ? "items-end text-right" : "items-start")}>
            <button
                className={cn(
                    "text-sm font-medium cursor-pointer rounded-md px-1.5 py-0.5 -mx-1.5 transition-all whitespace-nowrap",
                    "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                )}
                onClick={handleStartEditing}
            >
                {displayAmount}
            </button>
        </div>
    );
}

/**
 * Internal cell component that uses the useMoney hook — read-only
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
        showCurrencySymbol = true,
    } = options;

    const amount = Number((row.original as any)[accessorKey]) || 0;
    const currencySymbol = (row.original as any)[currencyKey] || money.config.functionalCurrencySymbol;
    const exchangeRate = Number((row.original as any)[exchangeRateKey]) || 1;

    // Determine if this is a positive value or neutral (0 = neutral, no color/prefix)
    let isPositive = amount >= 0;
    let isNeutral = false;
    if (signKey) {
        const signValue = (row.original as any)[signKey];
        if (signPositiveValue !== undefined) {
            // Explicit positive value provided
            isPositive = signValue === signPositiveValue;
        } else if (typeof signValue === 'number') {
            // Numeric sign key (e.g., amount_sign: 1, -1, or 0 for neutral)
            if (signValue === 0) {
                isNeutral = true;
                isPositive = true; // doesn't matter, neutral overrides
            } else {
                isPositive = signValue > 0;
            }
        } else if (typeof signValue === 'string') {
            // String but no positive value specified - default to false
            isPositive = false;
        }
    }

    // Determine prefix (neutral = no prefix)
    let displayPrefix = "";
    if (!isNeutral) {
        if (prefix === "+") displayPrefix = "+";
        else if (prefix === "-") displayPrefix = "-";
        else if (prefix === "auto") displayPrefix = isPositive ? "+" : "-";
    }

    // Determine color class (neutral = no color)
    let colorClass = "";
    if (!isNeutral) {
        if (colorMode === "positive") colorClass = "text-amount-positive";
        else if (colorMode === "negative") colorClass = "text-amount-negative";
        else if (colorMode === "auto") {
            colorClass = isPositive ? "text-amount-positive" : "text-amount-negative";
        }
    }

    // Format amount (uses org's decimal preferences automatically)
    const formattedNumber = Math.abs(amount).toLocaleString('es-AR', {
        minimumFractionDigits: money.config.decimalPlaces,
        maximumFractionDigits: money.config.decimalPlaces,
    });
    const displayAmount = showCurrencySymbol
        ? `${displayPrefix}${currencySymbol} ${formattedNumber}`
        : `${displayPrefix}${formattedNumber}`;

    const showRate = showExchangeRate && exchangeRate > 1;

    return (
        <div className={cn("flex flex-col", align === "right" ? "items-end text-right" : "items-start")}>
            <span className={cn("text-sm font-medium", colorClass)}>
                {displayAmount}
            </span>
            {showRate && (
                <span className="text-xs text-muted-foreground font-[450]">
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
        size = 130,
        editable = false,
        onUpdate,
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
        cell: ({ row }) => {
            if (editable && onUpdate) {
                return <EditableMoneyCell row={row} options={options} />;
            }
            return <MoneyCell row={row} options={options} />;
        },
        enableSorting,
        size,
    };
}
