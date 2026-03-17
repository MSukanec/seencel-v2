/**
 * UnifiedDatePicker — Linear-inspired date/period picker
 *
 * A single component that handles:
 * - Day selection (full calendar grid)
 * - Month selection (3×4 grid)
 * - Quarter selection (4×1 grid)
 * - Half-year selection (2×1 grid)
 * - Year selection (list)
 *
 * Features:
 * - Search input (type "2/5", "May 2027", "Q4 2026", etc.)
 * - Mode chips (Day, Month, Quarter, etc.) — configurable
 * - Fixed width (320px) — content adapts
 * - Consistent look across all modes
 *
 * Usage:
 *   <UnifiedDatePicker
 *     mode="day"
 *     value={date}
 *     onSelectDay={(d) => setDate(d)}
 *     modes={["day"]}
 *   />
 *
 *   <UnifiedDatePicker
 *     mode="month"
 *     periodValue="2026-03-01"
 *     onSelectPeriod={(iso) => setPeriod(iso)}
 *     modes={["month", "quarter", "half-year", "year"]}
 *   />
 */

"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export type DatePickerMode = "day" | "day-range" | "month" | "quarter" | "half-year" | "year";

export interface UnifiedDatePickerProps {
    /** Active mode */
    mode: DatePickerMode;
    /** Available modes — shown as pills (default: just current mode) */
    modes?: DatePickerMode[];
    /** Change active mode */
    onModeChange?: (mode: DatePickerMode) => void;

    // ─── Day mode ────────────────────────────────────────
    /** Selected date (day mode) */
    value?: Date;
    /** Callback when a day is selected */
    onSelectDay?: (date: Date) => void;

    // ─── Period modes ────────────────────────────────────
    /** Selected period as ISO string "2026-03-01" */
    periodValue?: string;
    /** Callback when a period is selected */
    onSelectPeriod?: (iso: string) => void;

    // ─── Day Range mode ──────────────────────────────────
    /** Selected date range (day-range mode) */
    rangeValue?: { from?: Date; to?: Date };
    /** Callback when a range changes */
    onSelectRange?: (range: { from?: Date; to?: Date }) => void;

    /** Show search input */
    showSearch?: boolean;
    /** Placeholder for search */
    searchPlaceholder?: string;
}

// ─── Constants ───────────────────────────────────────────

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MODE_LABELS: Record<DatePickerMode, string> = {
    "day": "Día",
    "day-range": "Fechas",
    "month": "Mes",
    "quarter": "Trimestre",
    "half-year": "Semestre",
    "year": "Año",
};

// ─── Component ───────────────────────────────────────────

export function UnifiedDatePicker({
    mode,
    modes,
    onModeChange,
    value,
    onSelectDay,
    periodValue,
    onSelectPeriod,
    rangeValue,
    onSelectRange,
    showSearch = true,
    searchPlaceholder = "Ej: May 2027, Q4, 20/05/2027",
}: UnifiedDatePickerProps) {
    const availableModes = modes || [mode];
    const showModeChips = availableModes.length > 1;

    // Parse periodValue
    const parsedPeriod = React.useMemo(() => {
        if (!periodValue) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(periodValue)) {
            const d = new Date(periodValue + "T12:00:00");
            return { year: d.getFullYear(), month: d.getMonth() };
        }
        if (/^\d{4}-\d{2}$/.test(periodValue)) {
            const [y, m] = periodValue.split("-").map(Number);
            return { year: y, month: m - 1 };
        }
        return null;
    }, [periodValue]);

    // View month for day calendar
    const [viewMonth, setViewMonth] = React.useState(() =>
        value || rangeValue?.from || new Date()
    );
    // View year for period grids
    const [viewYear, setViewYear] = React.useState(() =>
        parsedPeriod?.year || value?.getFullYear() || new Date().getFullYear()
    );

    // Search
    const [search, setSearch] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Auto-focus search on open
    React.useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 50);
        return () => clearTimeout(t);
    }, []);

    // Parse search and select
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const q = search.trim().toLowerCase();
        if (!q) return;

        // Try day format: "dd/mm", "dd/mm/yyyy"
        const dayMatch = q.match(/^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?$/);
        if (dayMatch) {
            const day = parseInt(dayMatch[1]);
            const month = parseInt(dayMatch[2]) - 1;
            let year = dayMatch[3] ? parseInt(dayMatch[3]) : new Date().getFullYear();
            if (year < 100) year += 2000;
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                if (mode === "day") {
                    onSelectDay?.(date);
                } else {
                    onSelectPeriod?.(`${year}-${String(month + 1).padStart(2, "0")}-01`);
                }
                setSearch("");
                return;
            }
        }

        // Try quarter: "Q4", "Q1 2026"
        const qMatch = q.match(/^q(\d)\s*(\d{4})?$/i);
        if (qMatch) {
            const quarter = parseInt(qMatch[1]) - 1;
            const year = qMatch[2] ? parseInt(qMatch[2]) : new Date().getFullYear();
            onSelectPeriod?.(`${year}-${String(quarter * 3 + 1).padStart(2, "0")}-01`);
            onModeChange?.("quarter");
            setSearch("");
            return;
        }

        // Try month name: "mayo", "may 2027"
        const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const monthNamesShort = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        const parts = q.split(/\s+/);
        const monthIdx = monthNames.findIndex(m => m.startsWith(parts[0])) !== -1
            ? monthNames.findIndex(m => m.startsWith(parts[0]))
            : monthNamesShort.findIndex(m => m.startsWith(parts[0]));

        if (monthIdx !== -1) {
            const year = parts[1] ? parseInt(parts[1]) : new Date().getFullYear();
            if (mode === "day") {
                setViewMonth(new Date(year, monthIdx, 1));
            } else {
                onSelectPeriod?.(`${year}-${String(monthIdx + 1).padStart(2, "0")}-01`);
            }
            setSearch("");
            return;
        }
    };

    return (
        <div className="w-[320px]">
            {/* ── Search ───────────────────────────────── */}
            {showSearch && (
                <div className="flex items-center border-b border-border/50 px-3">
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    <input
                        ref={inputRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder={searchPlaceholder}
                        className="flex h-9 w-full bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            )}

            {/* ── Mode Chips ───────────────────────────── */}
            {showModeChips && (
                <div className="px-3 pb-2 flex items-center gap-1">
                    {availableModes.map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => onModeChange?.(m)}
                            className={cn(
                                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex-1",
                                m === mode
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            {MODE_LABELS[m]}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Content ──────────────────────────────── */}
            <div className="px-3 pb-3">
                {mode === "day" && (
                    <DayGrid
                        viewMonth={viewMonth}
                        onViewMonthChange={setViewMonth}
                        selected={value}
                        onSelect={(d) => onSelectDay?.(d)}
                    />
                )}
                {mode === "day-range" && (
                    <DayGrid
                        viewMonth={viewMonth}
                        onViewMonthChange={setViewMonth}
                        rangeValue={rangeValue}
                        onSelectRange={(range) => onSelectRange?.(range)}
                        isRangeMode
                    />
                )}
                {mode === "month" && (
                    <PeriodGrid
                        type="month"
                        viewYear={viewYear}
                        onViewYearChange={setViewYear}
                        parsed={parsedPeriod}
                        onSelect={(iso) => onSelectPeriod?.(iso)}
                    />
                )}
                {mode === "quarter" && (
                    <PeriodGrid
                        type="quarter"
                        viewYear={viewYear}
                        onViewYearChange={setViewYear}
                        parsed={parsedPeriod}
                        onSelect={(iso) => onSelectPeriod?.(iso)}
                    />
                )}
                {mode === "half-year" && (
                    <PeriodGrid
                        type="half-year"
                        viewYear={viewYear}
                        onViewYearChange={setViewYear}
                        parsed={parsedPeriod}
                        onSelect={(iso) => onSelectPeriod?.(iso)}
                    />
                )}
                {mode === "year" && (
                    <PeriodGrid
                        type="year"
                        viewYear={viewYear}
                        onViewYearChange={setViewYear}
                        parsed={parsedPeriod}
                        onSelect={(iso) => onSelectPeriod?.(iso)}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Day Grid ────────────────────────────────────────────

function DayGrid({
    viewMonth,
    onViewMonthChange,
    selected,
    onSelect,
    rangeValue,
    onSelectRange,
    isRangeMode,
}: {
    viewMonth: Date;
    onViewMonthChange: (d: Date) => void;
    selected?: Date;
    onSelect?: (d: Date) => void;
    rangeValue?: { from?: Date; to?: Date };
    onSelectRange?: (range: { from?: Date; to?: Date }) => void;
    isRangeMode?: boolean;
}) {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const today = new Date();

    // Build calendar grid
    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay() - 1; // Monday = 0
    if (startDow < 0) startDow = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const cells: { day: number; month: number; year: number; outside: boolean }[] = [];

    // Previous month
    for (let i = startDow - 1; i >= 0; i--) {
        const d = daysInPrev - i;
        cells.push({ day: d, month: month - 1, year: month === 0 ? year - 1 : year, outside: true });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, month, year, outside: false });
    }
    // Next month
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
        cells.push({ day: d, month: month + 1, year: month === 11 ? year + 1 : year, outside: true });
    }

    const monthLabel = `${MONTH_LABELS[month]} ${year}`;

    const isSameDay = (a: { day: number; month: number; year: number }, b: Date | undefined) =>
        b ? (a.day === b.getDate() && a.month === b.getMonth() && a.year === b.getFullYear()) : false;

    // Range helpers
    const currentHoverDate = React.useRef<Date | null>(null);
    const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

    const isDayBefore = (d1: Date, d2: Date) => {
        const reset1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
        const reset2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
        return reset1.getTime() < reset2.getTime();
    };

    const isDayAfter = (d1: Date, d2: Date) => {
        const reset1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
        const reset2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
        return reset1.getTime() > reset2.getTime();
    };

    const isDayBetween = (a: { day: number; month: number; year: number }, start: Date, end: Date) => {
        const target = new Date(a.year, a.month, a.day);
        return isDayAfter(target, start) && isDayBefore(target, end);
    };

    return (
        <div className="space-y-2">
            {/* Nav */}
            <div className="flex items-center justify-between">
                <button type="button" onClick={() => onViewMonthChange(new Date(year, month - 1))} className="p-1 rounded-md hover:bg-muted transition-colors">
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <span className="text-xs font-medium text-foreground">{monthLabel}</span>
                <button type="button" onClick={() => onViewMonthChange(new Date(year, month + 1))} className="p-1 rounded-md hover:bg-muted transition-colors">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0">
                {WEEKDAY_LABELS.map((wd) => (
                    <div key={wd} className="h-8 flex items-center justify-center text-[11px] text-muted-foreground/60 font-medium select-none">
                        {wd}
                    </div>
                ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-0">
                {cells.map((cell, i) => {
                    const isToday = !cell.outside && isSameDay(cell, today);
                    
                    let isSelected = false;
                    let isSelectedStart = false;
                    let isSelectedEnd = false;
                    let isInRange = false;

                    if (isRangeMode && rangeValue) {
                        isSelectedStart = isSameDay(cell, rangeValue.from);
                        isSelectedEnd = isSameDay(cell, rangeValue.to);
                        isSelected = isSelectedStart || isSelectedEnd;
                        
                        if (rangeValue.from && rangeValue.to) {
                            isInRange = isDayBetween(cell, rangeValue.from, rangeValue.to);
                        } else if (rangeValue.from && hoverDate) {
                            if (isDayBefore(hoverDate, rangeValue.from)) {
                                isInRange = isDayBetween(cell, hoverDate, rangeValue.from);
                            } else {
                                isInRange = isDayBetween(cell, rangeValue.from, hoverDate);
                            }
                        }
                    } else if (selected) {
                        isSelected = !cell.outside && isSameDay(cell, selected);
                    }

                    return (
                        <div 
                            key={i} 
                            className={cn(
                                "flex items-center justify-center p-0.5 relative",
                                isInRange && !cell.outside && "bg-primary/10 rounded-none",
                                // Highlight logic to merge corners
                                isInRange && !cell.outside && i % 7 === 0 && "rounded-l-md",
                                isInRange && !cell.outside && i % 7 === 6 && "rounded-r-md"
                            )}
                            onMouseEnter={() => {
                                if (isRangeMode && rangeValue?.from && !rangeValue.to && !cell.outside) {
                                    setHoverDate(new Date(cell.year, cell.month, cell.day));
                                }
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    const d = new Date(cell.year, cell.month, cell.day);
                                    if (isRangeMode) {
                                        if (!rangeValue?.from || (rangeValue.from && rangeValue.to)) {
                                            onSelectRange?.({ from: d, to: undefined });
                                        } else {
                                            if (isDayBefore(d, rangeValue.from)) {
                                                onSelectRange?.({ from: d, to: rangeValue.from });
                                            } else {
                                                onSelectRange?.({ from: rangeValue.from, to: d });
                                            }
                                        }
                                    } else {
                                        onSelect?.(d);
                                    }
                                    if (cell.outside) onViewMonthChange(d);
                                }}
                                className={cn(
                                    "h-8 w-8 flex items-center justify-center text-xs rounded-md transition-colors relative z-10",
                                    cell.outside && "text-muted-foreground/30",
                                    !cell.outside && !isSelected && !isToday && "text-foreground hover:bg-muted font-medium",
                                    isToday && !isSelected && "border border-border text-foreground hover:bg-muted font-bold",
                                    isSelected && "border border-transparent bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90",
                                    // if it's the start/end of a range, color it
                                    (isSelectedStart || isSelectedEnd) && "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 rounded-md"
                                )}
                            >
                                {cell.day}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Period Grid (unified for Month, Quarter, Half-year, Year) ───

function PeriodGrid({
    type,
    viewYear: _viewYear,
    onViewYearChange: _onViewYearChange,
    parsed,
    onSelect,
}: {
    type: "month" | "quarter" | "half-year" | "year";
    viewYear: number;
    onViewYearChange: (y: number) => void;
    parsed: { year: number; month: number } | null;
    onSelect: (iso: string) => void;
}) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Generate years range: -3 to +3 from current
    const years = React.useMemo(() => {
        const center = parsed?.year || currentYear;
        return Array.from({ length: 7 }, (_, i) => center - 3 + i);
    }, [parsed?.year, currentYear]);

    // Auto-scroll to selected year on mount
    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const selectedEl = el.querySelector("[data-selected-year='true']");
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: "center" });
        }
    }, []);

    const colsClass = type === "month" ? "grid-cols-3"
        : type === "quarter" ? "grid-cols-4"
        : type === "half-year" ? "grid-cols-2"
        : "grid-cols-1";

    // Build items per year
    const buildItems = (yr: number) => {
        switch (type) {
            case "month":
                return MONTH_LABELS.map((lbl, i) => ({
                    label: lbl,
                    iso: `${yr}-${String(i + 1).padStart(2, "0")}-01`,
                    isSelected: parsed?.year === yr && parsed?.month === i,
                    isCurrent: currentYear === yr && currentMonth === i,
                }));
            case "quarter":
                return [0, 1, 2, 3].map((q) => ({
                    label: `Q${q + 1}`,
                    iso: `${yr}-${String(q * 3 + 1).padStart(2, "0")}-01`,
                    isSelected: parsed?.year === yr && Math.floor((parsed?.month ?? -1) / 3) === q,
                    isCurrent: currentYear === yr && Math.floor(currentMonth / 3) === q,
                }));
            case "half-year":
                return [0, 1].map((h) => ({
                    label: `H${h + 1}`,
                    iso: `${yr}-${h === 0 ? "01" : "07"}-01`,
                    isSelected: parsed?.year === yr && (parsed?.month ?? -1) < 6 === (h === 0),
                    isCurrent: currentYear === yr && (currentMonth < 6 ? 0 : 1) === h,
                }));
            case "year":
                return [{
                    label: `${yr}`,
                    iso: `${yr}-01-01`,
                    isSelected: parsed?.year === yr,
                    isCurrent: currentYear === yr,
                }];
        }
    };

    return (
        <div ref={scrollRef} className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
            {years.map((yr) => {
                const items = buildItems(yr);
                const hasSelected = items.some(i => i.isSelected);
                return (
                    <div key={yr} className="space-y-1.5" data-selected-year={hasSelected || undefined}>
                        {/* Year label (hidden for "year" type since it's in the button) */}
                        {type !== "year" && (
                            <p className="text-[11px] font-medium text-muted-foreground/60 select-none">{yr}</p>
                        )}
                        <div className={cn("grid gap-1", colsClass)}>
                            {items.map((item) => (
                                <button
                                    key={item.iso}
                                    type="button"
                                    onClick={() => onSelect(item.iso)}
                                    className={cn(
                                        "h-9 rounded-md text-xs font-medium transition-colors",
                                        item.isSelected
                                            ? "border border-primary bg-primary/10 text-foreground"
                                            : item.isCurrent
                                                ? "border border-border text-foreground hover:bg-muted"
                                                : "text-foreground hover:bg-muted"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

