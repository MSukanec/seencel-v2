"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Users, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlans, getCurrentOrganizationPlanId, Plan } from "@/actions/plans";
import { Skeleton } from "@/components/ui/skeleton";

export function PlanStatusButton() {
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPlanData() {
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
                    // Fallback to Free/Sparkles if no plan (or assume first one is free default)
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
    }, []);

    // Helper to get matching styles (copied from PlansComparison for consistency)
    const getPlanStyle = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("team")) {
            return {
                icon: Users,
                gradient: "from-purple-500 to-violet-600",
                bg: "bg-purple-100 dark:bg-purple-900/30",
                text: "text-purple-600 dark:text-purple-400",
                border: "border-purple-200 dark:border-purple-800",
            };
        }
        if (lower.includes("pro")) {
            return {
                icon: Crown,
                gradient: "from-indigo-500 to-blue-600",
                bg: "bg-indigo-100 dark:bg-indigo-900/30",
                text: "text-indigo-600 dark:text-indigo-400",
                border: "border-indigo-200 dark:border-indigo-800",
            };
        }
        // Free / Default
        return {
            icon: Sparkles,
            gradient: "from-lime-500 to-green-500",
            bg: "bg-lime-100 dark:bg-lime-900/30",
            text: "text-lime-600 dark:text-lime-400",
            border: "border-lime-200 dark:border-lime-800",
        };
    };

    if (loading) {
        return <Skeleton className="h-9 w-24 rounded-full" />;
    }

    if (!currentPlan) return null;

    const styles = getPlanStyle(currentPlan.name);
    const Icon = styles.icon;

    return (
        <Link href="/organization/billing/plans">
            <Button
                variant="outline"
                size="sm"
                className={cn(
                    "relative h-8 gap-2 px-3 pl-2.5 font-medium border transition-all text-xs",
                    styles.bg,
                    styles.text,
                    styles.border,
                    "hover:bg-opacity-80 hover:brightness-95"
                )}
            >
                <Icon className="h-3.5 w-3.5" />
                <span>{currentPlan.name}</span>
            </Button>
        </Link>
    );
}

