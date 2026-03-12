/**
 * PeriodChip — Chip for period/recurrence selection
 *
 * Renders calendar icon + formatted period. Popover shows UnifiedDatePicker
 * in the appropriate mode (month, quarter, half-year, year).
 *
 * Granularity is determined by the parent (based on recurrence_interval).
 */

"use client";

import * as React from "react";
import { CalendarRange } from "lucide-react";
import { ChipBase } from "../chip-base";
import { UnifiedDatePicker, type DatePickerMode } from "@/components/shared/unified-date-picker";

// ─── Types ───────────────────────────────────────────────

export type PeriodGranularity = "month" | "quarter" | "half-year" | "year";

export interface PeriodChipProps {
    /** ISO date string "2026-01-01" or "2026-01" */
    value: string;
    onChange: (value: string) => void;
    /** Which granularity to show */
    granularity?: PeriodGranularity;
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Constants ───────────────────────────────────────────

const MONTH_FULL = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// ─── Component ───────────────────────────────────────────

export function PeriodChip({
    value,
    onChange,
    granularity = "month",
    readOnly = false,
    disabled = false,
    className,
}: PeriodChipProps) {
    const [open, setOpen] = React.useState(false);
    const [activeMode, setActiveMode] = React.useState<DatePickerMode>(granularity);

    // Parse value
    const parsed = React.useMemo(() => {
        if (!value) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const d = new Date(value + "T12:00:00");
            return { year: d.getFullYear(), month: d.getMonth() };
        }
        if (/^\d{4}-\d{2}$/.test(value)) {
            const [y, m] = value.split("-").map(Number);
            return { year: y, month: m - 1 };
        }
        return null;
    }, [value]);

    // Format label
    const label = React.useMemo(() => {
        if (!parsed) return "Período";
        switch (granularity) {
            case "month": return `${MONTH_FULL[parsed.month]} ${parsed.year}`;
            case "quarter": return `Q${Math.floor(parsed.month / 3) + 1} ${parsed.year}`;
            case "half-year": return `H${parsed.month < 6 ? 1 : 2} ${parsed.year}`;
            case "year": return `${parsed.year}`;
        }
    }, [parsed, granularity]);

    // Only show the granularity mode — no switching
    const modes: DatePickerMode[] = [granularity];

    const handleSelect = (iso: string) => {
        onChange(iso);
        setOpen(false);
    };

    return (
        <ChipBase
            icon={<CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />}
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
                mode={activeMode}
                modes={modes}
                onModeChange={setActiveMode}
                periodValue={value}
                onSelectPeriod={handleSelect}
                showSearch
                searchPlaceholder="Ej: Mar 2026, Q4 2027"
            />
        </ChipBase>
    );
}
