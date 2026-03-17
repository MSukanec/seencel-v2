/**
 * DateTimeRangeChip — Unified date and time chip (Linear-style)
 *
 * Combines a DateRange calendar with Time inputs and an "All Day" toggle.
 * Replaces separate DateChips and TimeChips for a pristine UX.
 */

"use client";

import * as React from "react";
import { CalendarClock, Sun } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChipBase } from "../chip-base";
import { UnifiedDatePicker } from "@/components/shared/unified-date-picker";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface DateTimeRangeChipProps {
    startDate: Date | undefined;
    endDate: Date | undefined | null;
    startTime: string;
    endTime: string;
    isAllDay: boolean;
    onStartDateChange: (d: Date | undefined) => void;
    onEndDateChange: (d: Date | undefined | null) => void;
    onStartTimeChange: (t: string) => void;
    onEndTimeChange: (t: string) => void;
    onAllDayChange: (allDay: boolean) => void;
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Inline Time Input ───────────────────────────────────

function TimeInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const [hours, minutes] = (value || "00:00").split(":").map(Number);

    const setTime = (h: number, m: number) => {
        const hh = Math.max(0, Math.min(23, h));
        const mm = Math.max(0, Math.min(59, m));
        onChange(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
    };

    return (
        <div className="flex flex-1 items-center gap-2 bg-muted/30 rounded-md p-1 pl-3 border border-border/40">
            <span className="text-[10px] font-medium text-muted-foreground w-8 shrink-0">
                {label}
            </span>
            <div className="flex items-center gap-0.5">
                {/* Hours */}
                <div className="flex flex-col items-center">
                    <button type="button" onClick={() => setTime(hours + 1, minutes)} className="p-0.5 text-muted-foreground/40 hover:text-foreground">
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <input
                        type="text"
                        value={String(hours).padStart(2, "0")}
                        onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v)) setTime(v, minutes);
                        }}
                        onWheel={(e) => {
                            e.preventDefault();
                            setTime(hours + (e.deltaY < 0 ? 1 : -1), minutes);
                        }}
                        className="w-7 h-6 text-center text-xs font-mono font-semibold bg-transparent text-foreground outline-none focus:bg-muted/50 rounded"
                        maxLength={2}
                    />
                    <button type="button" onClick={() => setTime(hours - 1, minutes)} className="p-0.5 text-muted-foreground/40 hover:text-foreground">
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                </div>

                <span className="text-xs font-mono font-bold text-muted-foreground/40 pb-0.5">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                    <button type="button" onClick={() => setTime(hours, minutes + 5)} className="p-0.5 text-muted-foreground/40 hover:text-foreground">
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <input
                        type="text"
                        value={String(minutes).padStart(2, "0")}
                        onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v)) setTime(hours, v);
                        }}
                        onWheel={(e) => {
                            e.preventDefault();
                            setTime(hours, minutes + (e.deltaY < 0 ? 5 : -5));
                        }}
                        className="w-7 h-6 text-center text-xs font-mono font-semibold bg-transparent text-foreground outline-none focus:bg-muted/50 rounded"
                        maxLength={2}
                    />
                    <button type="button" onClick={() => setTime(hours, minutes - 5)} className="p-0.5 text-muted-foreground/40 hover:text-foreground">
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────────

function addHours(time: string, hours: number): string {
    const [h, m] = (time || "00:00").split(":").map(Number);
    const newH = Math.min(23, h + hours);
    return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ─── Component ───────────────────────────────────────────

export function DateTimeRangeChip({
    startDate,
    endDate,
    startTime,
    endTime,
    isAllDay,
    onStartDateChange,
    onEndDateChange,
    onStartTimeChange,
    onEndTimeChange,
    onAllDayChange,
    readOnly = false,
    disabled = false,
    className,
}: DateTimeRangeChipProps) {
    const [open, setOpen] = React.useState(false);

    // Format Label
    const label = React.useMemo(() => {
        if (!startDate) return "Fecha y Hora";
        
        const isSame = endDate ? isSameDay(startDate, endDate) : true;
        const fmtStart = format(startDate, "d MMM", { locale: es });
        const fmtEnd = endDate ? format(endDate, "d MMM", { locale: es }) : "";
        
        if (isAllDay) {
            return isSame ? fmtStart : `${fmtStart} — ${fmtEnd}`;
        }
        
        if (isSame) {
            return `${fmtStart}, ${startTime} – ${endTime}`;
        }
        
        return `${fmtStart} ${startTime} — ${fmtEnd} ${endTime}`;
    }, [startDate, endDate, startTime, endTime, isAllDay]);

    return (
        <ChipBase
            icon={<CalendarClock className={cn("h-3.5 w-3.5", isAllDay ? "text-amber-500" : "text-muted-foreground")} />}
            label={label}
            hasValue={!!startDate}
            readOnly={readOnly}
            disabled={disabled}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={320} // matches UnifiedDatePicker width
            className={className}
        >
            <div className="flex flex-col">
                {/* 1. Date Range Calendar */}
                <UnifiedDatePicker
                    mode="day-range"
                    modes={["day-range"]}
                    rangeValue={{ from: startDate, to: endDate || undefined }}
                    onSelectRange={(range) => {
                        onStartDateChange(range.from);
                        onEndDateChange(range.to || null);
                    }}
                    showSearch={false}
                />
                
                {/* 2. Divider & Time Controls */}
                <div className="p-3 pt-0 space-y-3">
                    <div className="h-px w-full bg-border/50 mb-2" />
                    
                    {/* All-day toggle */}
                    <button
                        type="button"
                        onClick={() => onAllDayChange(!isAllDay)}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                            isAllDay
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-muted/30 text-muted-foreground border border-border/30 hover:bg-muted/50"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <Sun className="h-3.5 w-3.5" />
                            Todo el día
                        </span>
                        <div className={cn(
                            "w-8 h-[18px] rounded-full transition-colors relative",
                            isAllDay ? "bg-primary" : "bg-muted-foreground/30"
                        )}>
                            <div className={cn(
                                "absolute top-[2px] h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                                isAllDay ? "translate-x-[14px]" : "translate-x-[2px]"
                            )} />
                        </div>
                    </button>

                    {/* Time pickers (only when not all-day) */}
                    {!isAllDay && (
                        <div className="space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
                            <div className="flex items-center gap-2">
                                <TimeInput
                                    label="Inicio"
                                    value={startTime}
                                    onChange={onStartTimeChange}
                                />
                                <TimeInput
                                    label="Fin"
                                    value={endTime}
                                    onChange={onEndTimeChange}
                                />
                            </div>

                            {/* Quick presets */}
                            <div className="flex flex-wrap gap-1 pt-1">
                                {[
                                    { label: "Mañana", start: "08:00", end: "12:00" },
                                    { label: "Tarde", start: "14:00", end: "18:00" },
                                    { label: "1h", start: startTime, end: addHours(startTime, 1) },
                                    { label: "2h", start: startTime, end: addHours(startTime, 2) },
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => {
                                            onStartTimeChange(preset.start);
                                            onEndTimeChange(preset.end);
                                        }}
                                        className="px-2 py-1 flex-1 rounded text-[10px] font-medium bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ChipBase>
    );
}
