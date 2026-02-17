"use client";

import React from "react";
import { GanttItem } from "./gantt-types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ============================================================================
// Gantt Tooltip — Hover popup with task details
// ============================================================================

interface GanttTooltipProps {
    item: GanttItem | null;
    x: number;
    y: number;
    visible: boolean;
}

export const GanttTooltip = React.memo(function GanttTooltip({
    item,
    x,
    y,
    visible,
}: GanttTooltipProps) {
    if (!visible || !item) return null;

    const duration = Math.ceil(
        (item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
        <div
            className="fixed z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100"
            style={{
                left: x + 12,
                top: y - 8,
            }}
        >
            <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px]">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    {item.statusColor && (
                        <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.statusColor }}
                        />
                    )}
                    <span className="font-semibold text-sm text-foreground truncate">
                        {item.label}
                    </span>
                </div>

                {/* Subtitle */}
                {item.subtitle && (
                    <p className="text-xs text-muted-foreground mb-2">{item.subtitle}</p>
                )}

                {/* Details */}
                <div className="space-y-1.5 text-xs">
                    {/* Dates */}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Inicio</span>
                        <span className="font-medium">
                            {format(item.startDate, "dd MMM yyyy", { locale: es })}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Fin</span>
                        <span className="font-medium">
                            {format(item.endDate, "dd MMM yyyy", { locale: es })}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Duración</span>
                        <span className="font-medium">
                            {duration} {duration === 1 ? "día" : "días"}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="pt-1">
                        <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="font-medium">{Math.round(item.progress)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${Math.min(100, item.progress)}%` }}
                            />
                        </div>
                    </div>

                    {/* Responsible */}
                    {item.avatar && (
                        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={item.avatar.src} />
                                <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                                    {item.avatar.fallback}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">Responsable</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
