/**
 * TimeChip — Unified time chip with "All Day" toggle
 *
 * A single chip that manages both start/end times and all-day mode.
 * Default: "Todo el día" (ON). When toggled OFF, popover shows
 * start + end time pickers.
 *
 * States:
 *   isAllDay=true  → chip shows "☀ Todo el día"
 *   isAllDay=false → chip shows "🕐 14:30 – 18:00"
 *
 * Usage:
 *   <TimeChip
 *     startTime="14:30"
 *     endTime="18:00"
 *     onStartTimeChange={setStartTime}
 *     onEndTimeChange={setEndTime}
 *     isAllDay={isAllDay}
 *     onAllDayChange={setIsAllDay}
 *   />
 */

"use client";

import * as React from "react";
import { Clock, Sun } from "lucide-react";
import { ChipBase } from "../chip-base";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface TimeChipProps {
    /** Start time in "HH:mm" format */
    startTime: string;
    /** End time in "HH:mm" format */
    endTime: string;
    /** Called when start time changes */
    onStartTimeChange: (value: string) => void;
    /** Called when end time changes */
    onEndTimeChange: (value: string) => void;
    /** Whether this event is "all day" */
    isAllDay: boolean;
    /** Toggle all-day mode */
    onAllDayChange: (isAllDay: boolean) => void;
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
        <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-muted-foreground w-10 shrink-0">
                {label}
            </span>
            <div className="flex items-center gap-1">
                {/* Hours */}
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => setTime(hours + 1, minutes)}
                        className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                        className="w-9 h-8 text-center text-sm font-mono font-semibold bg-muted/30 rounded-md border border-border/40 text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        maxLength={2}
                    />
                    <button
                        type="button"
                        onClick={() => setTime(hours - 1, minutes)}
                        className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                </div>

                <span className="text-sm font-mono font-semibold text-muted-foreground/60">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => setTime(hours, minutes + 5)}
                        className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                        className="w-9 h-8 text-center text-sm font-mono font-semibold bg-muted/30 rounded-md border border-border/40 text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        maxLength={2}
                    />
                    <button
                        type="button"
                        onClick={() => setTime(hours, minutes - 5)}
                        className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                </div>

                <span className="text-[10px] text-muted-foreground/50 font-medium ml-0.5">hs</span>
            </div>
        </div>
    );
}

// ─── Popover Content ─────────────────────────────────────

function TimePopoverContent({
    startTime,
    endTime,
    onStartTimeChange,
    onEndTimeChange,
    isAllDay,
    onAllDayChange,
}: {
    startTime: string;
    endTime: string;
    onStartTimeChange: (value: string) => void;
    onEndTimeChange: (value: string) => void;
    isAllDay: boolean;
    onAllDayChange: (isAllDay: boolean) => void;
}) {
    return (
        <div className="p-3 space-y-3">
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
                <div className="space-y-2 pt-1">
                    <TimeInput
                        label="Inicio"
                        value={startTime}
                        onChange={onStartTimeChange}
                    />
                    <div className="border-t border-border/20 my-1" />
                    <TimeInput
                        label="Fin"
                        value={endTime}
                        onChange={onEndTimeChange}
                    />

                    {/* Quick presets */}
                    <div className="pt-2 border-t border-border/20">
                        <div className="flex flex-wrap gap-1">
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
                                    className="px-2 py-1 rounded text-[10px] font-medium bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
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

export function TimeChip({
    startTime,
    endTime,
    onStartTimeChange,
    onEndTimeChange,
    isAllDay,
    onAllDayChange,
    readOnly = false,
    disabled = false,
    className,
}: TimeChipProps) {
    const [open, setOpen] = React.useState(false);

    // Label: "Todo el día" or "14:30 – 18:00"
    const label = isAllDay
        ? "Todo el día"
        : `${startTime || "00:00"} – ${endTime || "00:00"}`;

    const icon = isAllDay
        ? <Sun className="h-3.5 w-3.5 text-amber-500" />
        : <Clock className="h-3.5 w-3.5 text-muted-foreground" />;

    return (
        <ChipBase
            icon={icon}
            label={label}
            hasValue={true}
            readOnly={readOnly}
            disabled={disabled}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={240}
            className={className}
        >
            <TimePopoverContent
                startTime={startTime}
                endTime={endTime}
                onStartTimeChange={onStartTimeChange}
                onEndTimeChange={onEndTimeChange}
                isAllDay={isAllDay}
                onAllDayChange={(val) => {
                    onAllDayChange(val);
                    if (val) setOpen(false);
                }}
            />
        </ChipBase>
    );
}
