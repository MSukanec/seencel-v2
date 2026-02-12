"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/stores/organization-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { Zap, Sparkles, Users, Building2 } from "lucide-react";
import { getPlans, getCurrentOrganizationPlanId, Plan } from "@/actions/plans";
import { getPlanDisplayName } from "@/lib/plan-utils";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// SIDEBAR PLAN BUTTON
// ============================================================================
// Shows current plan in sidebar
// ============================================================================

interface SidebarPlanButtonProps {
    isExpanded?: boolean;
}

// Plan styling based on plan name
const getPlanStyle = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("enterprise") || lower.includes("empresa")) {
        return { icon: Building2, cssVar: "var(--plan-enterprise)" };
    }
    if (lower.includes("team")) {
        return { icon: Users, cssVar: "var(--plan-teams)" };
    }
    if (lower.includes("pro")) {
        return { icon: Zap, cssVar: "var(--plan-pro)" };
    }
    // Free / Default
    return { icon: Sparkles, cssVar: "var(--plan-free)" };
};

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
    }, [activeOrgId, isFounder, planVersion]); // Re-fetch when plan is invalidated

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

    const styles = getPlanStyle(currentPlan.name);
    const Icon = styles.icon;

    // Compact tag — full width but visually distinct from nav items
    return (
        <Link href="/pricing" className="w-full block">
            <div
                className={cn(
                    "flex items-center gap-1.5 rounded-md border border-white/10 hover:border-white/20 transition-colors",
                    isExpanded ? "px-2.5 py-1.5" : "justify-center p-1.5"
                )}
                style={{ backgroundColor: `color-mix(in oklch, ${styles.cssVar}, transparent 70%)` }}
            >
                <Icon className={cn("shrink-0 text-white/70", isExpanded ? "h-3.5 w-3.5" : "h-4 w-4")} />
                {isExpanded && (
                    <span className="text-[10px] font-medium text-white/60 tracking-wide truncate">
                        {getPlanDisplayName(currentPlan.name)}
                    </span>
                )}
            </div>
        </Link>
    );
}


