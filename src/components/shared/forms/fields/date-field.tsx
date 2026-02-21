/**
 * Date Field Factory
 * Standard 19.15 - Reusable Date Picker
 *
 * Provides a standardized date picker with:
 * - Spanish locale by default
 * - Month/Year dropdown navigation for fast selection
 * - Consistent button styling
 * - Calendar popover with auto-close on select
 * - Configurable date range (startMonth / endMonth)
 */

"use client";

import { useState } from "react";
import { FormGroup } from "@/components/ui/form-group";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FactoryLabel } from "./field-wrapper";

export interface DateFieldProps {
    /** Current selected date */
    value: Date | undefined;
    /** Callback when date changes */
    onChange: (value: Date | undefined) => void;
    /** Field label (default: "Fecha") */
    label?: string;
    /** Is field required? (default: true) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Date format (default: "PPP" = "4 de febrero de 2026") */
    dateFormat?: string;
    /** Earliest selectable month (default: January 1920) */
    startMonth?: Date;
    /** Latest selectable month (default: 10 years from now) */
    endMonth?: Date;
    /** Error message */
    error?: string;
    /** Help text */
    helpText?: string;
}

// Default range — covers birthdates (from 1920) and future planning (10 years ahead)
const DEFAULT_START_MONTH = new Date(1920, 0);
const DEFAULT_END_MONTH = new Date(new Date().getFullYear() + 10, 11);

export function DateField({
    value,
    onChange,
    label = "Fecha",
    required = true,
    disabled = false,
    className,
    placeholder = "Seleccionar fecha",
    dateFormat = "PPP",
    startMonth = DEFAULT_START_MONTH,
    endMonth = DEFAULT_END_MONTH,
    error,
    helpText,
}: DateFieldProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (date: Date | undefined) => {
        onChange(date);
        // Auto-close popover on selection for better UX
        if (date) setOpen(false);
    };

    return (
        <FormGroup
            label={<FactoryLabel label={label} />}
            required={required}
            className={className}
            error={error}
            helpText={helpText}
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
                        {value ? format(value, dateFormat, { locale: es }) : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleSelect}
                        locale={es}
                        captionLayout="dropdown"
                        startMonth={startMonth}
                        endMonth={endMonth}
                        defaultMonth={value || new Date()}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </FormGroup>
    );
}
