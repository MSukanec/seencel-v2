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

    // Before store is hydrated, render a static placeholder (same dimensions, no skeleton flash)
    if (!isHydrated || !planSlug) {
        return (
            <div
                className={cn(
                    "rounded-md bg-[#2b2b2b] opacity-40",
                    isExpanded ? "h-8 w-full" : "h-8 w-8"
                )}
            />
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
