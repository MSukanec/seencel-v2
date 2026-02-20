"use client";

import { useState, useMemo } from "react";
import { TaskAction, TaskElement } from "@/features/tasks/types";
import { toggleElementAction } from "../actions";
import { toast } from "sonner";
import { Zap, ChevronDown, ChevronRight, Boxes } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ViewEmptyState } from "@/components/shared/empty-state";

// ============================================================================
// Types
// ============================================================================

interface ElementActionLink {
    action_id: string;
    element_id: string;
}

interface AccionesCatalogViewProps {
    actions: TaskAction[];
    elements?: TaskElement[];
    elementActionLinks?: ElementActionLink[];
    isAdminMode?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function TasksAccionesView({
    actions,
    elements = [],
    elementActionLinks = [],
    isAdminMode = false,
}: AccionesCatalogViewProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

    // Build element IDs set per action
    const elementsByAction = useMemo(() => {
        const map: Record<string, Set<string>> = {};
        elementActionLinks.forEach(link => {
            if (!map[link.action_id]) {
                map[link.action_id] = new Set();
            }
            map[link.action_id].add(link.element_id);
        });
        return map;
    }, [elementActionLinks]);

    // Filter actions by search
    const filteredActions = useMemo(() => {
        if (!searchQuery.trim()) return actions;
        const q = searchQuery.toLowerCase();
        return actions.filter(a =>
            (a.name && a.name.toLowerCase().includes(q)) ||
            (a.short_code && a.short_code.toLowerCase().includes(q)) ||
            (a.action_type && a.action_type.toLowerCase().includes(q)) ||
            (a.description && a.description.toLowerCase().includes(q))
        );
    }, [actions, searchQuery]);

    // Sort by sort_order then name
    const sortedActions = useMemo(() => {
        return [...filteredActions].sort((a, b) => {
            const orderA = a.sort_order ?? 999;
            const orderB = b.sort_order ?? 999;
            if (orderA !== orderB) return orderA - orderB;
            return (a.name || "").localeCompare(b.name || "");
        });
    }, [filteredActions]);

    // Sort elements alphabetically
    const sortedElementsList = useMemo(() => {
        return [...elements].sort((a, b) => a.name.localeCompare(b.name));
    }, [elements]);

    // ========================================================================
    // Toggle expand
    // ========================================================================

    const toggleExpand = (actionId: string) => {
        setExpandedActions(prev => {
            const next = new Set(prev);
            if (next.has(actionId)) {
                next.delete(actionId);
            } else {
                next.add(actionId);
            }
            return next;
        });
    };

    // ========================================================================
    // Toggle element association
    // ========================================================================

    const handleToggleElement = async (actionId: string, elementId: string, isLinked: boolean) => {
        if (!isAdminMode) return;

        const result = await toggleElementAction(actionId, elementId, !isLinked);
        if (result.error) {
            toast.error(result.error);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <>
            {/* Toolbar */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar acciones..."
                actions={[]}
            />

            {/* Actions List */}
            {sortedActions.length === 0 ? (
                searchQuery ? (
                    <ViewEmptyState
                        mode="no-results"
                        icon={Zap}
                        viewName="acciones"
                        filterContext="con ese criterio de búsqueda"
                        onResetFilters={() => setSearchQuery("")}
                    />
                ) : (
                    <ViewEmptyState
                        mode="empty"
                        icon={Zap}
                        viewName="Acciones"
                        featureDescription="Las acciones definen el tipo de trabajo a realizar (ej: Ejecución, Demolición, Limpieza). Se vinculan a elementos para definir combinaciones válidas."
                    />
                )
            ) : (
                <div className="space-y-3">
                    {sortedActions.map((action) => {
                        const isExpanded = expandedActions.has(action.id);
                        const linkedElemIds = elementsByAction[action.id] || new Set();
                        const elemCount = linkedElemIds.size;

                        return (
                            <Card key={action.id} className="overflow-hidden">
                                {/* Action header */}
                                <div className="flex items-center justify-between p-4 bg-muted/30">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Expand button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => toggleExpand(action.id)}
                                        >
                                            {isExpanded
                                                ? <ChevronDown className="h-4 w-4" />
                                                : <ChevronRight className="h-4 w-4" />
                                            }
                                        </Button>

                                        {/* Icon */}
                                        <div className="p-2 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
                                            <Zap className="h-4 w-4" />
                                        </div>

                                        {/* Name and meta */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-medium">{action.name}</h3>
                                                {action.short_code && (
                                                    <Badge variant="outline" className="text-xs font-mono">
                                                        {action.short_code}
                                                    </Badge>
                                                )}
                                                {action.action_type && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {action.action_type}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {elemCount} elemento{elemCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            {action.description && (
                                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                                    {action.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Elements grid (collapsible) */}
                                {isExpanded && (
                                    <div className="border-t p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Boxes className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Elementos Compatibles</span>
                                        </div>

                                        {elements.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No hay elementos definidos. Creá algunos en la pestaña Elementos.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {sortedElementsList.map((elem) => {
                                                    const isLinked = linkedElemIds.has(elem.id);
                                                    return (
                                                        <label
                                                            key={elem.id}
                                                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${isLinked
                                                                ? 'bg-amber-500/10 border border-amber-500/30'
                                                                : 'bg-muted/30 hover:bg-muted/50'
                                                                }`}
                                                        >
                                                            <Checkbox
                                                                checked={isLinked}
                                                                disabled={!isAdminMode}
                                                                onCheckedChange={() => handleToggleElement(action.id, elem.id, isLinked)}
                                                            />
                                                            <span className="text-sm truncate">{elem.name}</span>
                                                            {elem.code && (
                                                                <span className="text-xs font-mono text-muted-foreground shrink-0">
                                                                    {elem.code}
                                                                </span>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </>
    );
}
