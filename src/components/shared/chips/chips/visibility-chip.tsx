/**
 * VisibilityChip — Chip for client visibility selection in forms
 *
 * Renders a colored dot + label. Popover shows VisibilityPopoverContent.
 * Translates boolean `isPublic` to "public"/"internal" values.
 */

"use client";

import * as React from "react";
import {
    VisibilityPopoverContent,
    VisibilityDot,
    DEFAULT_VISIBILITY_OPTIONS,
    type VisibilityOption,
    type VisibilityLevel,
} from "@/components/shared/popovers/visibility-popover-content";
import { ChipBase } from "../chip-base";

// ─── Types ───────────────────────────────────────────────

export type { VisibilityLevel } from "@/components/shared/popovers/visibility-popover-content";

export interface VisibilityChipProps {
    /** Whether the record is public (visible to clients) */
    value: boolean;
    /** Called with the new boolean value */
    onChange: (isPublic: boolean) => void | Promise<void>;
    options?: VisibilityOption[];
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Component ───────────────────────────────────────────

export function VisibilityChip({
    value,
    onChange,
    options = DEFAULT_VISIBILITY_OPTIONS,
    readOnly = false,
    disabled = false,
    className,
}: VisibilityChipProps) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const currentLevel: VisibilityLevel = value ? "public" : "internal";
    const option = options.find(o => o.value === currentLevel);
    const label = option?.label || (value ? "Visible cliente" : "Solo interno");

    const handleSelect = async (newValue: VisibilityLevel) => {
        const newIsPublic = newValue === "public";
        if (newIsPublic === value) {
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            await onChange(newIsPublic);
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <ChipBase
            icon={<VisibilityDot isPublic={value} />}
            label={label}
            readOnly={readOnly}
            disabled={disabled}
            loading={loading}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={180}
            className={className}
        >
            <VisibilityPopoverContent
                options={options}
                currentValue={currentLevel}
                onSelect={handleSelect}
            />
        </ChipBase>
    );
}
