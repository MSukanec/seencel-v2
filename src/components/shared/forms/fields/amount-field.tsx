/**
 * Amount Field Factory
 * Standard 19.14 - Reusable Amount/Money Input
 * 
 * Provides a standardized amount input with:
 * - Number formatting
 * - Step and min values
 * - Consistent placeholder
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { FactoryLabel } from "./field-wrapper";

export interface AmountFieldProps {
    /** Current amount value */
    value: string | number;
    /** Callback when amount changes */
    onChange: (value: string) => void;
    /** Field label (default: "Monto") */
    label?: string;
    /** Is field required? (default: true) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Minimum value (default: 0) */
    min?: number;
    /** Step value (default: 0.01) */
    step?: number;
    /** Help text below input */
    helpText?: string;
    /** Suffix text shown inside input on the right (e.g. unit symbol) */
    suffix?: string;
}

export function AmountField({
    value,
    onChange,
    label = "Monto",
    required = true,
    disabled = false,
    className,
    placeholder = "0.00",
    min = 0,
    step = 0.01,
    helpText,
    suffix,
}: AmountFieldProps) {
    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className} helpText={helpText}>
            <div className="relative">
                <Input
                    type="number"
                    step={step}
                    min={min}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={suffix ? "pr-12" : undefined}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none select-none">
                        {suffix}
                    </span>
                )}
            </div>
        </FormGroup>
    );
}
