/**
 * AddressChip — Chip for address/location selection
 *
 * Renders MapPin icon + abbreviated address. Popover content from shared AddressPopoverContent.
 * Single source of truth: components/shared/popovers/address-popover-content.tsx
 */

"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { ChipBase } from "../chip-base";
import { AddressPopoverContent, type AddressData } from "@/components/shared/popovers";

// ─── Types ───────────────────────────────────────────────

export type { AddressData } from "@/components/shared/popovers";

export interface AddressChipProps {
    value: AddressData | null;
    onChange: (data: AddressData) => void | Promise<void>;
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Helpers ─────────────────────────────────────────────

function getShortLabel(data: AddressData | null): string {
    if (!data) return "Sin ubicación";
    const parts = [data.city, data.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : data.address || "Sin ubicación";
}

// ─── Component ───────────────────────────────────────────

export function AddressChip({
    value,
    onChange,
    readOnly = false,
    disabled = false,
    className,
}: AddressChipProps) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const label = getShortLabel(value);

    const handleSelect = async (data: AddressData) => {
        setLoading(true);
        try {
            await onChange(data);
        } finally {
            setLoading(false);
            // Don't close — let the user see the result on the map
            // Popover closes naturally on click-outside or Escape
        }
    };

    return (
        <ChipBase
            icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
            label={label}
            hasValue={!!value && !!value.city}
            readOnly={readOnly}
            disabled={disabled}
            loading={loading}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={320}
            className={className}
        >
            <AddressPopoverContent
                currentValue={value}
                onSelect={handleSelect}
            />
        </ChipBase>
    );
}
