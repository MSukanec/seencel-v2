"use client";

import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    GanttItem,
    GanttBarPosition,
    GANTT_BAR_HEIGHT,
    GANTT_BAR_VERTICAL_PADDING,
    GANTT_MILESTONE_SIZE,
} from "./gantt-types";

// ============================================================================
// Gantt Bar — Individual task bar with drag, resize, progress
// ============================================================================

interface GanttBarProps {
    item: GanttItem;
    position: GanttBarPosition;
    dayWidth: number;
    readOnly?: boolean;
    isConnecting?: boolean;
    isConnectTarget?: boolean;
    onDragStart?: (id: string, startX: number) => void;
    onResizeStart?: (id: string, startX: number) => void;
    onClick?: (id: string) => void;
    onConnectStart?: (id: string, side: "left" | "right") => void;
    onConnectEnd?: (id: string) => void;
}

export const GanttBar = React.memo(function GanttBar({
    item,
    position,
    dayWidth,
    readOnly = false,
    isConnecting = false,
    isConnectTarget = false,
    onDragStart,
    onResizeStart,
    onClick,
    onConnectStart,
    onConnectEnd,
}: GanttBarProps) {
    const [isHovered, setIsHovered] = useState(false);
    const barRef = useRef<HTMLDivElement>(null);

    // --- Milestone ---
    if (item.isMilestone) {
        return (
            <div
                className="absolute group cursor-pointer"
                style={{
                    left: -GANTT_MILESTONE_SIZE / 2,
                    top: GANTT_BAR_VERTICAL_PADDING + (GANTT_BAR_HEIGHT - GANTT_MILESTONE_SIZE) / 2,
                }}
                onClick={() => onClick?.(item.id)}
            >
                <div
                    className={cn(
                        "rotate-45 border-2 transition-all",
                        item.color || "bg-primary border-primary",
                        "group-hover:scale-110 group-hover:shadow-lg"
                    )}
                    style={{
                        width: GANTT_MILESTONE_SIZE,
                        height: GANTT_MILESTONE_SIZE,
                    }}
                />
                {/* Label */}
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground whitespace-nowrap">
                    {item.label}
                </span>
            </div>
        );
    }

    // --- Drag handler ---
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (readOnly || item.isDisabled) return;
            e.stopPropagation();
            e.preventDefault();
            onDragStart?.(item.id, e.clientX);
        },
        [readOnly, item.isDisabled, item.id, onDragStart]
    );

    // --- Resize handler ---
    const handleResizeMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (readOnly || item.isDisabled) return;
            e.stopPropagation();
            e.preventDefault();
            onResizeStart?.(item.id, e.clientX);
        },
        [readOnly, item.isDisabled, item.id, onResizeStart]
    );

    // --- Connect handler ---
    const handleConnectMouseDown = useCallback(
        (e: React.MouseEvent, side: "left" | "right") => {
            if (readOnly) return;
            e.stopPropagation();
            e.preventDefault();
            onConnectStart?.(item.id, side);
        },
        [readOnly, item.id, onConnectStart]
    );
    const progressWidth = Math.max(0, Math.min(100, item.progress));

    // Show dots when hovered OR when any bar is in connecting mode
    const showDots = !readOnly && !item.isDisabled && (isHovered || isConnecting);

    return (
        <div
            ref={barRef}
            className={cn(
                "absolute transition-all duration-100",
                !readOnly && !item.isDisabled && "cursor-grab active:cursor-grabbing",
                item.isDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
                left: 0,
                right: 0,
                top: GANTT_BAR_VERTICAL_PADDING,
                height: GANTT_BAR_HEIGHT,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={handleMouseDown}
            onMouseUp={() => {
                if (isConnecting) onConnectEnd?.(item.id);
            }}
            onClick={() => onClick?.(item.id)}
        >
            {/* Invisible hover extender — catches mouse in the dot zone without changing visuals */}
            <div
                className="absolute pointer-events-auto"
                style={{ inset: "-8px -24px" }}
            />

            {/* Bar background */}
            <div
                className={cn(
                    "absolute inset-0 rounded-md border transition-all",
                    isConnectTarget
                        ? "border-primary ring-2 ring-primary/30 bg-primary/10"
                        : isHovered && !item.isDisabled
                            ? "shadow-md ring-2 ring-primary/20 scale-y-110"
                            : "shadow-sm",
                    item.color
                        ? ""
                        : "bg-muted/50 border-border"
                )}
                style={item.color ? {
                    backgroundColor: `${item.color}33`,
                    borderColor: `${item.color}66`,
                } : undefined}
            />

            {/* Actual date bar (rendered inside the planned bar) */}
            {item.actualStartDate && item.actualEndDate && (() => {
                const plannedSpanDays = Math.max(1, differenceInDays(item.endDate, item.startDate));
                const actualOffsetDays = differenceInDays(item.actualStartDate, item.startDate);
                const actualSpanDays = Math.max(1, differenceInDays(item.actualEndDate, item.actualStartDate));

                const leftPercent = Math.max(0, (actualOffsetDays / plannedSpanDays) * 100);
                const widthPercent = Math.min(100 - leftPercent, (actualSpanDays / plannedSpanDays) * 100);

                return (
                    <div
                        className={cn(
                            "absolute top-[3px] bottom-[3px] rounded transition-all",
                            item.color ? "" : (
                                progressWidth >= 100 ? "bg-gantt-complete" : "bg-gantt-progress/70"
                            )
                        )}
                        style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            ...(item.color ? { backgroundColor: `${item.color}aa` } : {}),
                        }}
                    />
                );
            })()}

            {/* Progress fill (fallback when no actual dates) */}
            {!item.actualStartDate && progressWidth > 0 && (
                <div
                    className={cn(
                        "absolute left-0 top-[3px] bottom-[3px] rounded transition-all",
                        item.color ? "" : (
                            progressWidth >= 100 ? "bg-gantt-complete" : "bg-gantt-progress/70"
                        )
                    )}
                    style={{
                        width: `${progressWidth}%`,
                        ...(item.color ? { backgroundColor: `${item.color}88` } : {}),
                    }}
                />
            )}

            {/* Content overlay */}
            <div className="absolute inset-0 flex items-center gap-1.5 px-2 z-10 min-w-0">
                {/* Status dot */}
                {item.statusColor && (
                    <div
                        className="h-2 w-2 rounded-full shrink-0 ring-1 ring-background"
                        style={{ backgroundColor: item.statusColor }}
                    />
                )}

                {/* Progress text */}
                {progressWidth > 0 && position.width > 40 && (
                    <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                        {Math.round(progressWidth)}%
                    </span>
                )}
            </div>

            {/* Resize handle (right edge) */}
            {!readOnly && !item.isDisabled && isHovered && (
                <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-20 flex items-center justify-center"
                    onMouseDown={handleResizeMouseDown}
                >
                    <div className="w-[3px] h-3 rounded-full bg-foreground/40" />
                </div>
            )}

            {/* Connection points (for creating dependencies) */}
            {showDots && (
                <>
                    {/* Left connector */}
                    <div
                        className="absolute -left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background cursor-crosshair z-30 transition-transform hover:scale-150 shadow-sm"
                        onMouseDown={(e) => handleConnectMouseDown(e, "left")}
                    />
                    {/* Right connector */}
                    <div
                        className="absolute -right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background cursor-crosshair z-30 transition-transform hover:scale-150 shadow-sm"
                        onMouseDown={(e) => handleConnectMouseDown(e, "right")}
                    />
                </>
            )}
        </div>
    );
});
