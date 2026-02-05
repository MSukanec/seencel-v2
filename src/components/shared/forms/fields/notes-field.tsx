/**
 * Notes Field Factory
 * Standard 19.16 - Reusable Notes/Description Textarea
 * 
 * Provides a standardized textarea for notes with:
 * - Consistent styling
 * - Default row count
 * - Placeholder text
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import { Textarea } from "@/components/ui/textarea";
import { FactoryLabel } from "./field-wrapper";

export interface NotesFieldProps {
    /** Current notes value */
    value: string;
    /** Callback when notes change */
    onChange: (value: string) => void;
    /** Field label (default: "Notas") */
    label?: string;
    /** Is field required? (default: false) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Number of visible rows (default: 3) */
    rows?: number;
}

export function NotesField({
    value,
    onChange,
    label = "Notas",
    required = false,
    disabled = false,
    className,
    placeholder = "Agregar notas adicionales...",
    rows = 3,
}: NotesFieldProps) {
    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className}>
            <Textarea
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                rows={rows}
            />
        </FormGroup>
    );
}
