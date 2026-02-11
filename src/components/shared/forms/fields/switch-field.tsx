/**
 * Switch Field Factory
 * Standard 19.14 - Reusable toggle/switch
 *
 * Provides a standardized switch with:
 * - Title label
 * - Optional description
 * - Common border + padding layout
 */

"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface SwitchFieldProps {
    /** Current checked state */
    value: boolean;
    /** Callback when toggled */
    onChange: (value: boolean) => void;
    /** Main label text */
    label: string;
    /** Description text below label */
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
        <div className={`flex flex-row items-center justify-between rounded-lg border p-4 ${className || ""}`}>
            <div className="space-y-0.5">
                <Label className="text-base text-foreground">{label}</Label>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <Switch
                checked={value}
                onCheckedChange={onChange}
                disabled={disabled}
            />
        </div>
    );
}
