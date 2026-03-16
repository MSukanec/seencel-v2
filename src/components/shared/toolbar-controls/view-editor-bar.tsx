"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ============================================================================
// VIEW EDITOR BAR — Linear-style inline view creation/editing
// ============================================================================
// Appears as a bottom row in ToolbarCard when creating or editing a view.
// Shows: name input + Cancel/Save buttons.
//
// Usage:
//   <ViewEditorBar
//     name={editName}
//     onNameChange={setEditName}
//     onCancel={() => setEditing(null)}
//     onSave={() => handleSaveView()}
//   />
// ============================================================================

export interface ViewEditorBarProps {
    /** Current name being edited */
    name: string
    /** Name change handler */
    onNameChange: (name: string) => void
    /** Cancel editing */
    onCancel: () => void
    /** Save the view */
    onSave: () => void
    /** Whether save is disabled (e.g. empty name) */
    saveDisabled?: boolean
}

export function ViewEditorBar({
    name,
    onNameChange,
    onCancel,
    onSave,
    saveDisabled,
}: ViewEditorBarProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto-focus input on mount
    useEffect(() => {
        // Small delay to ensure animation has started
        const timeout = setTimeout(() => {
            inputRef.current?.focus()
            inputRef.current?.select()
        }, 50)
        return () => clearTimeout(timeout)
    }, [])

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-3 py-2",
                "border-t border-border/30",
                "animate-in slide-in-from-top-1 duration-150"
            )}
        >
            {/* Name input */}
            <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) onSave()
                    if (e.key === "Escape") onCancel()
                }}
                placeholder="Nombre de la vista..."
                className={cn(
                    "flex-1 bg-transparent text-sm font-medium text-foreground",
                    "placeholder:text-muted-foreground/50",
                    "outline-none border-none",
                    "min-w-0"
                )}
            />

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                    Cancelar
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSave}
                    disabled={saveDisabled || !name.trim()}
                    className="h-6 px-2 text-xs text-primary hover:text-primary disabled:opacity-40"
                >
                    Guardar
                </Button>
            </div>
        </div>
    )
}
