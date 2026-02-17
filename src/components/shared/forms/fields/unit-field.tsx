/**
 * Unit Field Factory
 * Standard 19.12 - Reusable Unit of Measurement Selector
 * 
 * Provides a standardized unit selector with:
 * - Consistent formatting: "Nombre (Símbolo)"
 * - Optional filtering by `applicable_to` (material, task, etc.)
 * - Searchable dropdown via SelectField
 * - Support for disabled / required / clearable states
 * - Configurable valueKey: "id" (default, for FKs) or "symbol" (for text columns)
 */

"use client";

import { useMemo } from "react";
import { SelectField, type SelectOption } from "./select-field";

// ============================================================================
// Types
// ============================================================================

export interface UnitOption {
    id: string;
    name: string;
    abbreviation?: string;
    symbol?: string | null;
    applicable_to?: string[];
}

export interface UnitFieldProps {
    /** Current selected value */
    value: string;
    /** Callback when unit changes */
    onChange: (value: string) => void;
    /** List of available units */
    units: UnitOption[];
    /** Which property to use as the select value: "id" (FK) or "symbol" (text). Default: "id" */
    valueKey?: "id" | "symbol";
    /** Optional filter: only show units applicable to this domain */
    applicableTo?: string;
    /** Field label (default: "Unidad de Medida") */
    label?: string;
    /** Is field required? (default: false) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Can be cleared to empty? (default: false) */
    clearable?: boolean;
    /** Custom className */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Error message */
    error?: string;
}

// ============================================================================
// Component
// ============================================================================

export function UnitField({
    value,
    onChange,
    units,
    valueKey = "id",
    applicableTo,
    label = "Unidad de Medida",
    required = false,
    disabled = false,
    clearable = false,
    className,
    placeholder = "Seleccionar unidad...",
    error,
}: UnitFieldProps) {
    const options: SelectOption[] = useMemo(() => {
        const filtered = applicableTo
            ? units.filter(u => u.applicable_to?.includes(applicableTo))
            : units;

        return filtered.map(u => {
            const displaySymbol = u.symbol || u.abbreviation || "";
            const optionValue = valueKey === "symbol"
                ? (displaySymbol || u.id)
                : u.id;

            return {
                value: optionValue,
                label: displaySymbol ? `${u.name} (${displaySymbol})` : u.name,
                searchTerms: `${u.name} ${u.abbreviation || ""} ${u.symbol || ""}`,
            };
        });
    }, [units, applicableTo, valueKey]);

    return (
        <SelectField
            value={value}
            onChange={onChange}
            options={options}
            label={label}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            clearable={clearable}
            className={className}
            error={error}
            searchable
            searchPlaceholder="Buscar unidad..."
            emptyState={{
                message: "No se encontraron unidades",
            }}
        />
    );
}
