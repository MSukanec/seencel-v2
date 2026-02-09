"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GanttItem, GANTT_ROW_HEIGHT } from "./gantt-types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ============================================================================
// Gantt Task List — Left panel with task details
// ============================================================================

interface GanttTaskListProps {
    items: GanttItem[];
    taskListRef: React.RefObject<HTMLDivElement | null>;
    onScroll: () => void;
    onItemClick?: (id: string) => void;
    width: number;
    className?: string;
}

export const GanttTaskList = React.memo(function GanttTaskList({
    items,
    taskListRef,
    onScroll,
    onItemClick,
    width,
    className,
}: GanttTaskListProps) {
    if (items.length === 0) return null;

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
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className={cn(
                            "flex items-center gap-2 px-3 border-b border-border/10 cursor-pointer transition-colors",
                            "hover:bg-accent/50",
                            index % 2 === 0 ? "bg-background" : "bg-muted/10"
                        )}
                        style={{ height: GANTT_ROW_HEIGHT }}
                        onClick={() => onItemClick?.(item.id)}
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
                                                ? "bg-green-500"
                                                : item.progress > 0
                                                    ? "bg-primary"
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
                ))}
            </div>
        </div>
    );
});
