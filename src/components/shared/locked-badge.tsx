"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface LockedBadgeProps {
    /** Content to wrap (tab, button, select, etc.) */
    children: React.ReactNode;
    /** Tooltip text shown on hover */
    reason?: string;
    /** Additional classes for the wrapper */
    className?: string;
}

/**
 * LockedBadge — Wraps any element to indicate it's locked/coming soon.
 * 
 * - Overlays a small lock icon badge
 * - Disables interaction (pointer-events-none)
 * - Shows a tooltip on hover with the reason
 * - Does NOT change the size of the wrapped element
 * 
 * @example
 * <LockedBadge>
 *     <TabsTrigger value="appearance">Apariencia</TabsTrigger>
 * </LockedBadge>
 * 
 * <LockedBadge reason="Disponible en próxima actualización">
 *     <Button>Exportar</Button>
 * </LockedBadge>
 */
export function LockedBadge({
    children,
    reason = "Próximamente",
    className,
}: LockedBadgeProps) {
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn("relative inline-flex", className)}>
                        {/* Wrapped element — disabled */}
                        <div className="pointer-events-none opacity-50">
                            {children}
                        </div>

                        {/* Lock badge — absolute top-right */}
                        <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center h-3.5 w-3.5 rounded-full bg-primary border border-primary/80 shadow-sm">
                            <Lock className="h-2 w-2 text-primary-foreground" />
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                    {reason}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
