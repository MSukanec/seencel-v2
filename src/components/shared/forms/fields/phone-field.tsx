/**
 * Phone Field Factory
 * Standard 19.14 - Reusable phone input with country selector
 *
 * Provides a standardized phone input with:
 * - International country code selector
 * - E.164 format output
 * - Help text with format hint
 * - Consistent styling via FormGroup
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import { PhoneInput } from "@/components/ui/phone-input";
import { FactoryLabel } from "./field-wrapper";
import type { Country } from "react-phone-number-input";

export interface PhoneFieldProps {
    /** Current phone value (E.164 format, e.g. "+5491155551234") */
    value: string;
    /** Callback when value changes (returns E.164 string or empty) */
    onChange: (value: string) => void;
    /** Field label */
    label: string;
    /** Is field required? (default: false — phone is usually optional) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text for the input */
    placeholder?: string;
    /** Default country code (ISO 3166-1 alpha-2). Derived from organization/user data. */
    defaultCountry?: Country;
    /** Error message */
    error?: string;
    /** Help text below input */
    helpText?: string;
}

export function PhoneField({
    value,
    onChange,
    label,
    required = false,
    disabled = false,
    className,
    placeholder = "Ej: 11 5555-1234",
    defaultCountry,
    error,
    helpText = "Incluí el código de área sin el 0.",
}: PhoneFieldProps) {
    return (
        <FormGroup
            label={<FactoryLabel label={label} />}
            required={required}
            className={className}
            error={error}
            helpText={helpText}
        >
            <PhoneInput
                value={value}
                defaultCountry={defaultCountry}
                onChange={(val) => onChange(val || "")}
                disabled={disabled}
                placeholder={placeholder}
            />
        </FormGroup>
    );
}
