"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

/**
 * Draggable Bento Grid
 * 
 * Grid system con drag & drop para reorganizar Bento cards.
 */

export interface DraggableItem {
    id: string;
    content: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'wide' | 'tall';
}

interface DraggableBentoGridProps {
    items: DraggableItem[];
    onReorder?: (items: DraggableItem[]) => void;
    columns?: 2 | 3 | 4;
    gap?: 'sm' | 'md' | 'lg';
    className?: string;
}

const gapStyles = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
};

const columnStyles = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4'
};

const sizeStyles: Record<string, string> = {
    sm: 'col-span-1 row-span-1',
    md: 'col-span-1 md:col-span-2 row-span-1',
    lg: 'col-span-1 md:col-span-2 row-span-2',
    wide: 'col-span-full row-span-1',
    tall: 'col-span-1 row-span-2'
};

export function DraggableBentoGrid({
    items: externalItems,
    onReorder,
    columns = 4,
    gap = 'md',
    className
}: DraggableBentoGridProps) {
    const [items, setItems] = useState(externalItems);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Sync items when external items change (e.g., when palette colors update)
    // Preserve order if items just changed content, reset if items were added/removed
    useEffect(() => {
        const currentIds = items.map(i => i.id);
        const newIds = externalItems.map(i => i.id);

        // Check if same items exist (just content changed)
        const sameItems = currentIds.length === newIds.length &&
            currentIds.every((id, idx) => newIds.includes(id));

        if (sameItems) {
            // Preserve user's order, update content
            setItems(prevItems =>
                prevItems.map(prevItem => {
                    const newItem = externalItems.find(i => i.id === prevItem.id);
                    return newItem ? { ...prevItem, content: newItem.content } : prevItem;
                })
            );
        } else {
            // Items changed, reset to new order
            setItems(externalItems);
        }
    }, [externalItems]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                onReorder?.(newItems);
                return newItems;
            });
        }
    }, [onReorder]);

    const activeItem = items.find((i) => i.id === activeId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                <div
                    className={cn(
                        "grid grid-cols-1 auto-rows-[minmax(180px,auto)]",
                        columnStyles[columns],
                        gapStyles[gap],
                        className
                    )}
                >
                    {items.map((item) => (
                        <SortableCard key={item.id} item={item} />
                    ))}
                </div>
            </SortableContext>

            {/* Drag overlay for smooth animation */}
            <DragOverlay adjustScale>
                {activeItem ? (
                    <div className={cn(
                        "opacity-90 rotate-3 scale-105",
                        sizeStyles[activeItem.size || 'sm']
                    )}>
                        {activeItem.content}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// Individual sortable card wrapper
function SortableCard({ item }: { item: DraggableItem }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group",
                sizeStyles[item.size || 'sm'],
                isDragging && "opacity-50 z-50"
            )}
        >
            {/* Drag handle - visible on hover */}
            <button
                {...attributes}
                {...listeners}
                className={cn(
                    "absolute -top-2 -left-2 z-20 p-1.5 rounded-lg",
                    "bg-background/90 backdrop-blur-sm border shadow-lg",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                    "cursor-grab active:cursor-grabbing",
                    "hover:bg-accent hover:border-primary/30"
                )}
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Card content */}
            <div className="h-full">
                {item.content}
            </div>
        </div>
    );
}
