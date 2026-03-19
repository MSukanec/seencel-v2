"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// TOOLBAR TOGGLE — Segmented Control for Toolbars
// ============================================================================
// A simple linear-style segmented control used to switch between primary views
// (e.g., "Sistema" vs "Propios"). Uses the same aesthetic as ViewsTabs.
// ============================================================================

export interface ToolbarToggleOption {
    /** Unique value for this option */
    value: string
    /** Display label */
    label: string
    /** Optional icon */
    icon?: React.ElementType
    /** Disabled state */
    disabled?: boolean
}

export interface ToolbarToggleProps {
    /** Currently active value */
    value: string
    /** Called when the active value changes */
    onValueChange: (value: string) => void
    /** List of options to display */
    options: ToolbarToggleOption[]
    /** Additional className */
    className?: string
}

export function ToolbarToggle({
    value,
    onValueChange,
    options,
    className,
}: ToolbarToggleProps) {
    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            {options.map((option) => {
                const isSelected = value === option.value
                const Icon = option.icon

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => !option.disabled && onValueChange(option.value)}
                        disabled={option.disabled}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 h-7 text-sm rounded-md transition-all whitespace-nowrap",
                            option.disabled && "opacity-40 cursor-not-allowed",
                            !option.disabled && isSelected
                                ? "bg-[var(--background)] text-foreground font-medium shadow-[0_1px_3px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] border border-white/[0.06]"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
