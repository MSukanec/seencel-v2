/**
 * UnitChip — Specialized chip for unit selection
 *
 * Uses the Shared Popover Content (UnitPopoverContent).
 * Ideal for forms (e.g. general costs, tasks, quotes).
 */

"use client";

import * as React from "react";
import { Ruler } from "lucide-react";
import { UnitPopoverContent, type UnitPopoverOption } from "@/components/shared/popovers";
import { ChipBase } from "../chip-base";

export interface UnitChipProps {
    value: string;
    onChange: (value: string) => void | Promise<void>;
    options: UnitPopoverOption[];
    emptyLabel?: string;
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
    popoverWidth?: number;
}

export function UnitChip({
    value,
    onChange,
    options,
    emptyLabel = "Seleccionar unidad...",
    readOnly = false,
    disabled = false,
    className,
    popoverWidth = 240,
}: UnitChipProps) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const selected = options.find((o) => o.value === value);
    const label = selected?.label || emptyLabel;

    // Default icon if none selected, otherwise render symbol or default icon again inside chip
    const chipIcon = selected?.symbol ? (
        <span className="text-[10px] font-mono font-medium text-muted-foreground w-4 text-center">
            {selected.symbol}
        </span>
    ) : (
        <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
    );

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
            <UnitPopoverContent
                options={options}
                currentValue={value}
                onSelect={handleSelect}
                onOpenChange={setOpen}
            />
        </ChipBase>
    );
}
