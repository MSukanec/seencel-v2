"use client";

import { FormGroup } from "@/components/ui/form-group";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { FactoryLabel } from "./field-wrapper";
import { cn } from "@/lib/utils";

export interface TimeFieldProps {
    /** Current time value in "HH:mm" format */
    value: string;
    /** Callback when time changes */
    onChange: (value: string) => void;
    /** Field label (default: "Hora") */
    label?: string;
    /** Is field required? (default: false) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Minute step increment (default: 5) */
    minuteStep?: number;
}

function parseTime(value: string): { hours: number; minutes: number } {
    if (!value) return { hours: 0, minutes: 0 };
    const [h, m] = value.split(":").map(Number);
    return { hours: isNaN(h) ? 0 : h, minutes: isNaN(m) ? 0 : m };
}

function formatTime(hours: number, minutes: number): string {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDisplayTime(value: string): string {
    if (!value) return "";
    const { hours, minutes } = parseTime(value);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} hs`;
}

export function TimeField({
    value,
    onChange,
    label = "Hora",
    required = false,
    disabled = false,
    className,
    placeholder = "Seleccionar hora",
    minuteStep = 5,
}: TimeFieldProps) {
    const { hours, minutes } = parseTime(value);

    const adjustHours = (delta: number) => {
        const newHours = ((hours + delta) % 24 + 24) % 24;
        onChange(formatTime(newHours, minutes));
    };

    const adjustMinutes = (delta: number) => {
        let newMinutes = minutes + delta;
        let newHours = hours;

        if (newMinutes >= 60) {
            newMinutes = 0;
            newHours = (newHours + 1) % 24;
        } else if (newMinutes < 0) {
            newMinutes = 60 + delta;
            newHours = ((newHours - 1) % 24 + 24) % 24;
        }

        onChange(formatTime(newHours, newMinutes));
    };

    const handleHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "");
        if (val === "") return;
        const num = Math.min(23, Math.max(0, parseInt(val)));
        onChange(formatTime(num, minutes));
    };

    const handleMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "");
        if (val === "") return;
        const num = Math.min(59, Math.max(0, parseInt(val)));
        onChange(formatTime(hours, num));
    };

    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <Clock className="mr-2 h-4 w-4" />
                        {value ? formatDisplayTime(value) : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                    <div className="flex items-center gap-2">
                        {/* Hours Column */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Horas</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-12 rounded-md"
                                onClick={() => adjustHours(1)}
                                tabIndex={-1}
                            >
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                value={String(hours).padStart(2, "0")}
                                onChange={handleHourInput}
                                className="w-12 h-12 text-center text-2xl font-semibold bg-muted/50 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary/30 tabular-nums"
                                aria-label="Horas"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-12 rounded-md"
                                onClick={() => adjustHours(-1)}
                                tabIndex={-1}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Separator */}
                        <span className="text-2xl font-bold text-muted-foreground select-none mt-4">:</span>

                        {/* Minutes Column */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Min</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-12 rounded-md"
                                onClick={() => adjustMinutes(minuteStep)}
                                tabIndex={-1}
                            >
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                value={String(minutes).padStart(2, "0")}
                                onChange={handleMinuteInput}
                                className="w-12 h-12 text-center text-2xl font-semibold bg-muted/50 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary/30 tabular-nums"
                                aria-label="Minutos"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-12 rounded-md"
                                onClick={() => adjustMinutes(-minuteStep)}
                                tabIndex={-1}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </FormGroup>
    );
}
