/**
 * DateChip — Chip for date selection
 *
 * Renders calendar icon + formatted date. Popover shows UnifiedDatePicker.
 * Replaces DateField usage in chip forms.
 */

"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChipBase } from "../chip-base";
import { UnifiedDatePicker } from "@/components/shared/unified-date-picker";

// ─── Types ───────────────────────────────────────────────

export interface DateChipProps {
    value: Date | undefined;
    onChange: (value: Date | undefined) => void;
    /** Date format for display (default: "d MMM yyyy") */
    dateFormat?: string;
    /** Label when no date selected */
    emptyLabel?: string;
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Component ───────────────────────────────────────────

export function DateChip({
    value,
    onChange,
    dateFormat = "d MMM yyyy",
    emptyLabel = "Fecha",
    readOnly = false,
    disabled = false,
    className,
}: DateChipProps) {
    const [open, setOpen] = React.useState(false);

    const label = value
        ? format(value, dateFormat, { locale: es })
        : emptyLabel;

    const handleSelectDay = (date: Date) => {
        onChange(date);
        setOpen(false);
    };

    return (
        <ChipBase
            icon={<CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />}
            label={label}
            hasValue={!!value}
            readOnly={readOnly}
            disabled={disabled}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={320}
            className={className}
        >
            <UnifiedDatePicker
                mode="day"
                modes={["day"]}
                value={value}
                onSelectDay={handleSelectDay}
                showSearch
                searchPlaceholder="Ej: 20/05/2027, Mayo 2027"
            />
        </ChipBase>
    );
}
