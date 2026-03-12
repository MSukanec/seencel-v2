/**
 * Period Field Factory
 * Selector de período multi-granularidad tipo Linear.
 *
 * Soporta: Day | Month | Quarter | Half-year | Year
 * Cada granularidad muestra una grilla diferente.
 * Por defecto solo muestra la granularidad configurada (sin tabs si es una sola).
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { FormGroup } from "@/components/ui/form-group";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FactoryLabel } from "./field-wrapper";

// ─── Types ───────────────────────────────────────────────

export type PeriodGranularity = "day" | "month" | "quarter" | "half-year" | "year";

export interface PeriodFieldProps {
    /** Current value as ISO date string "2026-01-01" or "YYYY-MM" */
    value: string;
    /** Callback with ISO date string */
    onChange: (value: string) => void;
    /** Field label */
    label?: string;
    /** Enabled granularities (default: ['month']) */
    granularities?: PeriodGranularity[];
    /** Which granularity to show initially */
    defaultGranularity?: PeriodGranularity;
    /** How many years to show (default: 7 = 3 back + current + 3 forward) */
    yearsRange?: number;
    /** Custom className */
    className?: string;
    /** Is required? */
    required?: boolean;
    /** Disabled? */
    disabled?: boolean;
    /** Placeholder */
    placeholder?: string;
}

// ─── Constants ───────────────────────────────────────────

const GRANULARITY_LABELS: Record<PeriodGranularity, string> = {
    day: "Día",
    month: "Mes",
    quarter: "Trimestre",
    "half-year": "Semestre",
    year: "Año",
};

const MONTH_LABELS = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const MONTH_FULL_LABELS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ─── Component ───────────────────────────────────────────

export function PeriodField({
    value,
    onChange,
    label = "Período",
    granularities = ["month"],
    defaultGranularity,
    yearsRange = 7,
    className,
    required = false,
    disabled = false,
    placeholder = "Seleccionar período...",
}: PeriodFieldProps) {
    const [open, setOpen] = useState(false);
    const [activeGranularity, setActiveGranularity] = useState<PeriodGranularity>(
        defaultGranularity || granularities[0] || "month"
    );

    const showTabs = granularities.length > 1;

    // Generate year range
    const years = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const back = Math.floor(yearsRange / 2);
        const result: number[] = [];
        for (let i = currentYear - back; i <= currentYear + (yearsRange - back - 1); i++) {
            result.push(i);
        }
        return result;
    }, [yearsRange]);

    // Parse current value
    const parsed = useMemo(() => {
        if (!value) return null;
        // Handle "YYYY-MM" format
        if (/^\d{4}-\d{2}$/.test(value)) {
            const [y, m] = value.split("-").map(Number);
            return { year: y, month: m - 1 };
        }
        // Handle "YYYY-MM-DD" format
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const d = new Date(value + "T12:00:00");
            return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
        }
        return null;
    }, [value]);

    // Format display text
    const displayText = useMemo(() => {
        if (!parsed) return "";
        switch (activeGranularity) {
            case "day":
                return parsed.day
                    ? `${parsed.day} de ${MONTH_FULL_LABELS[parsed.month]} ${parsed.year}`
                    : "";
            case "month":
                return `${MONTH_FULL_LABELS[parsed.month]} ${parsed.year}`;
            case "quarter": {
                const q = Math.floor(parsed.month / 3) + 1;
                return `Q${q} ${parsed.year}`;
            }
            case "half-year": {
                const h = parsed.month < 6 ? 1 : 2;
                return `H${h} ${parsed.year}`;
            }
            case "year":
                return `${parsed.year}`;
            default:
                return "";
        }
    }, [parsed, activeGranularity]);

    // Handle select for different granularities
    const handleSelect = useCallback((isoDate: string) => {
        onChange(isoDate);
        setOpen(false);
    }, [onChange]);

    const handleDaySelect = useCallback((date: Date | undefined) => {
        if (!date) return;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        handleSelect(`${y}-${m}-${d}`);
    }, [handleSelect]);

    return (
        <FormGroup
            label={<FactoryLabel label={label} />}
            required={required}
            className={className}
        >
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {displayText || placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 space-y-3">
                        {/* Tabs */}
                        {showTabs && (
                            <div className="flex gap-1 bg-muted/50 rounded-md p-0.5">
                                {granularities.map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setActiveGranularity(g)}
                                        className={cn(
                                            "flex-1 text-xs font-medium py-1.5 px-2 rounded-sm transition-colors",
                                            activeGranularity === g
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {GRANULARITY_LABELS[g]}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Content */}
                        {activeGranularity === "day" && (
                            <Calendar
                                mode="single"
                                selected={parsed?.day ? new Date(parsed.year, parsed.month, parsed.day) : undefined}
                                onSelect={handleDaySelect}
                                locale={es}
                                captionLayout="dropdown"
                                startMonth={new Date(years[0], 0)}
                                endMonth={new Date(years[years.length - 1], 11)}
                                defaultMonth={parsed ? new Date(parsed.year, parsed.month) : new Date()}
                            />
                        )}

                        {activeGranularity === "month" && (
                            <MonthGrid
                                years={years}
                                selectedYear={parsed?.year}
                                selectedMonth={parsed?.month}
                                onSelect={(year, month) => {
                                    const m = String(month + 1).padStart(2, "0");
                                    handleSelect(`${year}-${m}-01`);
                                }}
                            />
                        )}

                        {activeGranularity === "quarter" && (
                            <QuarterGrid
                                years={years}
                                selectedYear={parsed?.year}
                                selectedQuarter={parsed ? Math.floor(parsed.month / 3) : undefined}
                                onSelect={(year, quarter) => {
                                    const m = String(quarter * 3 + 1).padStart(2, "0");
                                    handleSelect(`${year}-${m}-01`);
                                }}
                            />
                        )}

                        {activeGranularity === "half-year" && (
                            <HalfYearGrid
                                years={years}
                                selectedYear={parsed?.year}
                                selectedHalf={parsed ? (parsed.month < 6 ? 0 : 1) : undefined}
                                onSelect={(year, half) => {
                                    const m = half === 0 ? "01" : "07";
                                    handleSelect(`${year}-${m}-01`);
                                }}
                            />
                        )}

                        {activeGranularity === "year" && (
                            <YearGrid
                                years={years}
                                selectedYear={parsed?.year}
                                onSelect={(year) => {
                                    handleSelect(`${year}-01-01`);
                                }}
                            />
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </FormGroup>
    );
}

// ─── Sub-Grids ───────────────────────────────────────────

function MonthGrid({
    years,
    selectedYear,
    selectedMonth,
    onSelect,
}: {
    years: number[];
    selectedYear?: number;
    selectedMonth?: number;
    onSelect: (year: number, month: number) => void;
}) {
    const [viewYear, setViewYear] = useState(selectedYear || new Date().getFullYear());

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <button
                    type="button"
                    onClick={() => setViewYear((y) => Math.max(years[0], y - 1))}
                    disabled={viewYear <= years[0]}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium">{viewYear}</span>
                <button
                    type="button"
                    onClick={() => setViewYear((y) => Math.min(years[years.length - 1], y + 1))}
                    disabled={viewYear >= years[years.length - 1]}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
                {MONTH_LABELS.map((label, i) => {
                    const isSelected = selectedYear === viewYear && selectedMonth === i;
                    const isCurrentMonth = new Date().getFullYear() === viewYear && new Date().getMonth() === i;
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onSelect(viewYear, i)}
                            className={cn(
                                "h-9 rounded-md text-sm font-medium transition-colors",
                                isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : isCurrentMonth
                                        ? "border border-primary text-foreground hover:bg-accent"
                                        : "hover:bg-accent text-foreground"
                            )}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function QuarterGrid({
    years,
    selectedYear,
    selectedQuarter,
    onSelect,
}: {
    years: number[];
    selectedYear?: number;
    selectedQuarter?: number;
    onSelect: (year: number, quarter: number) => void;
}) {
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.floor(new Date().getMonth() / 3);

    return (
        <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {years.map((year) => (
                <div key={year} className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground px-1">{year}</p>
                    <div className="grid grid-cols-4 gap-1.5">
                        {[0, 1, 2, 3].map((q) => {
                            const isSelected = selectedYear === year && selectedQuarter === q;
                            const isCurrent = currentYear === year && currentQuarter === q;
                            return (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => onSelect(year, q)}
                                    className={cn(
                                        "h-9 rounded-md text-sm font-medium transition-colors",
                                        isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : isCurrent
                                                ? "border border-primary text-foreground hover:bg-accent"
                                                : "hover:bg-accent text-foreground"
                                    )}
                                >
                                    Q{q + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

function HalfYearGrid({
    years,
    selectedYear,
    selectedHalf,
    onSelect,
}: {
    years: number[];
    selectedYear?: number;
    selectedHalf?: number;
    onSelect: (year: number, half: number) => void;
}) {
    const currentYear = new Date().getFullYear();
    const currentHalf = new Date().getMonth() < 6 ? 0 : 1;

    return (
        <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {years.map((year) => (
                <div key={year} className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground px-1">{year}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {[0, 1].map((h) => {
                            const isSelected = selectedYear === year && selectedHalf === h;
                            const isCurrent = currentYear === year && currentHalf === h;
                            return (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => onSelect(year, h)}
                                    className={cn(
                                        "h-9 rounded-md text-sm font-medium transition-colors",
                                        isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : isCurrent
                                                ? "border border-primary text-foreground hover:bg-accent"
                                                : "hover:bg-accent text-foreground"
                                    )}
                                >
                                    H{h + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

function YearGrid({
    years,
    selectedYear,
    onSelect,
}: {
    years: number[];
    selectedYear?: number;
    onSelect: (year: number) => void;
}) {
    const currentYear = new Date().getFullYear();

    return (
        <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {years.map((year) => {
                const isSelected = selectedYear === year;
                const isCurrent = currentYear === year;
                return (
                    <button
                        key={year}
                        type="button"
                        onClick={() => onSelect(year)}
                        className={cn(
                            "w-full h-9 rounded-md text-sm font-medium transition-colors",
                            isSelected
                                ? "bg-primary text-primary-foreground"
                                : isCurrent
                                    ? "border border-primary text-foreground hover:bg-accent"
                                    : "hover:bg-accent text-foreground"
                        )}
                    >
                        {year}
                    </button>
                );
            })}
        </div>
    );
}
