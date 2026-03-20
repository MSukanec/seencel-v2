/**
 * SeverityChip — Chip for severity selection in forms
 *
 * Renders a colored dot + severity label. Popover shows SeverityPopoverContent.
 */

"use client";

import * as React from "react";
import {
    SeverityPopoverContent,
    SEVERITY_VISUAL_CONFIG,
    DEFAULT_SEVERITY_OPTIONS,
    type SeverityOption,
    type SeverityLevel,
} from "@/components/shared/popovers/severity-popover-content";
import { ChipBase } from "../chip-base";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export type { SeverityLevel } from "@/components/shared/popovers/severity-popover-content";

export interface SeverityChipProps {
    value: string;
    onChange: (value: string) => void | Promise<void>;
    options?: SeverityOption[];
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Component ───────────────────────────────────────────

export function SeverityChip({
    value,
    onChange,
    options = DEFAULT_SEVERITY_OPTIONS,
    readOnly = false,
    disabled = false,
    className,
}: SeverityChipProps) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const config = options.find((o) => o.value === value);
    const isEmpty = !value || value === "none";
    const label = isEmpty ? "Severidad" : (config?.label || value);

    // Get the real icon from visual config (same as popover)
    const visualConfig = SEVERITY_VISUAL_CONFIG[isEmpty ? "none" : value as SeverityLevel];
    const Icon = visualConfig?.icon || SEVERITY_VISUAL_CONFIG["none"].icon;
    const iconColor = isEmpty ? "text-muted-foreground/50" : (visualConfig?.labelClass || "text-muted-foreground");

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
            icon={<Icon className={cn("h-3.5 w-3.5", iconColor)} />}
            label={label}
            hasValue={!isEmpty}
            readOnly={readOnly}
            disabled={disabled}
            loading={loading}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={180}
            className={className}
        >
            <SeverityPopoverContent
                options={options}
                currentValue={value}
                onSelect={handleSelect}
            />
        </ChipBase>
    );
}
