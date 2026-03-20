/**
 * Weather Column Factory
 * Reusable Weather Column for DataTables
 *
 * Renders weather icon + label. Supports inline editing via Popover.
 * Uses dedicated visual config from weather-popover-content.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Cloud } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    WeatherPopoverContent,
    WeatherBadge,
    WeatherIcon,
    DEFAULT_WEATHER_OPTIONS,
    WEATHER_VISUAL_CONFIG,
    type WeatherOption,
    type WeatherType,
} from "@/components/shared/popovers/weather-popover-content";
import { DataTableColumnHeader } from "../data-table-column-header";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface WeatherColumnOptions<TData> {
    /** Column accessor key (default: "weather") */
    accessorKey?: string;
    /** Column header title (default: "Clima") */
    title?: string;
    /** Weather options (default: all from WEATHER_VISUAL_CONFIG) */
    options?: WeatherOption[];
    /** Enable sorting (default: false) */
    enableSorting?: boolean;
    /** Column width in px (default: 140) */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Callback when weather changes (required if editable) */
    onUpdate?: (row: TData, newValue: string) => Promise<void> | void;
}

// ─── Editable Weather Cell ───────────────────────────────

function EditableWeatherCell<TData>({
    row,
    accessorKey,
    options,
    onUpdate,
}: {
    row: TData;
    accessorKey: string;
    options: WeatherOption[];
    onUpdate: (row: TData, newValue: string) => Promise<void> | void;
}) {
    const [open, setOpen] = React.useState(false);
    const rawValue = (row as any)[accessorKey] as string | null;
    const currentValue = (!rawValue || rawValue === "none") ? null : rawValue;
    const config = currentValue ? WEATHER_VISUAL_CONFIG[currentValue as WeatherType] : null;

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
                    <WeatherBadge weather={currentValue} label={config?.label} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <WeatherPopoverContent
                    options={options}
                    currentValue={currentValue || ""}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createWeatherColumn<TData>(
    options: WeatherColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "weather",
        title = "Clima",
        options: weatherOptions = DEFAULT_WEATHER_OPTIONS,
        enableSorting = false,
        size = 140,
        editable = false,
        onUpdate,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const value = (row.original as any)[accessorKey] as string | null;

            if (editable && onUpdate) {
                return (
                    <EditableWeatherCell
                        row={row.original}
                        accessorKey={accessorKey}
                        options={weatherOptions}
                        onUpdate={onUpdate}
                    />
                );
            }

            // Read-only
            const normalizedValue = (!value || value === "none") ? null : value;
            const config = normalizedValue ? WEATHER_VISUAL_CONFIG[normalizedValue as WeatherType] : null;
            const label = config?.label || normalizedValue || undefined;
            return <WeatherBadge weather={normalizedValue} label={label} />;
        },
        enableSorting,
        size,
    };
}
