/**
 * Text Field Factory
 * Standard 19.14 - Reusable text input
 *
 * Provides a standardized text input with:
 * - Optional leading icon
 * - Optional autoFocus
 * - Error display
 * - Consistent styling via FormGroup
 */

"use client";

import { LucideIcon } from "lucide-react";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { FactoryLabel } from "./field-wrapper";
import { cn } from "@/lib/utils";

export interface TextFieldProps {
    /** Current text value */
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
    /** Leading icon */
    icon?: LucideIcon;
    /** Auto-focus the input */
    autoFocus?: boolean;
    /** Error message */
    error?: string;
    /** Help text below input */
    helpText?: string;
    /** HTML input type (default: "text") */
    type?: string;
}

export function TextField({
    value,
    onChange,
    label,
    required = true,
    disabled = false,
    className,
    placeholder,
    icon: Icon,
    autoFocus = false,
    error,
    helpText,
    type = "text",
}: TextFieldProps) {
    return (
        <FormGroup
            label={<FactoryLabel label={label} />}
            required={required}
            className={className}
            error={error}
            helpText={helpText}
        >
            <div className={cn(Icon && "relative")}>
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    className={cn(Icon && "pl-10")}
                />
            </div>
        </FormGroup>
    );
}
