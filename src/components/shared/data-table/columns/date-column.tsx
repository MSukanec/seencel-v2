/**
 * Date Column Factory
 * Standard 19.1 - Reusable Date Column
 * 
 * Creates a standardized date column with:
 * - Format: "23 ene 2026" (or "Hoy" for today)
 * - Optional time display below
 * - Optional creator avatar (default: on)
 * - Optional relative dates (Hoy, Ayer, etc.)
 */

import { ColumnDef } from "@tanstack/react-table";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
}

/**
 * Formats a date as "23 ene 2026"
 */
function formatStandardDate(date: Date): string {
    return format(date, "d MMM yyyy", { locale: es });
}

/**
 * Formats time as "14:30"
 */
function formatTime(date: Date): string {
    return format(date, "HH:mm", { locale: es });
}

/**
 * Gets relative date text if applicable
 */
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

/**
 * Creates a date column with standard formatting
 */
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
    } = options;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const value = row.getValue(accessorKey);
            if (!value) return <span className="text-muted-foreground">-</span>;

            // IMPORTANT: DB DATE columns return "YYYY-MM-DD" strings.
            // new Date("2026-01-16") is interpreted as UTC midnight.
            // In UTC-3 (Argentina), this becomes "2026-01-15 21:00" local time.
            // By appending "T12:00", we ensure the date is interpreted at midday,
            // so even with timezone offset, it stays on the correct calendar day.
            const dateValue = String(value);
            const dateToFormat = dateValue.includes('T')
                ? new Date(dateValue)
                : new Date(dateValue + 'T12:00:00');

            const relativeText = getRelativeDate(dateToFormat, relativeMode);
            const dateText = relativeText || formatStandardDate(dateToFormat);

            // Avatar data
            const avatarUrl = showAvatar ? (row.original as any)[avatarUrlKey as string] : null;
            const avatarFallback = showAvatar
                ? ((row.original as any)[avatarFallbackKey as string]?.[0] || "?").toUpperCase()
                : null;

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
                            <span className="text-xs text-muted-foreground">
                                {formatTime(dateToFormat)}
                            </span>
                        )}
                    </div>
                </div>
            );
        },
        enableSorting,
        ...(filterFn && { filterFn }),
    };
}
