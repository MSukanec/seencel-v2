"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Sparkles, Users, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlans, getCurrentOrganizationPlanId, Plan } from "@/actions/plans";
import { getPlanDisplayName } from "@/lib/plan-utils";
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

    // Helper to get matching styles
    const getPlanStyle = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("enterprise") || lower.includes("empresa")) {
            return {
                icon: Building2,
                gradient: "from-zinc-700 to-zinc-800",
                bg: "bg-zinc-100 dark:bg-zinc-800/50",
                text: "text-zinc-700 dark:text-zinc-300",
                border: "border-zinc-400 dark:border-zinc-600",
            };
        }
        if (lower.includes("team")) {
            return {
                icon: Users,
                gradient: "from-slate-500 to-slate-600",
                bg: "bg-slate-100 dark:bg-slate-900/30",
                text: "text-slate-600 dark:text-slate-400",
                border: "border-slate-300 dark:border-slate-700",
            };
        }
        if (lower.includes("pro")) {
            return {
                icon: Zap,
                gradient: "from-stone-500 to-stone-600",
                bg: "bg-stone-100 dark:bg-stone-900/30",
                text: "text-stone-600 dark:text-stone-400",
                border: "border-stone-300 dark:border-stone-700",
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
        <Link href="/pricing">
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
                <span>{getPlanDisplayName(currentPlan.name)}</span>
            </Button>
        </Link>
    );
}

