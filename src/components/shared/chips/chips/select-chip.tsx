/**
 * SelectChip — Generic chip for selecting from a list
 *
 * Used for: concepts, categories, or any discrete list selector.
 * Renders an icon + label. Popover shows SelectPopoverContent.
 */

"use client";

import * as React from "react";
import { Tag } from "lucide-react";
import { SelectPopoverContent, type SelectPopoverOption } from "@/components/shared/popovers";
import { ChipBase } from "../chip-base";

// ─── Types ───────────────────────────────────────────────

export type { SelectPopoverOption as SelectChipOption } from "@/components/shared/popovers";

export interface SelectChipProps {
    value: string;
    onChange: (value: string) => void | Promise<void>;
    options: SelectPopoverOption[];
    /** Icon for the chip trigger (default: Tag) */
    icon?: React.ReactNode;
    /** Placeholder for the empty state */
    emptyLabel?: string;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** Empty search result text */
    emptySearchText?: string;
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
    popoverWidth?: number;
    /** Route for "Gestionar..." footer action */
    manageRoute?: { pathname: string; query?: Record<string, string> };
    /** Label for the manage action */
    manageLabel?: string;
}

// ─── Component ───────────────────────────────────────────

export function SelectChip({
    value,
    onChange,
    options,
    icon,
    emptyLabel = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    emptySearchText = "Sin resultados",
    readOnly = false,
    disabled = false,
    className,
    popoverWidth = 220,
    manageRoute,
    manageLabel,
}: SelectChipProps) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const selected = options.find((o) => o.value === value);
    const label = selected?.label || emptyLabel;
    const chipIcon = selected?.icon || icon || <Tag className="h-3.5 w-3.5 text-muted-foreground" />;

    const handleSelect = async (newValue: string) => {
        if (newValue === value) {
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            await onChange(newValue);
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <ChipBase
            icon={chipIcon}
            label={label}
            hasValue={!!selected}
            readOnly={readOnly}
            disabled={disabled}
            loading={loading}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={popoverWidth}
            className={className}
        >
            <SelectPopoverContent
                options={options}
                currentValue={value}
                onSelect={handleSelect}
                onOpenChange={setOpen}
                searchPlaceholder={searchPlaceholder}
                emptyText={emptySearchText}
                manageRoute={manageRoute}
                manageLabel={manageLabel}
            />
        </ChipBase>
    );
}
