/**
 * Rich Text Field Factory
 * Standard 19.14 - Reusable rich text input
 *
 * Provides a standardized rich text input with:
 * - Consistent styling via FormGroup
 * - Error display
 * - Forwarded minHeight and maxHeight properties
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { FactoryLabel } from "./field-wrapper";

export interface RichTextFieldProps {
    /** Current text value (HTML string) */
    value: string;
    /** Callback when value changes */
    onChange: (value: string) => void;
    /** Field label */
    label: string;
    /** Is field required? (default: true) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Error message */
    error?: string;
    /** Help text below input */
    helpText?: string;
    /** Minimum height of the editor area */
    minHeight?: string;
    /** Maximum height of the editor area */
    maxHeight?: string;
}

export function RichTextField({
    value,
    onChange,
    label,
    required = true,
    disabled = false,
    className,
    placeholder,
    error,
    helpText,
    minHeight = "150px",
    maxHeight = "400px",
}: RichTextFieldProps) {
    return (
        <FormGroup
            label={<FactoryLabel label={label} />}
            required={required}
            className={className}
            error={error}
            helpText={helpText}
        >
            <RichTextEditor
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                minHeight={minHeight}
                maxHeight={maxHeight}
            />
        </FormGroup>
    );
}
