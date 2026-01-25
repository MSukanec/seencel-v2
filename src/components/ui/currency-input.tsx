"use client";

import * as React from "react";
import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    onValueChange?: (values: { floatValue?: number; value: string }) => void;
    value?: number;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ className, value, onValueChange, ...props }, ref) => {
        // Internal state for display string
        const [displayValue, setDisplayValue] = React.useState(value?.toString() || "");

        React.useEffect(() => {
            // Sync internal state if external value changes and is different
            if (value !== undefined && parseFloat(displayValue) !== value) {
                setDisplayValue(value.toString());
            }
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            // Allow only numbers and one decimal point
            if (newValue === "" || /^\d*\.?\d*$/.test(newValue)) {
                setDisplayValue(newValue);
                const floatVal = parseFloat(newValue);
                onValueChange?.({
                    value: newValue,
                    floatValue: isNaN(floatVal) ? undefined : floatVal,
                });
            }
        };

        return (
            <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    inputMode="decimal"
                    className={cn("pl-9", className)}
                    ref={ref}
                    value={displayValue}
                    onChange={handleChange}
                    {...props}
                />
            </div>
        );
    }
);
CurrencyInput.displayName = "CurrencyInput";
