/**
 * Color Field Factory
 * Standard 19.14 - Reusable Color Picker
 *
 * Circle-based color picker with:
 * - Predefined palette
 * - "No color" option
 * - Ring highlight for active
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import { FactoryLabel } from "./field-wrapper";
import { cn } from "@/lib/utils";

export interface ColorFieldProps {
    /** Current selected color hex value */
    value: string | undefined;
    /** Callback when color changes */
    onChange: (value: string) => void;
    /** Field label (default: "Color") */
    label?: string;
    /** Palette of hex colors to display */
    colors: string[];
    /** Allow "no color" option (default: true) */
    allowNone?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Help text below picker */
    helpText?: string;
}

export function ColorField({
    value,
    onChange,
    label = "Color",
    colors,
    allowNone = true,
    disabled = false,
    className,
    helpText,
}: ColorFieldProps) {
    return (
        <FormGroup
            label={<FactoryLabel label={label} />}
            className={className}
            helpText={helpText}
        >
            <div className="flex flex-wrap gap-3 p-1">
                {colors.map((color) => (
                    <button
                        key={color}
                        type="button"
                        disabled={disabled}
                        className={cn(
                            "w-8 h-8 rounded-full transition-all",
                            "hover:scale-110 hover:shadow-md",
                            disabled && "opacity-50 cursor-not-allowed",
                            value === color && "ring-2 ring-offset-2 ring-primary"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => onChange(color)}
                    />
                ))}
                {allowNone && (
                    <button
                        type="button"
                        disabled={disabled}
                        className={cn(
                            "w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30",
                            "hover:scale-110 hover:border-muted-foreground/50 transition-all",
                            disabled && "opacity-50 cursor-not-allowed",
                            !value && "ring-2 ring-offset-2 ring-primary"
                        )}
                        onClick={() => onChange("")}
                        title="Sin color"
                    />
                )}
            </div>
        </FormGroup>
    );
}
