"use client";

import { Lock } from "lucide-react";
import { useProjectStatusSafe } from "@/features/projects/context/project-status-context";
import { cn } from "@/lib/utils";

// ============================================================================
// INACTIVE PROJECT BANNER
// ============================================================================
// Subtle, non-alarming banner that informs the user the project is inactive.
// Shows a "Reactivar" CTA. This is NOT a warning — it's a state indicator.
// ============================================================================

interface InactiveProjectBannerProps {
    /** Optional callback when "Reactivar" is clicked */
    onReactivate?: () => void;
    className?: string;
}

export function InactiveProjectBanner({ onReactivate, className }: InactiveProjectBannerProps) {
    const projectStatus = useProjectStatusSafe();

    // Don't render outside project context or for active projects
    if (!projectStatus || !projectStatus.isReadOnly) {
        return null;
    }

    return (
        <div
            className={cn(
                "flex items-center justify-between gap-4 px-4 py-2.5",
                "bg-amber-500/5 border-b border-amber-500/20",
                "dark:bg-amber-400/[0.03] dark:border-amber-400/15",
                className,
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-500/10 dark:bg-amber-400/10 shrink-0">
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400/80" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground/90 leading-tight">
                        Proyecto inactivo
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight">
                        Puedes ver la información, pero no editarla.
                    </p>
                </div>
            </div>

            {onReactivate && (
                <button
                    onClick={onReactivate}
                    className={cn(
                        "shrink-0 px-3 py-1.5 rounded-md text-xs font-medium",
                        "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20",
                        "dark:bg-amber-400/10 dark:text-amber-300 dark:hover:bg-amber-400/20",
                        "transition-colors duration-150",
                    )}
                >
                    Reactivar
                </button>
            )}
        </div>
    );
}
