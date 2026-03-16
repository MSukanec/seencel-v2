"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

// ============================================================================
// TOOLBAR CARD — Reusable wrapper card for toolbar controls
// ============================================================================
// Uses Card variant="inset" to create a recessed/carved surface.
// Layout: LEFT slot (views) | RIGHT slot (filter, search, display).
//
// Usage:
//   <ToolbarCard
//     left={<ViewsTabs ... />}
//     right={<><FilterPopover /><SearchButton /><DisplayButton /></>}
//   />
//
// Legacy (children only) still works — renders as flex row.
// ============================================================================

export interface ToolbarCardProps {
    /** Left slot — views tabs, labels, etc */
    left?: React.ReactNode
    /** Right slot — filter, search, display controls */
    right?: React.ReactNode
    /** Bottom slot — active filters bar (second row) */
    bottom?: React.ReactNode
    /** Legacy: free-form children (renders as single flex row) */
    children?: React.ReactNode
    className?: string
}

export function ToolbarCard({ left, right, bottom, children, className }: ToolbarCardProps) {
    // Slot-based layout (new standard)
    if (left !== undefined || right !== undefined) {
        return (
            <Card
                variant="inset"
                className={cn(
                    "toolbar-inset shrink-0",
                    className
                )}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {left}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {right}
                    </div>
                </div>
                {bottom}
            </Card>
        )
    }

    // Legacy: children-only mode (backwards compatible)
    return (
        <Card
            variant="inset"
            className={cn(
                "toolbar-inset flex items-center gap-2 shrink-0",
                className
            )}
        >
            {children}
        </Card>
    )
}
