/**
 * Switch Field Factory
 * Standard 19.14 - Reusable toggle/switch
 *
 * Follows the same pattern as every other field:
 * - Label on top via FormGroup
 * - Content below: description text + switch inline
 * - No borders, same height as other fields
 */

"use client";

import { Switch } from "@/components/ui/switch";
import { FormGroup } from "@/components/ui/form-group";
import { FactoryLabel } from "./field-wrapper";

export interface SwitchFieldProps {
    /** Current checked state */
    value: boolean;
    /** Callback when toggled */
    onChange: (value: boolean) => void;
    /** Main label text (shown as FormGroup label) */
    label: string;
    /** Description text shown inline next to switch */
    description?: string;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for outer container */
    className?: string;
}

export function SwitchField({
    value,
    onChange,
    label,
    description,
    disabled = false,
    className,
}: SwitchFieldProps) {
    return (
        <FormGroup label={<FactoryLabel label={label} />} className={className}>
            <div className="flex items-center justify-between h-9 px-3 rounded-md bg-transparent border border-input">
                {description && (
                    <span className="text-sm text-muted-foreground">{description}</span>
                )}
                <Switch
                    checked={value}
                    onCheckedChange={onChange}
                    disabled={disabled}
                />
            </div>
        </FormGroup>
    );
}
