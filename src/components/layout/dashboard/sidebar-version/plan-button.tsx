"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/context/organization-context";
import { Crown, Sparkles, Users } from "lucide-react";
import { getPlans, getCurrentOrganizationPlanId, Plan, isOrganizationFounder } from "@/actions/plans";
import { getPlanDisplayName } from "@/lib/plan-utils";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// SIDEBAR PLAN BUTTON
// ============================================================================
// Shows current plan - icon glows when org is a founder
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
    const { activeOrgId } = useOrganization();
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [isFounder, setIsFounder] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPlanData() {
            try {
                const [plans, currentPlanId, founderStatus] = await Promise.all([
                    getPlans(),
                    getCurrentOrganizationPlanId(),
                    isOrganizationFounder(),
                ]);

                setIsFounder(founderStatus);

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
    }, [activeOrgId]);

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
            {/* Icon - with glow animation for founders */}
            <div className={cn(
                "w-8 h-8 flex items-center justify-center shrink-0",
                styles.iconColor
            )}>
                <Icon className={cn(
                    "h-4 w-4 transition-all",
                    isFounder && "animate-pulse drop-shadow-[0_0_6px_rgba(234,179,8,0.8)]"
                )} />
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
        <Link href="/organization/billing/plans" className="w-full block">
            {content}
        </Link>
    );
}


