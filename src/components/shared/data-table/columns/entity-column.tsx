/**
 * Entity Column Factory
 * Standard 19.6 - Reusable Entity/Type Column
 * 
 * Renders a column with title + optional subtitle + optional avatar.
 * Ideal for "Tipo" columns that show a mapped label with extra context.
 * 
 * Examples:
 *   - Movement type: "Cobro Cliente" + "Presupuesto inicial" (no avatar)
 *   - Capital type: "Aporte" + "Pablo D. Peyras" (with avatar)
 *   - Participant name: "Matías Sukanec" (with avatar, no mapping)
 */

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { DataTableAvatarCell } from "../data-table-avatar-cell";

export interface EntityColumnOptions<TData> {
    /** Column accessor key */
    accessorKey: string;
    /** Column header title (default: "Tipo") */
    title?: string;
    /** Map of raw value → display label. If omitted, raw value is shown. */
    labels?: Record<string, string>;
    /** Function to get subtitle text from row */
    getSubtitle?: (row: TData) => string | null | undefined;
    /** Show avatar (default: false) */
    showAvatar?: boolean;
    /** Function to get avatar image URL */
    getAvatarUrl?: (row: TData) => string | null | undefined;
    /** Function to get avatar fallback (initials). Default: first char of title */
    getAvatarFallback?: (row: TData) => string | null | undefined;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Column width in px */
    size?: number;
}

export function createEntityColumn<TData>(
    options: EntityColumnOptions<TData>
): ColumnDef<TData, any> {
    const {
        accessorKey,
        title = "Tipo",
        labels,
        getSubtitle,
        showAvatar = false,
        getAvatarUrl,
        getAvatarFallback,
        enableSorting = true,
        size,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const rawValue = row.getValue(accessorKey) as string;
            const displayTitle = labels ? (labels[rawValue] || rawValue) : rawValue;
            const subtitle = getSubtitle ? getSubtitle(row.original) : undefined;

            if (showAvatar) {
                const avatarUrl = getAvatarUrl ? getAvatarUrl(row.original) : undefined;
                const fallbackRaw = getAvatarFallback
                    ? getAvatarFallback(row.original)
                    : displayTitle;
                const fallback = (fallbackRaw?.[0] || "?").toUpperCase();

                return (
                    <DataTableAvatarCell
                        title={displayTitle || "-"}
                        subtitle={subtitle || undefined}
                        src={avatarUrl || undefined}
                        fallback={fallback}
                    />
                );
            }

            // No avatar — simple text with optional subtitle
            if (subtitle) {
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{displayTitle || "-"}</span>
                        <span className="text-xs text-muted-foreground font-[450]">{subtitle}</span>
                    </div>
                );
            }

            return <span className="text-sm font-medium">{displayTitle || "-"}</span>;
        },
        enableSorting,
        ...(size && { size }),
    };
}
