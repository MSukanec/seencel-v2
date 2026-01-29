/**
 * Text Column Factory
 * Standard 19.2 - Reusable Text Column
 * 
 * Creates a standardized text column with:
 * - Optional truncation with tooltip
 * - Optional subtitle
 * - Muted styling option
 * - Configurable empty value
 */

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";

export interface TextColumnOptions<TData> {
    /** Column accessor key */
    accessorKey: string;
    /** Column header title */
    title: string;
    /** Truncate text with max-width (true = 180px, number = custom px) */
    truncate?: boolean | number;
    /** Show full text in tooltip on hover (default: true when truncate is enabled) */
    showTooltip?: boolean;
    /** Use muted-foreground color (default: false) */
    muted?: boolean;
    /** Value to show when null/undefined (default: "-") */
    emptyValue?: string;
    /** Function to get subtitle text from row */
    subtitle?: (row: TData) => string | null | undefined;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Custom cell renderer override */
    customRender?: (value: string | null, row: TData) => React.ReactNode;
}

/**
 * Creates a text column with standard formatting
 */
export function createTextColumn<TData>(
    options: TextColumnOptions<TData>
): ColumnDef<TData, any> {
    const {
        accessorKey,
        title,
        truncate = false,
        showTooltip,
        muted = false,
        emptyValue = "-",
        subtitle,
        enableSorting = true,
        customRender,
    } = options;

    // Calculate max width
    const maxWidth = truncate === true ? 180 : typeof truncate === "number" ? truncate : undefined;
    const shouldShowTooltip = showTooltip ?? !!truncate;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const value = row.getValue(accessorKey) as string | null | undefined;
            const displayValue = value || emptyValue;
            const subtitleValue = subtitle ? subtitle(row.original) : null;

            // Custom render override
            if (customRender) {
                return customRender(value ?? null, row.original);
            }

            // Empty state
            if (!value) {
                return (
                    <span className="text-muted-foreground italic">
                        {emptyValue}
                    </span>
                );
            }

            // With truncation
            if (maxWidth) {
                return (
                    <div
                        className="flex flex-col"
                        style={{ maxWidth: `${maxWidth}px` }}
                        title={shouldShowTooltip ? displayValue : undefined}
                    >
                        <span className={`text-sm truncate ${muted ? "text-muted-foreground" : "font-medium"}`}>
                            {displayValue}
                        </span>
                        {subtitleValue && (
                            <span className="text-xs text-muted-foreground truncate">
                                {subtitleValue}
                            </span>
                        )}
                    </div>
                );
            }

            // Simple text
            if (subtitle) {
                return (
                    <div className="flex flex-col">
                        <span className={`text-sm ${muted ? "text-muted-foreground" : "font-medium"}`}>
                            {displayValue}
                        </span>
                        {subtitleValue && (
                            <span className="text-xs text-muted-foreground">
                                {subtitleValue}
                            </span>
                        )}
                    </div>
                );
            }

            return (
                <span className={`text-sm ${muted ? "text-muted-foreground" : ""}`}>
                    {displayValue}
                </span>
            );
        },
        enableSorting,
    };
}
