"use client";

import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
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
                    left: position.x - GANTT_MILESTONE_SIZE / 2,
                    top: position.y + GANTT_BAR_VERTICAL_PADDING + (GANTT_BAR_HEIGHT - GANTT_MILESTONE_SIZE) / 2,
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
                "absolute group transition-all duration-100",
                !readOnly && !item.isDisabled && "cursor-grab active:cursor-grabbing",
                item.isDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
                left: position.x,
                top: position.y + GANTT_BAR_VERTICAL_PADDING,
                width: position.width,
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
            {/* Invisible extended hover zone for connection dots */}
            <div className="absolute -inset-x-7 inset-y-0 pointer-events-auto" />

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
                        : "bg-primary/20 border-primary/40"
                )}
                style={item.color ? {
                    backgroundColor: `${item.color}33`,
                    borderColor: `${item.color}66`,
                } : undefined}
            />

            {/* Progress fill */}
            {progressWidth > 0 && (
                <div
                    className={cn(
                        "absolute left-0 top-0 bottom-0 rounded-l-md transition-all",
                        progressWidth >= 100 && "rounded-r-md",
                        item.color ? "" : "bg-primary/50"
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

                {/* Avatar (only if bar is wide enough) */}
                {item.avatar && position.width > 50 && (
                    <Avatar className="h-5 w-5 shrink-0 border border-background">
                        <AvatarImage src={item.avatar.src} />
                        <AvatarFallback className="text-[9px] font-bold bg-primary text-primary-foreground">
                            {item.avatar.fallback}
                        </AvatarFallback>
                    </Avatar>
                )}

                {/* Label inside bar (only if wide enough) */}
                {position.width > 100 && (
                    <span className="text-[11px] font-medium text-foreground truncate leading-none min-w-0">
                        {item.label}
                    </span>
                )}

                {/* Progress text (only if very wide) */}
                {position.width > 140 && progressWidth > 0 && (
                    <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                        {Math.round(progressWidth)}%
                    </span>
                )}
            </div>

            {/* External label (when bar is too small) */}
            {position.width <= 100 && (
                <span
                    className="absolute text-[11px] font-medium text-foreground whitespace-nowrap leading-none z-10 pointer-events-none"
                    style={{
                        left: position.width + 6,
                        top: "50%",
                        transform: "translateY(-50%)",
                    }}
                >
                    {item.label}
                    {progressWidth > 0 && (
                        <span className="text-muted-foreground ml-1.5">
                            {Math.round(progressWidth)}%
                        </span>
                    )}
                </span>
            )}

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
                        className="absolute -left-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background cursor-crosshair z-30 transition-transform hover:scale-125"
                        onMouseDown={(e) => handleConnectMouseDown(e, "left")}
                    />
                    {/* Right connector */}
                    <div
                        className="absolute -right-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background cursor-crosshair z-30 transition-transform hover:scale-125"
                        onMouseDown={(e) => handleConnectMouseDown(e, "right")}
                    />
                </>
            )}
        </div>
    );
});
