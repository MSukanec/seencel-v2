"use client";

// ============================================================================
// SIDEBAR PLAN BUTTON
// ============================================================================
// Shows current plan in sidebar. Uses the unified PlanBadge component directly.
// ============================================================================

import * as React from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/stores/organization-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { getPlans, getCurrentOrganizationPlanId, Plan } from "@/actions/plans";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanBadge } from "@/components/shared/plan-badge";

interface SidebarPlanButtonProps {
    isExpanded?: boolean;
}

export function SidebarPlanButton({ isExpanded = false }: SidebarPlanButtonProps) {
    const { activeOrgId, isFounder } = useOrganization();
    const planVersion = useOrganizationStore(state => state.planVersion);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPlanData() {
            setLoading(true);
            try {
                const [plans, currentPlanId] = await Promise.all([
                    getPlans(),
                    getCurrentOrganizationPlanId(),
                ]);

                if (currentPlanId && plans.length > 0) {
                    const found = plans.find((p) => p.id === currentPlanId);
                    if (found) {
                        setCurrentPlan(found);
                    }
                } else if (plans.length > 0) {
                    const freePlan = plans.find(p => p.name.toLowerCase().includes('free')) || plans[0];
                    setCurrentPlan(freePlan);
                }
            } catch (error) {
                console.error("Failed to load plan status:", error);
            } finally {
                setLoading(false);
            }
        }

        loadPlanData();
    }, [activeOrgId, isFounder, planVersion]);

    // Loading skeleton
    if (loading) {
        return (
            <div className="w-full">
                <Skeleton className={cn(
                    "h-8 rounded-lg",
                    isExpanded ? "w-full" : "w-8"
                )} />
            </div>
        );
    }

    if (!currentPlan) return null;

    return (
        <PlanBadge
            planSlug={currentPlan.slug || currentPlan.name}
            variant="glass"
            showLabel={isExpanded}
            className="w-full py-1.5"
        />
    );
}
