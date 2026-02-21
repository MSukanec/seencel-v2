"use client";

// ============================================================================
// SIDEBAR PLAN BUTTON
// ============================================================================
// Shows current plan badge in sidebar.
// Data comes from the organization store (hydrated in layout).
// Zero additional queries — instant render.
// ============================================================================

import { cn } from "@/lib/utils";
import { useOrganization } from "@/stores/organization-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { PlanBadge } from "@/components/shared/plan-badge";

interface SidebarPlanButtonProps {
    isExpanded?: boolean;
}

export function SidebarPlanButton({ isExpanded = false }: SidebarPlanButtonProps) {
    const { planSlug, isFounder } = useOrganization();
    const isHydrated = useOrganizationStore(state => state.isHydrated);

    // Before store is hydrated, render nothing (avoid skeleton flash)
    if (!isHydrated) {
        return (
            <div
                className={cn(
                    "rounded-md bg-muted/30",
                    isExpanded ? "h-8 w-full" : "h-8 w-8"
                )}
            />
        );
    }

    // No org / no plan — show subtle fallback
    if (!planSlug) {
        if (!isExpanded) return null; // No mostrar nada colapsado
        return (
            <div className="w-full rounded-md border border-dashed border-border/50 px-3 py-1.5 text-center">
                <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                    Sin Plan
                </span>
            </div>
        );
    }

    return (
        <PlanBadge
            planSlug={planSlug}
            isFounder={isFounder}
            showLabel={isExpanded}
            className="w-full py-1.5"
        />
    );
}
