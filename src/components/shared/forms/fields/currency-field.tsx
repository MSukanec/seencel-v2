/**
 * Currency Field Factory
 * Standard 19.11 - Reusable Currency Selector
 * 
 * Provides a standardized currency selector with:
 * - Consistent formatting (Name + Symbol)
 * - Default currency pre-selection via is_default
 * - Support for disabled state
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FactoryLabel } from "./field-wrapper";

export interface Currency {
    id: string;
    code: string;
    name: string;
    symbol: string;
    is_default?: boolean;
}

export interface CurrencyFieldProps {
    /** Current selected currency ID */
    value: string;
    /** Callback when currency changes */
    onChange: (value: string) => void;
    /** List of available currencies */
    currencies: Currency[];
    /** Field label (default: "Moneda") */
    label?: string;
    /** Is field required? (default: true) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
}

export function CurrencyField({
    value,
    onChange,
    currencies,
    label = "Moneda",
    required = true,
    disabled = false,
    className,
    placeholder = "Seleccionar moneda",
}: CurrencyFieldProps) {
    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className}>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                            {currency.name} ({currency.symbol})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FormGroup>
    );
}
