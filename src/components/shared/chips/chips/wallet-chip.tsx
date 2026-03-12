/**
 * WalletChip — Chip for wallet/account selection
 *
 * Renders wallet icon + name. Popover content from shared WalletPopoverContent.
 * Single source of truth: components/shared/popovers/wallet-popover-content.tsx
 */

"use client";

import * as React from "react";
import { Wallet } from "lucide-react";
import { ChipBase } from "../chip-base";
import { WalletPopoverContent } from "@/components/shared/popovers";

// ─── Types ───────────────────────────────────────────────

export interface WalletChipOption {
    value: string;
    label: string;
}

export interface WalletChipProps {
    value: string;
    onChange: (value: string) => void | Promise<void>;
    options: WalletChipOption[];
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Component ───────────────────────────────────────────

export function WalletChip({
    value,
    onChange,
    options,
    readOnly = false,
    disabled = false,
    className,
}: WalletChipProps) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const selected = options.find((o) => o.value === value);
    const label = selected?.label || "Sin billetera";

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
            icon={<Wallet className="h-3.5 w-3.5 text-muted-foreground" />}
            label={label}
            hasValue={!!selected}
            readOnly={readOnly}
            disabled={disabled}
            loading={loading}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={200}
            className={className}
        >
            <WalletPopoverContent
                options={options}
                currentValue={value}
                onSelect={handleSelect}
                onOpenChange={setOpen}
            />
        </ChipBase>
    );
}
