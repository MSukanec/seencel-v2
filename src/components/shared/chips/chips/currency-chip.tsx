/**
 * CurrencyChip — Chip for currency selection
 *
 * Renders currency symbol/code. Popover content from shared CurrencyPopoverContent.
 * Single source of truth: components/shared/popovers/currency-popover-content.tsx
 */

"use client";

import * as React from "react";
import { CircleDollarSign } from "lucide-react";
import { ChipBase } from "../chip-base";
import { CurrencyPopoverContent } from "@/components/shared/popovers";

// ─── Types ───────────────────────────────────────────────

export interface CurrencyChipOption {
    value: string;
    label: string;
    symbol?: string;
}

export interface CurrencyChipProps {
    value: string;
    onChange: (value: string) => void | Promise<void>;
    options: CurrencyChipOption[];
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Component ───────────────────────────────────────────

export function CurrencyChip({
    value,
    onChange,
    options,
    readOnly = false,
    disabled = false,
    className,
}: CurrencyChipProps) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const selected = options.find((o) => o.value === value);
    const label = selected?.label || "Moneda";

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
            icon={<CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground" />}
            label={label}
            hasValue={!!selected}
            readOnly={readOnly}
            disabled={disabled}
            loading={loading}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={220}
            className={className}
        >
            <CurrencyPopoverContent
                options={options}
                currentValue={value}
                onSelect={handleSelect}
                onOpenChange={setOpen}
            />
        </ChipBase>
    );
}
