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
}: AmountFieldProps) {
    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className} helpText={helpText}>
            <Input
                type="number"
                step={step}
                min={min}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            />
        </FormGroup>
    );
}
