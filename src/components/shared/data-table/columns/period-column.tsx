/**
 * Period Column Factory
 * Standard 19.10 - Reusable Period Column
 *
 * Renders a period column showing the "covers_period" for recurring concepts.
 * Shows "Sin recurrencia" when concept is not recurring.
 * Supports inline editing via Popover with UnifiedDatePicker.
 * Includes footer action to navigate to concepts management.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { CalendarRange, Settings } from "lucide-react";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UnifiedDatePicker, type DatePickerMode } from "@/components/shared/unified-date-picker";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export type PeriodGranularity = "month" | "quarter" | "half-year" | "year";

export interface PeriodColumnOptions<TData> {
    /** Column accessor key (default: "covers_period") */
    accessorKey?: string;
    /** Column header title (default: "Período") */
    title?: string;
    /** Key to check if the row's concept is recurring (default: "is_recurring") */
    isRecurringKey?: string;
    /** Key to get the recurrence interval (default: "recurrence_interval") */
    recurrenceIntervalKey?: string;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Column width in px (default: 140) */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Callback when period changes (required if editable) */
    onUpdate?: (row: TData, newValue: string | null) => Promise<void> | void;
    /** Route object for router.push when "Gestionar conceptos" is clicked. Use { pathname, query } format. */
    manageRoute?: any;
}

// ─── Constants ───────────────────────────────────────────

const MONTH_FULL = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// ─── Helpers ─────────────────────────────────────────────

function recurrenceToGranularity(interval: string | null | undefined): PeriodGranularity {
    switch (interval) {
        case "monthly": return "month";
        case "quarterly": return "quarter";
        case "yearly": return "year";
        default: return "month";
    }
}

function formatPeriod(value: string | null | undefined, granularity: PeriodGranularity): string {
    if (!value) return "";

    let year: number;
    let month: number;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const d = new Date(value + "T12:00:00");
        year = d.getFullYear();
        month = d.getMonth();
    } else if (/^\d{4}-\d{2}$/.test(value)) {
        const [y, m] = value.split("-").map(Number);
        year = y;
        month = m - 1;
    } else {
        return "";
    }

    switch (granularity) {
        case "month": return `${MONTH_FULL[month]} ${year}`;
        case "quarter": return `Q${Math.floor(month / 3) + 1} ${year}`;
        case "half-year": return `H${month < 6 ? 1 : 2} ${year}`;
        case "year": return `${year}`;
    }
}

// ─── Editable Cell ───────────────────────────────────────

function EditablePeriodCell<TData>({
    row,
    accessorKey,
    isRecurringKey,
    recurrenceIntervalKey,
    onUpdate,
    manageRoute,
}: {
    row: TData;
    accessorKey: string;
    isRecurringKey: string;
    recurrenceIntervalKey: string;
    onUpdate: (row: TData, newValue: string | null) => Promise<void> | void;
    manageRoute?: any;
}) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);

    const value = (row as any)[accessorKey] as string | null;
    const isRecurring = (row as any)[isRecurringKey] as boolean | null;
    const recurrenceInterval = (row as any)[recurrenceIntervalKey] as string | null;
    const granularity = recurrenceToGranularity(recurrenceInterval);
    const modes: DatePickerMode[] = [granularity];
    const [activeMode, setActiveMode] = React.useState<DatePickerMode>(granularity);

    // Sync activeMode when granularity changes
    React.useEffect(() => {
        setActiveMode(granularity);
    }, [granularity]);

    const displayText = isRecurring
        ? (value ? formatPeriod(value, granularity) : "Sin período")
        : "Sin recurrencia";

    const handleSelect = (iso: string) => {
        setOpen(false);
        onUpdate(row, iso);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-1.5 cursor-pointer rounded-md px-1.5 py-0.5 -mx-1.5 transition-all text-left whitespace-nowrap",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                        isRecurring && value
                            ? "text-xs font-medium text-foreground"
                            : "text-xs text-muted-foreground/60 italic",
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <CalendarRange className="h-3 w-3 shrink-0 text-muted-foreground" />
                    {displayText}
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[320px] p-0"
                align="start"
                onClick={(e) => e.stopPropagation()}
            >
                {isRecurring ? (
                    <div className="flex flex-col">
                        <div className="p-3">
                            <UnifiedDatePicker
                                mode={activeMode}
                                modes={modes}
                                onModeChange={setActiveMode}
                                periodValue={value || ""}
                                onSelectPeriod={handleSelect}
                                showSearch
                                searchPlaceholder="Ej: Mar 2026, Q4 2027"
                            />
                        </div>
                        {/* Clear period option — same styling as CommandItem */}
                        {value && (
                            <>
                                <div className="h-px bg-border" />
                                <div className="p-1">
                                    <button
                                        className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                                        onClick={() => {
                                            setOpen(false);
                                            onUpdate(row, null);
                                        }}
                                    >
                                        <CalendarRange className="h-3.5 w-3.5" />
                                        <span>Quitar período</span>
                                    </button>
                                </div>
                            </>
                        )}
                        {/* Manage concepts footer — identical to wallet/currency */}
                        {manageRoute && (
                            <>
                                <div className="h-px bg-border" />
                                <div className="p-1">
                                    <button
                                        className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                                        onClick={() => {
                                            setOpen(false);
                                            router.push(manageRoute as any);
                                        }}
                                    >
                                        <Settings className="h-3.5 w-3.5" />
                                        <span>Gestionar conceptos</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="px-3 py-4 text-center">
                            <p className="text-xs text-muted-foreground">
                                El concepto no tiene recurrencia configurada.
                            </p>
                        </div>
                        {/* Manage concepts footer — identical to wallet/currency */}
                        {manageRoute && (
                            <>
                                <div className="h-px bg-border" />
                                <div className="p-1">
                                    <button
                                        className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                                        onClick={() => {
                                            setOpen(false);
                                            router.push(manageRoute as any);
                                        }}
                                    >
                                        <Settings className="h-3.5 w-3.5" />
                                        <span>Gestionar conceptos</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createPeriodColumn<TData>(
    options: PeriodColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "covers_period",
        title = "Período",
        isRecurringKey = "is_recurring",
        recurrenceIntervalKey = "recurrence_interval",
        enableSorting = true,
        size = 140,
        editable = false,
        onUpdate,
        manageRoute,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={title} />
        ),
        cell: ({ row }) => {
            const value = row.getValue(accessorKey) as string | null;
            const isRecurring = (row.original as any)[isRecurringKey] as boolean | null;
            const recurrenceInterval = (row.original as any)[recurrenceIntervalKey] as string | null;
            const granularity = recurrenceToGranularity(recurrenceInterval);

            // Editable mode
            if (editable && onUpdate) {
                return (
                    <EditablePeriodCell
                        row={row.original}
                        accessorKey={accessorKey}
                        isRecurringKey={isRecurringKey}
                        recurrenceIntervalKey={recurrenceIntervalKey}
                        onUpdate={onUpdate}
                        manageRoute={manageRoute}
                    />
                );
            }

            // Read-only
            if (!isRecurring) {
                return (
                    <span className="text-xs text-muted-foreground/60 italic">
                        Sin recurrencia
                    </span>
                );
            }

            if (!value) {
                return (
                    <span className="text-xs text-muted-foreground/60 italic">
                        Sin período
                    </span>
                );
            }

            return (
                <div className="flex items-center gap-1.5">
                    <CalendarRange className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium">
                        {formatPeriod(value, granularity)}
                    </span>
                </div>
            );
        },
        enableSorting,
        size,
    };
}
