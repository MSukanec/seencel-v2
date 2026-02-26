/**
 * Currency Field Factory (Smart)
 * Standard 19.11 - Reusable Currency Selector
 * 
 * - Self-populating: reads currencies from useFormData() store
 * - Consistent formatting (Name + Symbol)
 * - Default currency pre-selection via is_default
 * - Override: pass `currencies` prop to use custom list
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
import { useFormData } from "@/stores/organization-store";

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
    /** Override: pass custom currencies list. Default: reads from store */
    currencies?: Currency[];
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
    currencies: currenciesOverride,
    label = "Moneda",
    required = true,
    disabled = false,
    className,
    placeholder = "Seleccionar moneda",
}: CurrencyFieldProps) {
    // Smart: read from store by default, allow override
    const storeData = useFormData();
    const currencies = currenciesOverride ?? (storeData.currencies as Currency[]);

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
