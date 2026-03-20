/**
 * Severity Column Factory
 * Standard 19.X - Reusable Severity Column
 *
 * Renders a severity badge (colored background + icon) for low/medium/high levels.
 * Supports inline editing via Popover + SeverityPopoverContent.
 * Uses dedicated visual config from severity-popover-content.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Shield } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    SeverityPopoverContent,
    SeverityBadge,
    SeverityDot,
    DEFAULT_SEVERITY_OPTIONS,
    SEVERITY_VISUAL_CONFIG,
    type SeverityOption,
    type SeverityLevel,
} from "@/components/shared/popovers/severity-popover-content";
import { DataTableColumnHeader } from "../data-table-column-header";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface SeverityColumnOptions<TData> {
    /** Column accessor key (default: "severity") */
    accessorKey?: string;
    /** Column header title (default: "Severidad") */
    title?: string;
    /** Severity options (default: Baja/Media/Alta) */
    options?: SeverityOption[];
    /** Enable sorting (default: false) */
    enableSorting?: boolean;
    /** Column width in px (default: 120) */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Callback when severity changes (required if editable) */
    onUpdate?: (row: TData, newValue: string) => Promise<void> | void;
    /** Show badge style (true) or dot-only (false). Default: true */
    showBadge?: boolean;
}

// ─── Editable Severity Cell ──────────────────────────────

function EditableSeverityCell<TData>({
    row,
    accessorKey,
    options,
    onUpdate,
    showBadge,
}: {
    row: TData;
    accessorKey: string;
    options: SeverityOption[];
    onUpdate: (row: TData, newValue: string) => Promise<void> | void;
    showBadge: boolean;
}) {
    const [open, setOpen] = React.useState(false);
    const rawValue = (row as any)[accessorKey] as string | null;
    const currentValue = rawValue || "none";
    const config = options.find(o => o.value === currentValue);

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
                        "flex items-center cursor-pointer rounded-md px-1 py-0.5 -mx-1 transition-all",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <ReadOnlySeverityDisplay level={currentValue} label={config?.label || currentValue} showBadge={showBadge} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <SeverityPopoverContent
                    options={options}
                    currentValue={currentValue}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Read-only Severity Display ──────────────────────────

function ReadOnlySeverityDisplay({ level, label, showBadge }: { level: string; label: string; showBadge: boolean }) {
    if (!level || level === "none") {
        const noneConfig = SEVERITY_VISUAL_CONFIG["none"];
        const NoneIcon = noneConfig.icon;
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-[450]">
                <NoneIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-muted-foreground">{label || "Sin severidad"}</span>
            </span>
        );
    }

    if (showBadge) {
        return <SeverityBadge level={level} label={label} />;
    }

    const visualConfig = SEVERITY_VISUAL_CONFIG[level as SeverityLevel];
    const Icon = visualConfig?.icon || Shield;
    const colorClass = visualConfig?.labelClass || "text-muted-foreground";

    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-[450]">
            <Icon className={cn("h-3.5 w-3.5", colorClass)} />
            <span className="text-foreground">{label}</span>
        </span>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createSeverityColumn<TData>(
    options: SeverityColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "severity",
        title = "Severidad",
        options: severityOptions = DEFAULT_SEVERITY_OPTIONS,
        enableSorting = false,
        size = 120,
        editable = false,
        onUpdate,
        showBadge = false,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const rawValue = (row.original as any)[accessorKey] as string | null;
            const value = rawValue || "none"; // null/empty → "none"
            const config = severityOptions.find(o => o.value === value);
            const label = config?.label || value;

            if (editable && onUpdate) {
                return (
                    <EditableSeverityCell
                        row={row.original}
                        accessorKey={accessorKey}
                        options={severityOptions}
                        onUpdate={onUpdate}
                        showBadge={showBadge}
                    />
                );
            }

            return <ReadOnlySeverityDisplay level={value} label={label} showBadge={showBadge} />;
        },
        enableSorting,
        size,
        // Context menu metadata
        ...(editable && onUpdate ? {
            meta: {
                contextMenu: {
                    label: title,
                    icon: Shield,
                    options: severityOptions.map(o => ({
                        value: o.value,
                        label: o.label,
                        icon: <SeverityDot level={o.value} />,
                    })),
                    currentValueKey: accessorKey,
                    onSelect: (row: TData, value: string) => onUpdate(row, value),
                },
            },
        } : {}),
    };
}
