/**
 * Entity Column Factory
 * Standard 19.6 - Reusable Entity/Type Column
 * 
 * Renders a column with title + optional subtitle + optional avatar.
 * Ideal for "Tipo" columns that show a mapped label with extra context.
 * Supports inline editing via Popover + Command (same UI as chips).
 * 
 * Examples:
 *   - Movement type: "Cobro Cliente" + "Presupuesto inicial" (no avatar)
 *   - Capital type: "Aporte" + "Pablo D. Peyras" (with avatar)
 *   - Concept: "Alquiler" + inline editing via Command selector
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Tag, type LucideIcon } from "lucide-react";
import { DataTableColumnHeader } from "../data-table-column-header";
import { DataTableAvatarCell } from "../data-table-avatar-cell";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SelectPopoverContent } from "@/components/shared/popovers";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { CELL_VALUE_CLASS, CELL_EMPTY_CLASS, EDITABLE_CELL_CLASS, EDITABLE_CELL_LOADING_CLASS } from "./column-styles";

// ─── Types ───────────────────────────────────────────────

export interface EntityOption {
    /** Value stored in DB (e.g. concept ID or name) */
    value: string;
    /** Display label */
    label: string;
    /** Optional subtitle (e.g. category name) */
    subtitle?: string;
}

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
    /** Text to show when value is empty/null (default: "-") */
    emptyValue?: string;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Available options for inline editing (required if editable) */
    entityOptions?: EntityOption[];
    /** Callback when entity changes (required if editable) */
    onUpdate?: (row: TData, newValue: string) => Promise<void> | void;
    /** Search placeholder for inline editing popover */
    editSearchPlaceholder?: string;
    /** Route object for router.push when "Gestionar..." is clicked. Use { pathname, query } format. */
    manageRoute?: any;
    /** Label for the manage footer action (default: "Gestionar") */
    manageLabel?: string;
    /** Message when no results found (default: "No hay opciones disponibles.") */
    emptySearchMessage?: string;
    /** Custom icon for the popover and context menu (default: Tag) */
    icon?: LucideIcon;
    /** Map of option value → icon to show in cell (e.g. person/company icons) */
    optionIcons?: Record<string, React.ReactNode>;
}

// ─── Editable Entity Cell ────────────────────────────────

function EditableEntityCell<TData>({
    row,
    displayTitle,
    subtitle,
    emptyValue,
    entityOptions,
    onUpdate,
    searchPlaceholder,
    accessorKey,
    manageRoute,
    manageLabel,
    emptySearchMessage,
    icon,
    optionIcons,
}: {
    row: TData;
    displayTitle: string | null;
    subtitle: string | null | undefined;
    emptyValue: string;
    entityOptions: EntityOption[];
    onUpdate: (row: TData, newValue: string) => Promise<void> | void;
    searchPlaceholder: string;
    accessorKey: string;
    manageRoute?: any;
    manageLabel?: string;
    emptySearchMessage?: string;
    icon?: LucideIcon;
    optionIcons?: Record<string, React.ReactNode>;
}) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const currentValue = (row as any)[accessorKey] as string;
    const IconComp = icon || Tag;

    const handleSelect = (value: string) => {
        setOpen(false);
        if (value !== currentValue) {
            onUpdate(row, value);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex flex-col text-left",
                        EDITABLE_CELL_CLASS,
                        loading && EDITABLE_CELL_LOADING_CLASS
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className={cn(
                        "flex items-center gap-1.5",
                        displayTitle ? CELL_VALUE_CLASS : CELL_EMPTY_CLASS
                    )}>
                        {optionIcons?.[currentValue] || <IconComp className="h-3.5 w-3.5 text-muted-foreground" />}
                        {displayTitle || emptyValue}
                    </span>
                    {subtitle && (
                        <span className="text-xs text-muted-foreground font-[450]">{subtitle}</span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <SelectPopoverContent
                    options={entityOptions}
                    currentValue={currentValue}
                    onSelect={handleSelect}
                    onOpenChange={setOpen}
                    searchPlaceholder={searchPlaceholder}
                    emptyText={emptySearchMessage || "No hay opciones disponibles."}
                    defaultIcon={<IconComp className="h-3.5 w-3.5 text-muted-foreground" />}
                    manageRoute={manageRoute}
                    manageLabel={manageLabel}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

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
        emptyValue = "-",
        editable = false,
        entityOptions = [],
        onUpdate,
        editSearchPlaceholder = "Buscar...",
        manageRoute,
        manageLabel,
        emptySearchMessage,
        icon,
        optionIcons,
    } = options;

    const IconComponent = icon || Tag;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const rawValue = row.getValue(accessorKey) as string;
            const displayTitle = labels ? (labels[rawValue] || rawValue) : rawValue;
            const subtitle = getSubtitle ? getSubtitle(row.original) : undefined;

            // Editable mode — Popover + Command (same UI as chips)
            if (editable && onUpdate) {
                return (
                    <EditableEntityCell
                        row={row.original}
                        displayTitle={displayTitle}
                        subtitle={subtitle}
                        emptyValue={emptyValue}
                        entityOptions={entityOptions}
                        onUpdate={onUpdate}
                        searchPlaceholder={editSearchPlaceholder}
                        accessorKey={accessorKey}
                        manageRoute={manageRoute}
                        manageLabel={manageLabel}
                        emptySearchMessage={emptySearchMessage}
                        icon={icon}
                        optionIcons={optionIcons}
                    />
                );
            }

            if (showAvatar) {
                const avatarUrl = getAvatarUrl ? getAvatarUrl(row.original) : undefined;
                const fallbackRaw = getAvatarFallback
                    ? getAvatarFallback(row.original)
                    : displayTitle;
                const fallback = (fallbackRaw?.[0] || "?").toUpperCase();

                return (
                    <DataTableAvatarCell
                        title={displayTitle || emptyValue}
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
                        <span className={cn(displayTitle ? CELL_VALUE_CLASS : CELL_EMPTY_CLASS)}>{displayTitle || emptyValue}</span>
                        <span className="text-xs text-muted-foreground font-[450]">{subtitle}</span>
                    </div>
                );
            }

            return (
                <span className={cn(
                    "flex items-center gap-1.5",
                    displayTitle ? CELL_VALUE_CLASS : CELL_EMPTY_CLASS
                )}>
                    {optionIcons?.[rawValue] || <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />}
                    {displayTitle || emptyValue}
                </span>
            );
        },
        enableSorting,
        ...(size && { size }),
        // Context menu metadata for right-click menus
        ...(editable && onUpdate && entityOptions.length > 0 ? {
            meta: {
                contextMenu: {
                    label: title,
                    icon: IconComponent,
                    options: entityOptions.map(o => ({
                        value: o.value,
                        label: o.label,
                    })),
                    currentValueKey: accessorKey,
                    onSelect: (row: TData, value: string) => onUpdate(row, value),
                },
            },
        } : {}),
    };
}
