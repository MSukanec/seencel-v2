"use client";

import { cn } from "@/lib/utils";
import { FlaskConical } from "lucide-react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

/**
 * BetaBadge — Inline badge to mark features as Beta.
 * 
 * Designed to be placed next to any text element: titles, buttons, selects, etc.
 * On hover, shows a popover explaining the feature is in development.
 * 
 * Style: warm stone/cream tones — architectural, not crypto.
 * 
 * Usage:
 *   <span className="flex items-center gap-2">
 *       <span>Plantillas PDF</span>
 *       <BetaBadge />
 *   </span>
 */
export function BetaBadge({ className }: { className?: string }) {
    return (
        <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
                <span
                    className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-0.5 gap-0.5",
                        "text-[9px] font-semibold uppercase leading-none tracking-wider",
                        "bg-stone-400/10 text-stone-400 border border-stone-400/20",
                        "select-none shrink-0 cursor-help",
                        "hover:bg-stone-400/15 transition-colors",
                        className,
                    )}
                >
                    Beta
                </span>
            </HoverCardTrigger>
            <HoverCardContent
                className="w-56 p-3"
                side="bottom"
                align="center"
                sideOffset={8}
            >
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-stone-400/10 flex items-center justify-center shrink-0">
                            <FlaskConical className="h-3.5 w-3.5 text-stone-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold leading-tight">
                                En desarrollo
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Esta funcionalidad está en fase beta. Puede tener cambios o mejoras en futuras actualizaciones.
                    </p>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
