/**
 * Address Column Factory
 *
 * Creates a standardized address column showing:
 * - MapPin icon + city, country as abbreviated label
 * - Inline editing via Popover with AddressPopoverContent (Google Maps + Places)
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MapPin } from "lucide-react";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AddressPopoverContent, type AddressData } from "@/components/shared/popovers";
import { cn } from "@/lib/utils";
import { CELL_VALUE_CLASS, CELL_EMPTY_CLASS, EDITABLE_CELL_CLASS } from "./column-styles";

// ─── Types ───────────────────────────────────────────────

export interface AddressColumnOptions<TData> {
    /** Column accessor key (default: "city") */
    accessorKey?: string;
    /** Column header title (default: "Ubicación") */
    title?: string;
    /** Value when empty (default: "—") */
    emptyValue?: string;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Build AddressData from row */
    getAddressData?: (row: TData) => AddressData | null;
    /** Callback when address changes */
    onUpdate?: (row: TData, data: AddressData) => Promise<void> | void;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
}

// ─── Editable Cell ───────────────────────────────────────

function EditableAddressCell<TData>({
    row,
    addressData,
    onUpdate,
    emptyValue,
}: {
    row: TData;
    addressData: AddressData | null;
    onUpdate: (row: TData, data: AddressData) => Promise<void> | void;
    emptyValue: string;
}) {
    const [open, setOpen] = React.useState(false);

    const label = addressData
        ? [addressData.city, addressData.country].filter(Boolean).join(", ") || addressData.address
        : null;

    const handleSelect = (data: AddressData) => {
        setOpen(false);
        onUpdate(row, data);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn("flex items-center gap-1.5", EDITABLE_CELL_CLASS)}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    {label ? (
                        <span className={CELL_VALUE_CLASS}>{label}</span>
                    ) : (
                        <span className={CELL_EMPTY_CLASS}>{emptyValue}</span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[340px] p-0"
                align="start"
                onClick={(e) => e.stopPropagation()}
            >
                <AddressPopoverContent
                    currentValue={addressData}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createAddressColumn<TData>(
    options: AddressColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "city",
        title = "Ubicación",
        emptyValue = "—",
        editable = false,
        getAddressData,
        onUpdate,
        enableSorting = true,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            if (editable && onUpdate && getAddressData) {
                const addressData = getAddressData(row.original);
                return (
                    <EditableAddressCell
                        row={row.original}
                        addressData={addressData}
                        onUpdate={onUpdate}
                        emptyValue={emptyValue}
                    />
                );
            }

            // Read-only: show MapPin + city, country
            const rowData = row.original as any;
            const city = rowData.city || rowData.address_city;
            const country = rowData.country || rowData.address_country;
            const parts = [city, country].filter(Boolean);

            if (parts.length === 0) {
                return <span className={CELL_EMPTY_CLASS}>{emptyValue}</span>;
            }

            return (
                <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className={CELL_VALUE_CLASS}>{parts.join(", ")}</span>
                </div>
            );
        },
        enableSorting,
    };
}
