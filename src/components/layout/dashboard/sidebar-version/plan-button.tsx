"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/stores/organization-store";
import { Crown, Sparkles, Users } from "lucide-react";
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
    if (lower.includes("team")) {
        return {
            icon: Users,
            iconColor: "text-purple-500",
            hoverBg: "hover:bg-purple-500/20",
        };
    }
    if (lower.includes("pro")) {
        return {
            icon: Crown,
            iconColor: "text-indigo-500",
            hoverBg: "hover:bg-indigo-500/20",
        };
    }
    // Free / Default
    return {
        icon: Sparkles,
        iconColor: "text-lime-500",
        hoverBg: "hover:bg-lime-500/20",
    };
};

export function SidebarPlanButton({ isExpanded = false }: SidebarPlanButtonProps) {
    const { activeOrgId, isFounder } = useOrganization();
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
    }, [activeOrgId, isFounder]); // Re-fetch when founder status changes (after payment)

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

    // Content - icon glows for founders
    const content = (
        <div
            className={cn(
                "group relative flex items-center w-full rounded-lg transition-colors duration-0",
                "text-muted-foreground hover:text-foreground",
                "p-0 min-h-[32px]",
                styles.hoverBg
            )}
        >
            {/* Icon */}
            <div className={cn(
                "w-8 h-8 flex items-center justify-center shrink-0",
                styles.iconColor
            )}>
                <Icon className="h-4 w-4 transition-all" />
            </div>

            {/* Label */}
            <span className={cn(
                "text-[13px] font-medium truncate transition-opacity duration-200 ease-in-out text-left",
                isExpanded ? "flex-1 opacity-100 ml-2" : "w-0 opacity-0 ml-0",
                styles.iconColor
            )}>
                {getPlanDisplayName(currentPlan.name)}
            </span>
        </div>
    );

    return (
        <Link href="/pricing" className="w-full block">
            {content}
        </Link>
    );
}


