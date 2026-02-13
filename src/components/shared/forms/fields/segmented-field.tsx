/**
 * Segmented Field Factory
 * Standard 19.15 - Reusable segmented control
 *
 * Provides a standardized segmented toggle with:
 * - Multiple options with icons and labels
 * - Primary color for active state
 * - Full-width layout
 * - Agnostic: works for any set of options
 */

"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export interface SegmentedOption<T extends string> {
    /** Value identifier */
    value: T;
    /** Display label */
    label: string;
    /** Optional icon */
    icon?: LucideIcon;
}

export interface SegmentedFieldProps<T extends string> {
    /** Current selected value */
    value: T;
    /** Callback when selection changes */
    onChange: (value: T) => void;
    /** Available options */
    options: SegmentedOption<T>[];
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for outer container */
    className?: string;
}

export function SegmentedField<T extends string>({
    value,
    onChange,
    options,
    disabled = false,
    className,
}: SegmentedFieldProps<T>) {
    return (
        <div className={cn("flex gap-1 p-1 bg-muted rounded-lg w-full", className)}>
            {options.map((option) => {
                const isActive = value === option.value;
                const Icon = option.icon;
                return (
                    <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
