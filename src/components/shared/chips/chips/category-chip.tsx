/**
 * CategoryChip — Multi-select chip for contact categories
 *
 * Renders tag icon + count/label. Popover shows CategoryPopoverContent (multi-select).
 * Single source of truth: components/shared/popovers/category-popover-content.tsx
 */

"use client";

import * as React from "react";
import { Tag } from "lucide-react";
import { ChipBase } from "../chip-base";
import { CategoryPopoverContent, type CategoryPopoverOption } from "@/components/shared/popovers/category-popover-content";

// ─── Types ───────────────────────────────────────────────

export interface CategoryChipProps {
    /** Array of selected category IDs */
    value: string[];
    /** Toggle a category on/off */
    onChange: (categoryId: string) => void;
    /** Available category options */
    options: CategoryPopoverOption[];
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
    /** Route for "Gestionar categorías" footer action */
    manageRoute?: { pathname: string; query?: Record<string, string> };
    /** Label for the manage action */
    manageLabel?: string;
}

// ─── Component ───────────────────────────────────────────

export function CategoryChip({
    value,
    onChange,
    options,
    readOnly = false,
    disabled = false,
    className,
    manageRoute = { pathname: "/organization/contacts/settings" as any },
    manageLabel = "Gestionar categorías",
}: CategoryChipProps) {
    const [open, setOpen] = React.useState(false);

    // Build label from selected values
    const selectedLabels = options
        .filter((o) => value.includes(o.value))
        .map((o) => o.label);

    let label: string;
    if (selectedLabels.length === 0) {
        label = "Categorías";
    } else if (selectedLabels.length === 1) {
        label = selectedLabels[0];
    } else {
        label = `${selectedLabels.length} categorías`;
    }

    return (
        <ChipBase
            icon={<Tag className="h-3.5 w-3.5 text-muted-foreground" />}
            label={label}
            hasValue={selectedLabels.length > 0}
            readOnly={readOnly}
            disabled={disabled}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={220}
            className={className}
        >
            <CategoryPopoverContent
                options={options}
                currentValues={value}
                onToggle={onChange}
                onOpenChange={setOpen}
                manageRoute={manageRoute}
                manageLabel={manageLabel}
            />
        </ChipBase>
    );
}
