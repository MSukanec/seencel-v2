/**
 * Date Column Factory
 * Standard 19.1 - Reusable Date Column
 * 
 * Creates a standardized date column with:
 * - Format: "23 ene 2026" (or "Hoy" for today)
 * - Optional time display below
 * - Optional creator avatar (default: on)
 * - Optional relative dates (Hoy, Ayer, etc.)
 * - Inline editing via DatePicker popover (Linear-style)
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export interface DateColumnOptions<TData> {
    /** Column accessor key */
    accessorKey: string;
    /** Column header title (default: "Fecha") */
    title?: string;
    /** Show time below date (default: false) */
    showTime?: boolean;
    /** Use relative dates like "Hoy", "Ayer" (default: true for today only) */
    relativeMode?: "today-only" | "full" | "none";
    /** Show creator avatar (default: true) */
    showAvatar?: boolean;
    /** Key for avatar URL in row data (default: "creator_avatar_url") */
    avatarUrlKey?: keyof TData | string;
    /** Key for avatar fallback name (default: "creator_full_name") */
    avatarFallbackKey?: keyof TData | string;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Custom filter function (for date range filtering) */
    filterFn?: any;
    /** Column width in px (default: 140) */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Callback when date changes (required if editable) */
    onUpdate?: (row: TData, newDate: Date) => Promise<void> | void;
}

function formatStandardDate(date: Date): string {
    return format(date, "d MMM yyyy", { locale: es });
}

function formatTime(date: Date): string {
    return format(date, "HH:mm", { locale: es });
}

function getRelativeDate(date: Date, mode: "today-only" | "full" | "none"): string | null {
    if (mode === "none") return null;
    if (isToday(date)) return "Hoy";
    if (mode === "full") {
        if (isYesterday(date)) return "Ayer";
        const daysAgo = differenceInDays(new Date(), date);
        if (daysAgo > 0 && daysAgo <= 7) return `Hace ${daysAgo} días`;
    }
    return null;
}

// ─── Editable Date Cell ──────────────────────────────────

function EditableDateCell<TData>({
    row,
    dateToFormat,
    dateText,
    showTime,
    showAvatar,
    avatarUrl,
    avatarFallback,
    onUpdate,
}: {
    row: TData;
    dateToFormat: Date;
    dateText: string;
    showTime: boolean;
    showAvatar: boolean;
    avatarUrl: string | null;
    avatarFallback: string | null;
    onUpdate: (row: TData, newDate: Date) => Promise<void> | void;
}) {
    const [open, setOpen] = React.useState(false);
    const [calendarMonth, setCalendarMonth] = React.useState(dateToFormat);

    React.useEffect(() => {
        if (open) {
            setCalendarMonth(dateToFormat);
        }
    }, [open, dateToFormat]);

    const handleSelect = async (date: Date | undefined) => {
        if (!date) return;
        await onUpdate(row, date);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2.5 cursor-pointer rounded-md px-1.5 py-1 -mx-1.5 transition-all",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {showAvatar && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={avatarUrl || undefined} />
                            <AvatarFallback className="text-xs bg-muted">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{dateText}</span>
                        {showTime && (
                            <span className="text-xs text-muted-foreground font-[450]">
                                {formatTime(dateToFormat)}
                            </span>
                        )}
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0"
                align="start"
                side="bottom"
                onClick={(e) => e.stopPropagation()}
            >
                <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    showInput
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    selected={dateToFormat}
                    onSelect={handleSelect}
                    locale={es}
                    fromYear={2020}
                    toYear={new Date().getFullYear() + 1}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createDateColumn<TData>(
    options: DateColumnOptions<TData>
): ColumnDef<TData, any> {
    const {
        accessorKey,
        title = "Fecha",
        showTime = false,
        relativeMode = "today-only",
        showAvatar = true,
        avatarUrlKey = "creator_avatar_url",
        avatarFallbackKey = "creator_full_name",
        enableSorting = true,
        filterFn,
        size = 140,
        editable = false,
        onUpdate,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const value = row.getValue(accessorKey);
            if (!value) return <span className="text-muted-foreground">-</span>;

            const dateValue = String(value);
            const dateToFormat = dateValue.includes('T')
                ? new Date(dateValue)
                : new Date(dateValue + 'T12:00:00');

            const relativeText = getRelativeDate(dateToFormat, relativeMode);
            const dateText = relativeText || formatStandardDate(dateToFormat);

            const avatarUrl = showAvatar ? (row.original as any)[avatarUrlKey as string] : null;
            const avatarFallback = showAvatar
                ? ((row.original as any)[avatarFallbackKey as string]?.[0] || "?").toUpperCase()
                : null;

            if (editable && onUpdate) {
                return (
                    <EditableDateCell
                        row={row.original}
                        dateToFormat={dateToFormat}
                        dateText={dateText}
                        showTime={showTime}
                        showAvatar={showAvatar}
                        avatarUrl={avatarUrl}
                        avatarFallback={avatarFallback}
                        onUpdate={onUpdate}
                    />
                );
            }

            return (
                <div className="flex items-center gap-2.5">
                    {showAvatar && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={avatarUrl || undefined} />
                            <AvatarFallback className="text-xs bg-muted">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{dateText}</span>
                        {showTime && (
                            <span className="text-xs text-muted-foreground font-[450]">
                                {formatTime(dateToFormat)}
                            </span>
                        )}
                    </div>
                </div>
            );
        },
        enableSorting,
        size,
        ...(filterFn && { filterFn }),
    };
}
