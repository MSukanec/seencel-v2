"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GanttDisplayRow, GanttGroup, GanttItem, GANTT_ROW_HEIGHT } from "./gantt-types";
import { ChevronDown, ChevronRight } from "lucide-react";

// ============================================================================
// Gantt Task List — Left panel with task details and group headers
// ============================================================================

interface GanttTaskListProps {
    items: GanttItem[];
    displayRows?: GanttDisplayRow[];
    taskListRef: React.RefObject<HTMLDivElement | null>;
    onScroll: () => void;
    onItemClick?: (id: string) => void;
    onGroupToggle?: (groupId: string) => void;
    width: number;
    className?: string;
}

export const GanttTaskList = React.memo(function GanttTaskList({
    items,
    displayRows,
    taskListRef,
    onScroll,
    onItemClick,
    onGroupToggle,
    width,
    className,
}: GanttTaskListProps) {
    // If no displayRows provided, render flat list (backwards compatible)
    const rows: GanttDisplayRow[] = displayRows
        ?? items.map((item, index) => ({ type: "item" as const, item, originalIndex: index }));

    if (rows.length === 0) return null;

    return (
        <div
            className={cn(
                "shrink-0 border-r border-border bg-background overflow-hidden",
                className
            )}
            style={{ width }}
        >
            {/* Task list header */}
            <div
                className="flex items-center px-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground select-none"
                style={{ height: 56 }}
            >
                <span className="flex-1 truncate">Tarea</span>
                <span className="w-16 text-center shrink-0">Avance</span>
            </div>

            {/* Task list body */}
            <div
                ref={taskListRef}
                className="overflow-y-auto overflow-x-hidden"
                onScroll={onScroll}
                style={{ height: "calc(100% - 56px)" }}
            >
                {rows.map((row, index) => {
                    if (row.type === "group") {
                        return (
                            <GroupHeaderRow
                                key={`group-${row.group.id}`}
                                group={row.group}
                                itemCount={row.itemCount}
                                onToggle={onGroupToggle}
                            />
                        );
                    }

                    return (
                        <TaskItemRow
                            key={row.item.id}
                            item={row.item}
                            index={index}
                            hasGroups={!!displayRows}
                            onClick={onItemClick}
                        />
                    );
                })}
            </div>
        </div>
    );
});

// ============================================================================
// Group Header Row
// ============================================================================

function GroupHeaderRow({
    group,
    itemCount,
    onToggle,
}: {
    group: GanttGroup;
    itemCount: number;
    onToggle?: (groupId: string) => void;
}) {
    return (
        <div
            className="flex items-center gap-2 px-2 border-b border-border/30 bg-muted/40 cursor-pointer select-none hover:bg-muted/60 transition-colors"
            style={{ height: GANTT_ROW_HEIGHT }}
            onClick={() => onToggle?.(group.id)}
        >
            {group.isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="text-xs font-semibold text-foreground truncate flex-1">
                {group.label}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                {itemCount}
            </span>
        </div>
    );
}

// ============================================================================
// Task Item Row
// ============================================================================

function TaskItemRow({
    item,
    index,
    hasGroups,
    onClick,
}: {
    item: GanttItem;
    index: number;
    hasGroups: boolean;
    onClick?: (id: string) => void;
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 border-b border-border/10 cursor-pointer transition-colors",
                "hover:bg-accent/50",
                index % 2 === 0 ? "bg-background" : "bg-muted/10",
                hasGroups ? "pl-6 pr-3" : "px-3"
            )}
            style={{ height: GANTT_ROW_HEIGHT }}
            onClick={() => onClick?.(item.id)}
        >
            {/* Avatar */}
            {item.avatar && (
                <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={item.avatar.src} />
                    <AvatarFallback className="text-[9px] font-bold bg-primary text-primary-foreground">
                        {item.avatar.fallback}
                    </AvatarFallback>
                </Avatar>
            )}

            {/* Status dot */}
            {item.statusColor && !item.avatar && (
                <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.statusColor }}
                />
            )}

            {/* Name and subtitle */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-tight">
                    {item.label}
                </p>
                {item.subtitle && (
                    <p className="text-[10px] text-muted-foreground truncate leading-tight">
                        {item.subtitle}
                    </p>
                )}
            </div>

            {/* Progress */}
            <div className="w-16 shrink-0 flex items-center justify-center">
                <div className="flex items-center gap-1">
                    <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                item.progress >= 100
                                    ? "bg-gantt-complete"
                                    : item.progress > 0
                                        ? "bg-gantt-progress"
                                        : ""
                            )}
                            style={{ width: `${Math.min(100, item.progress)}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-right">
                        {Math.round(item.progress)}%
                    </span>
                </div>
            </div>
        </div>
    );
}
