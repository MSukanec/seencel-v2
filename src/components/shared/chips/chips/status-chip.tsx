/**
 * StatusChip — Chip for status selection
 *
 * Renders a colored dot + label. Popover shows StatusPopoverContent.
 * Same component works in forms, tables, and detail panels.
 */

"use client";

import * as React from "react";
import { StatusPopoverContent, StatusDot, type StatusPopoverOption, type StatusVariant } from "@/components/shared/popovers";
import { ChipBase } from "../chip-base";

// ─── Types ───────────────────────────────────────────────

export type { StatusVariant } from "@/components/shared/popovers";

export interface StatusOption extends StatusPopoverOption {}

export interface StatusChipProps {
    value: string;
    onChange: (value: string) => void | Promise<void>;
    options: StatusOption[];
    placeholder?: string;
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Component ───────────────────────────────────────────

export function StatusChip({
    value,
    onChange,
    options,
    placeholder = "Cambiar estado...",
    readOnly = false,
    disabled = false,
    className,
}: StatusChipProps) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const config = options.find((o) => o.value === value);
    const label = config?.label || value || "Sin estado";
    const variant = config?.variant || "neutral";

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
            icon={<StatusDot variant={variant} />}
            label={label}
            readOnly={readOnly}
            disabled={disabled}
            loading={loading}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={200}
            className={className}
        >
            <StatusPopoverContent
                options={options}
                currentValue={value}
                onSelect={handleSelect}
                placeholder={placeholder}
            />
        </ChipBase>
    );
}
