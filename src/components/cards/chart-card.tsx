"use client";

import { CardBase } from "./card-base";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================================================
// CHART CARD — Wrapper for any chart/visualization with header context
// ============================================================================
// Replaces: DashboardCard + BentoCard
// Usage: Wraps any chart from components/charts/ with title + actions
// ============================================================================

interface ChartCardProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    iconClassName?: string;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    /** Custom element in header right side */
    headerAction?: React.ReactNode;
    /** Optional footer (insights, legends, etc.) */
    footer?: React.ReactNode;
    /** Expand callback */
    onExpand?: () => void;
    /** Refresh callback */
    onRefresh?: () => void;
    /** If true, card won't stretch to fill grid height */
    compact?: boolean;
}

export function ChartCard({
    title,
    description,
    icon,
    iconClassName,
    children,
    className,
    contentClassName,
    headerAction,
    footer,
    onExpand,
    onRefresh,
    compact = false,
}: ChartCardProps) {
    const hasMenuActions = onExpand || onRefresh;

    return (
        <CardBase compact={compact} className={className}>
            <CardBase.Header
                title={title}
                description={description}
                icon={icon}
                iconClassName={iconClassName}
                action={
                    (headerAction || hasMenuActions) ? (
                        <div className="flex items-center gap-1">
                            {headerAction}
                            {hasMenuActions && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {onRefresh && <DropdownMenuItem onClick={onRefresh}>Actualizar</DropdownMenuItem>}
                                        {onExpand && (
                                            <DropdownMenuItem onClick={onExpand}>
                                                <Maximize2 className="mr-2 h-3 w-3" />
                                                Expandir
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    ) : undefined
                }
            />
            <CardBase.Body className={cn("overflow-hidden", contentClassName)}>
                {children}
            </CardBase.Body>
            {footer && <CardBase.Footer>{footer}</CardBase.Footer>}
        </CardBase>
    );
}
