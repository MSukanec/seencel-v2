"use client";

import { useState, useEffect } from "react";
import { BentoGrid, BentoCard } from "@/components/bento";
import { FINANCE_WIDGET_REGISTRY } from "./registry";
import { WidgetSize } from "./types";
import { sizeStyles } from "@/components/bento/bento-card";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface WidgetLayoutItem {
    id: string;
    size?: WidgetSize;
}

interface DashboardWidgetGridProps {
    layout: WidgetLayoutItem[];
    isEditing?: boolean;
}

// === SORTABLE WRAPPER ===
function SortableWidget({
    id,
    children,
    size,
    isEditing,
    onRemove
}: {
    id: string,
    children: React.ReactNode,
    size: WidgetSize,
    isEditing?: boolean,
    onRemove?: (id: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled: !isEditing }); // Disable functionality when not editing

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group touch-none",
                sizeStyles[size],
                isDragging && "opacity-80 scale-[1.02] shadow-2xl z-50 ring-2 ring-primary",
                isEditing && "ring-1 ring-border/50 border-dashed hover:ring-primary/50"
            )}
        >
            {/* Controls - Only visible when editing */}
            {isEditing && (
                <>
                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className={cn(
                            "absolute top-2 right-2 p-1.5 rounded-md cursor-grab active:cursor-grabbing z-20",
                            "bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm",
                            isDragging && "bg-primary text-primary-foreground"
                        )}
                    >
                        <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Remove Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent drag start
                            onRemove?.(id);
                        }}
                        className="absolute top-2 left-2 p-1.5 rounded-md cursor-pointer z-20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </>
            )}

            {/* Content Mask while editing to prevent interactions */}
            {isEditing && (
                <div className="absolute inset-0 z-10 bg-background/5 pointer-events-none" />
            )}

            {/* Widget Content */}
            <div className="h-full w-full">
                {children}
            </div>
        </div>
    );
}

// === ADD WIDGET PLACEHOLDER ===
function AddWidgetCard({ onAdd, usedIds }: { onAdd: (id: string) => void, usedIds: string[] }) {
    const availableWidgets = Object.values(FINANCE_WIDGET_REGISTRY).filter(w => !usedIds.includes(w.id));

    return (
        <div className={cn(sizeStyles['sm'], "flex")}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-2",
                        "border-2 border-dashed border-muted-foreground/20 rounded-xl",
                        "text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5",
                        "transition-all duration-200"
                    )}>
                        <div className="p-3 rounded-full bg-muted shadow-sm">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium">Agregar Widget</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-[200px]">
                    <DropdownMenuLabel>Widgets Disponibles</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableWidgets.length > 0 ? (
                        availableWidgets.map(w => (
                            <DropdownMenuItem key={w.id} onClick={() => onAdd(w.id)}>
                                <span>{w.name}</span>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                            No quedan widgets disponibles.
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}


export function DashboardWidgetGrid({ layout: defaultLayout, isEditing = false }: DashboardWidgetGridProps) {
    const [items, setItems] = useState<WidgetLayoutItem[]>(defaultLayout);
    const [isClient, setIsClient] = useState(false);

    // 1. Load from LocalStorage
    useEffect(() => {
        setIsClient(true);
        const saved = localStorage.getItem('seencel_finance_layout_v2');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const Validated = parsed.filter((i: any) => FINANCE_WIDGET_REGISTRY[i.id]);
                if (Validated.length > 0) setItems(Validated);
            } catch (e) {
                console.error("Failed to load layout", e);
            }
        }
    }, []);

    // 2. Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // 3. Handlers
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                const newLayout = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('seencel_finance_layout_v2', JSON.stringify(newLayout));
                return newLayout;
            });
        }
    };

    const handleRemove = (id: string) => {
        setItems(prev => {
            const newLayout = prev.filter(i => i.id !== id);
            localStorage.setItem('seencel_finance_layout_v2', JSON.stringify(newLayout));
            return newLayout;
        });
    };

    const handleAdd = (id: string) => {
        const def = FINANCE_WIDGET_REGISTRY[id];
        if (!def) return;
        setItems(prev => {
            const newLayout = [...prev, { id: def.id, size: def.defaultSize }];
            localStorage.setItem('seencel_finance_layout_v2', JSON.stringify(newLayout));
            return newLayout;
        });
    };

    if (!isClient) {
        return (
            <BentoGrid columns={4} gap="md">
                {defaultLayout.map((item) => {
                    const widgetDef = FINANCE_WIDGET_REGISTRY[item.id];
                    if (!widgetDef) return null;
                    const WidgetComponent = widgetDef.component;
                    return <WidgetComponent key={item.id} size={item.size || widgetDef.defaultSize} />;
                })}
            </BentoGrid>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <BentoGrid columns={4} gap="md">
                <SortableContext
                    items={items.map(i => i.id)}
                    strategy={rectSortingStrategy}
                >
                    {items.map((item) => {
                        const widgetDef = FINANCE_WIDGET_REGISTRY[item.id];
                        if (!widgetDef) return null;

                        const WidgetComponent = widgetDef.component;
                        const size = item.size || widgetDef.defaultSize;

                        return (
                            <SortableWidget
                                key={item.id}
                                id={item.id}
                                size={size}
                                isEditing={isEditing}
                                onRemove={handleRemove}
                            >
                                <WidgetComponent size={size} />
                            </SortableWidget>
                        );
                    })}
                </SortableContext>

                {/* Add Widget Button (Only visible in edit mode) */}
                {isEditing && (
                    <AddWidgetCard
                        onAdd={handleAdd}
                        usedIds={items.map(i => i.id)}
                    />
                )}
            </BentoGrid>
        </DndContext>
    );
}
