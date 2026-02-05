/**
 * Exchange Rate Field Factory
 * Standard 19.18 - Reusable Exchange Rate Input
 * 
 * Provides a standardized input for exchange rates:
 * - 4 decimal places by default
 * - Min value of 0
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { FactoryLabel } from "./field-wrapper";

export interface ExchangeRateFieldProps {
    /** Current exchange rate value */
    value: string | number;
    /** Callback when exchange rate changes */
    onChange: (value: string) => void;
    /** Field label (default: "Tipo de Cambio") */
    label?: string;
    /** Is field required? (default: false) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Step value (default: 0.0001) */
    step?: number;
}

export function ExchangeRateField({
    value,
    onChange,
    label = "Tipo de Cambio",
    required = false,
    disabled = false,
    className,
    placeholder = "1.0000",
    step = 0.0001,
}: ExchangeRateFieldProps) {
    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className}>
            <Input
                type="number"
                step={step}
                min={0}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            />
        </FormGroup>
    );
}
