"use client";

import * as React from "react";
import { Check, Pencil, Copy, Trash2, Eye } from "lucide-react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

// ============================================================================
// EntityContextMenu — Structured context menu with 4 fixed zones
// ============================================================================
//
// Layout (fixed order, separators auto-managed):
//
//   ┌─────────────────────────┐
//   │  Ver detalle             │  ZONE 1: Standard actions
//   │  Editar                  │  (onView, onEdit, onDuplicate)
//   │  Duplicar                │
//   ├─────────────────────────┤
//   │  Estado        →         │  ZONE 2: Entity parameters
//   │  Tipo          →         │  (submenus with selectable options)
//   │  Categorías    →         │
//   ├─────────────────────────┤
//   │  📞 Llamar               │  ZONE 3: Custom actions
//   │  ✉️ Enviar email          │  (entity-specific, conditional)
//   ├─────────────────────────┤
//   │  🗑️ Eliminar              │  ZONE 4: Delete (always last, gray)
//   └─────────────────────────┘
//
// ============================================================================

// ─── Types ───────────────────────────────────────────────

/** A submenu parameter (e.g. Status, Type, Category) */
export interface EntityParameter<T = any> {
    /** Display label (e.g. "Estado", "Tipo") */
    label: string;
    /** Icon component */
    icon?: React.ComponentType<{ className?: string }>;
    /** Available options for the submenu */
    options: {
        value: string;
        label: string;
        icon?: React.ReactNode;
    }[];
    /** Key on the entity to get the current value (for showing checkmark) */
    currentValueKey?: string;
    /** Called when an option is selected */
    onSelect: (data: T, value: string) => void;
    /** Conditional visibility */
    visible?: (data: T) => boolean;
}

/** A custom action (e.g. "Llamar") */
export interface EntityCustomAction<T = any> {
    /** Display label */
    label: string;
    /** Icon element (e.g. <Phone className="h-3.5 w-3.5" />) */
    icon?: React.ReactNode;
    /** Click handler */
    onClick: (data: T) => void;
    /** Conditional visibility */
    visible?: (data: T) => boolean;
}

// ─── Props ───────────────────────────────────────────────

interface EntityContextMenuProps<T> {
    /** The entity data */
    data: T;
    /** Children to wrap (card, row, etc.) */
    children: React.ReactNode;

    // ── Zone 1: Standard actions (fixed labels, fixed icons) ──
    /** "Ver detalle" — navigate to entity detail */
    onView?: (data: T) => void;
    /** "Editar" — open edit panel/form */
    onEdit?: (data: T) => void;
    /** "Duplicar" — duplicate entity */
    onDuplicate?: (data: T) => void;

    // ── Zone 2: Entity parameters (submenus) ──
    /** Submenus for entity properties (Estado, Tipo, Categoría, etc.) */
    parameters?: EntityParameter<T>[];

    // ── Zone 3: Custom actions ──
    /** Entity-specific actions (Llamar, Adjuntar, Enviar email, etc.) */
    customActions?: EntityCustomAction<T>[];

    // ── Zone 4: Delete (always last) ──
    /** "Eliminar" — always last, gray, separated */
    onDelete?: (data: T) => void;
}

// ─── Component ───────────────────────────────────────────

export function EntityContextMenu<T>({
    data,
    children,
    onView,
    onEdit,
    onDuplicate,
    parameters,
    customActions,
    onDelete,
}: EntityContextMenuProps<T>) {
    // Filter visible items
    const visibleParams = parameters?.filter(p => !p.visible || p.visible(data)) || [];
    const visibleCustom = customActions?.filter(a => !a.visible || a.visible(data)) || [];

    const hasZone1 = onView || onEdit || onDuplicate;
    const hasZone2 = visibleParams.length > 0;
    const hasZone3 = visibleCustom.length > 0;
    const hasZone4 = !!onDelete;

    // If no actions at all, just render children
    if (!hasZone1 && !hasZone2 && !hasZone3 && !hasZone4) {
        return <>{children}</>;
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">

                {/* ── ZONE 1: Standard actions ── */}
                {onView && (
                    <ContextMenuItem onSelect={() => onView(data)} className="gap-2 text-xs">
                        <Eye className="h-3.5 w-3.5" />
                        Ver detalle
                    </ContextMenuItem>
                )}
                {onEdit && (
                    <ContextMenuItem onSelect={() => onEdit(data)} className="gap-2 text-xs">
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                    </ContextMenuItem>
                )}
                {onDuplicate && (
                    <ContextMenuItem onSelect={() => onDuplicate(data)} className="gap-2 text-xs">
                        <Copy className="h-3.5 w-3.5" />
                        Duplicar
                    </ContextMenuItem>
                )}

                {/* ── ZONE 2: Entity parameters (submenus) ── */}
                {hasZone2 && (
                    <>
                        {hasZone1 && <ContextMenuSeparator />}
                        {visibleParams.map((param, index) => {
                            const Icon = param.icon;
                            const currentValue = param.currentValueKey
                                ? (data as any)[param.currentValueKey]
                                : undefined;

                            return (
                                <ContextMenuSub key={index}>
                                    <ContextMenuSubTrigger className="gap-2 text-xs">
                                        {Icon && <Icon className="h-3.5 w-3.5" />}
                                        {param.label}
                                    </ContextMenuSubTrigger>
                                    <ContextMenuSubContent className="w-48">
                                        {param.options.map((option) => (
                                            <ContextMenuItem
                                                key={option.value}
                                                onSelect={() => param.onSelect(data, option.value)}
                                                className="gap-2 text-xs"
                                            >
                                                {option.icon && (
                                                    <span className="flex-shrink-0">{option.icon}</span>
                                                )}
                                                <span className="flex-1">{option.label}</span>
                                                {currentValue === option.value && (
                                                    <Check className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                                                )}
                                            </ContextMenuItem>
                                        ))}
                                    </ContextMenuSubContent>
                                </ContextMenuSub>
                            );
                        })}
                    </>
                )}

                {/* ── ZONE 3: Custom actions ── */}
                {hasZone3 && (
                    <>
                        {(hasZone1 || hasZone2) && <ContextMenuSeparator />}
                        {visibleCustom.map((action, index) => (
                            <ContextMenuItem
                                key={index}
                                onSelect={() => action.onClick(data)}
                                className="gap-2 text-xs"
                            >
                                {action.icon}
                                {action.label}
                            </ContextMenuItem>
                        ))}
                    </>
                )}

                {/* ── ZONE 4: Delete — always last, gray, separated ── */}
                {hasZone4 && (
                    <>
                        <ContextMenuSeparator />
                        <ContextMenuItem onSelect={() => onDelete!(data)} className="gap-2 text-xs">
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                        </ContextMenuItem>
                    </>
                )}

            </ContextMenuContent>
        </ContextMenu>
    );
}
