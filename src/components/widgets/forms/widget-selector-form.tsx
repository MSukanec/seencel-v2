"use client";

import { useMemo } from "react";
import { useModal } from "@/stores/modal-store";
import { cn } from "@/lib/utils";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    getSortedGroups,
    WIDGET_GROUP_LABELS,
} from "@/components/widgets/registry";
import type { WidgetDefinition } from "@/components/widgets/grid/types";

// ============================================================================
// WIDGET SELECTOR FORM (Semi-Autónomo)
// ============================================================================
// Modal para seleccionar y agregar widgets al dashboard.
// Muestra widgets agrupados en Accordion (un grupo abierto a la vez).
// Al seleccionar un widget, se llama onAdd, se cierra el modal.
// ============================================================================

interface WidgetSelectorFormProps {
    /** Full widget registry */
    registry: Record<string, WidgetDefinition>;
    /** IDs of widgets already in use (non-configurable ones get disabled) */
    usedIds: string[];
    /** Callback to add a widget by ID */
    onAdd: (id: string) => void;
}

export function WidgetSelectorForm({ registry, usedIds, onAdd }: WidgetSelectorFormProps) {
    const { closeModal } = useModal();

    // Group widgets by their group key
    const grouped = useMemo(() => {
        const groups: Record<string, WidgetDefinition[]> = {};
        Object.values(registry).forEach(def => {
            if (!groups[def.group]) groups[def.group] = [];
            groups[def.group].push(def);
        });
        return groups;
    }, [registry]);

    const sortedGroupKeys = useMemo(
        () => getSortedGroups(Object.keys(grouped)),
        [grouped]
    );

    const handleSelect = (widgetId: string) => {
        onAdd(widgetId);
        closeModal();
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <Accordion
                    type="single"
                    collapsible
                    defaultValue={sortedGroupKeys[0]}
                    className="space-y-2"
                >
                    {sortedGroupKeys.map(group => {
                        const widgets = grouped[group];
                        const availableCount = widgets.filter(
                            def => !def.comingSoon && (def.configurable || !usedIds.includes(def.id))
                        ).length;

                        return (
                            <AccordionItem
                                key={group}
                                value={group}
                                className="border border-border/60 rounded-xl bg-muted/30 px-3 overflow-hidden data-[state=open]:bg-muted/50 transition-colors"
                            >
                                <AccordionTrigger className="py-3 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold">
                                            {WIDGET_GROUP_LABELS[group] || group}
                                        </span>
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {availableCount}/{widgets.length} disponibles
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-3 pt-0">
                                    <div className="space-y-0.5">
                                        {widgets.map(def => {
                                            const isUsed = !def.configurable && usedIds.includes(def.id);
                                            const isComingSoon = !!def.comingSoon;
                                            const isDisabled = isUsed || isComingSoon;
                                            return (
                                                <button
                                                    key={def.id}
                                                    onClick={() => handleSelect(def.id)}
                                                    disabled={isDisabled}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                                                        isDisabled
                                                            ? "opacity-40 cursor-not-allowed"
                                                            : "hover:bg-background/80 hover:text-primary cursor-pointer"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="font-medium">{def.name}</span>
                                                        {isComingSoon && (
                                                            <span className="text-[10px] uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded-md font-semibold shrink-0">
                                                                Próximamente
                                                            </span>
                                                        )}
                                                        {!isComingSoon && isUsed && (
                                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium shrink-0">
                                                                En uso
                                                            </span>
                                                        )}
                                                        {!isComingSoon && !isUsed && def.configurable && usedIds.includes(def.id) && (
                                                            <span className="text-[10px] uppercase tracking-wider text-primary/60 font-medium shrink-0">
                                                                En uso · Agregar otro
                                                            </span>
                                                        )}
                                                    </div>
                                                    {def.description && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {def.description}
                                                        </p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
        </div>
    );
}
