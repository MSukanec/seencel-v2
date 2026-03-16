"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"


// ============================================================================
// VIEWS TABS — Linear-style view selector for toolbars
// ============================================================================
// Renders horizontal tabs: "Todos" (always) + saved views + "+ Nueva vista"
// Each saved view has context menu: Rename, Edit (opens editor), Update filters, Delete
// "Nueva vista" triggers onStartCreate → parent opens ViewEditorBar
// ============================================================================

export interface SavedViewItem {
    id: string
    name: string
    viewMode?: string | null
    filters?: unknown
}

export interface ViewsTabsProps {
    /** List of saved views */
    views: SavedViewItem[]
    /** Currently active view ID (null = "Todos") */
    activeViewId: string | null
    /** Called when user clicks a view tab */
    onSelectView: (viewId: string | null) => void
    /** Called when user clicks "+ Nueva vista" — parent opens ViewEditorBar */
    onStartCreate: () => void
    /** Called when user renames a view */
    onRenameView: (viewId: string, name: string) => void
    /** Called when user wants to edit a view (opens ViewEditorBar pre-filled) */
    onStartEdit: (viewId: string) => void
    /** Called when user wants to update a view's filters to current */
    onUpdateFilters: (viewId: string) => void
    /** Called when user deletes a view */
    onDeleteView: (viewId: string) => void
    /** Label for the "all" tab (default: "Todos") */
    allLabel?: string
    /** Additional className for the container */
    className?: string
}

export function ViewsTabs({
    views,
    activeViewId,
    onSelectView,
    onStartCreate,
    onRenameView,
    onStartEdit,
    onUpdateFilters,
    onDeleteView,
    allLabel = "Todos",
    className,
}: ViewsTabsProps) {
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [renameValue, setRenameValue] = useState("")
    const renameInputRef = useRef<HTMLInputElement>(null)
    const [deleteTarget, setDeleteTarget] = useState<SavedViewItem | null>(null)

    // Focus input when entering rename mode
    useEffect(() => {
        if (renamingId) renameInputRef.current?.focus()
    }, [renamingId])

    const handleRenameSubmit = useCallback(() => {
        const trimmed = renameValue.trim()
        if (trimmed && renamingId) {
            onRenameView(renamingId, trimmed)
        }
        setRenamingId(null)
        setRenameValue("")
    }, [renameValue, renamingId, onRenameView])

    const startRename = useCallback((view: SavedViewItem) => {
        setRenamingId(view.id)
        setRenameValue(view.name)
    }, [])

    return (
        <>
        <div className={cn("flex items-center gap-1.5", className)}>
            {/* "Todos" tab — always present */}
            <button
                type="button"
                onClick={() => onSelectView(null)}
                className={cn(
                    "inline-flex items-center px-2.5 h-7 text-sm rounded-md transition-all whitespace-nowrap",
                    activeViewId === null
                        ? "bg-[var(--background)] text-foreground font-medium shadow-[0_1px_3px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] border border-white/[0.06]"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                {allLabel}
            </button>

            {/* Saved view tabs */}
            {views.map((view) => (
                <React.Fragment key={view.id}>
                    {renamingId === view.id ? (
                        /* Inline rename input */
                        <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameSubmit()
                                if (e.key === "Escape") {
                                    setRenamingId(null)
                                    setRenameValue("")
                                }
                            }}
                            className="h-7 px-2.5 text-sm bg-muted/50 rounded-md border border-border/50 outline-none focus:ring-1 focus:ring-primary/50 min-w-[80px] max-w-[160px]"
                        />
                    ) : (
                        /* View tab with context menu */
                        <ContextMenu>
                            <ContextMenuTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => onSelectView(view.id)}
                                        className={cn(
                                            "inline-flex items-center px-2.5 h-7 text-sm rounded-md transition-all whitespace-nowrap",
                                            activeViewId === view.id
                                                ? "bg-[var(--background)] text-foreground font-medium shadow-[0_1px_3px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] border border-white/[0.06]"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {view.name}
                                    </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-44">
                                <ContextMenuItem onSelect={() => onStartEdit(view.id)} className="gap-2 text-xs">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Editar vista
                                </ContextMenuItem>
                                <ContextMenuItem onSelect={() => startRename(view)} className="gap-2 text-xs">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Renombrar
                                </ContextMenuItem>
                                <ContextMenuItem onSelect={() => onUpdateFilters(view.id)} className="gap-2 text-xs">
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Actualizar filtros
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem onSelect={() => setDeleteTarget(view)} className="gap-2 text-xs">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Eliminar
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    )}
                </React.Fragment>
            ))}

            {/* Create new view — triggers parent to open ViewEditorBar */}
            <button
                type="button"
                onClick={onStartCreate}
                className="inline-flex items-center gap-1 px-2 h-7 text-xs text-muted-foreground hover:text-foreground rounded-md transition-all whitespace-nowrap"
            >
                <Plus className="h-3.5 w-3.5" />
                Nueva vista
            </button>
        </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar vista</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que querés eliminar la vista &ldquo;{deleteTarget?.name}&rdquo;? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteTarget) {
                                    onDeleteView(deleteTarget.id)
                                    setDeleteTarget(null)
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
