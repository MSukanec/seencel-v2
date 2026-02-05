/**
 * Date Field Factory
 * Standard 19.15 - Reusable Date Picker
 * 
 * Provides a standardized date picker with:
 * - Spanish locale by default
 * - Consistent button styling
 * - Calendar popover
 */

"use client";

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
}

export function DateField({
    value,
    onChange,
    label = "Fecha",
    required = true,
    disabled = false,
    className,
    placeholder = "Seleccionar fecha",
    dateFormat = "PPP",
}: DateFieldProps) {
    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className}>
            <Popover>
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
                        onSelect={onChange}
                        locale={es}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </FormGroup>
    );
}
