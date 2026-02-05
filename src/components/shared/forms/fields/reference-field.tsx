/**
 * Reference Field Factory
 * Standard 19.17 - Reusable Reference/Transaction Input
 * 
 * Provides a standardized input for transaction references:
 * - Consistent placeholder
 * - Help text
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { FactoryLabel } from "./field-wrapper";

export interface ReferenceFieldProps {
    /** Current reference value */
    value: string;
    /** Callback when reference changes */
    onChange: (value: string) => void;
    /** Field label (default: "Referencia") */
    label?: string;
    /** Is field required? (default: false) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Help text below input */
    helpText?: string;
}

export function ReferenceField({
    value,
    onChange,
    label = "Referencia",
    required = false,
    disabled = false,
    className,
    placeholder = "Ej: TRX-12345",
    helpText = "Nro. de transacción o recibo",
}: ReferenceFieldProps) {
    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className} helpText={helpText}>
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            />
        </FormGroup>
    );
}
