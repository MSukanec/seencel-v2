"use client";

import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "./types";
import { OnboardingStep } from "./onboarding-step";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Rocket, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useTransition } from "react";
import { dismissOnboardingChecklist } from "../actions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingProgress } from "./use-onboarding-progress";

interface OnboardingChecklistProps {
    className?: string;
}

export function OnboardingChecklistWidget({ className }: OnboardingChecklistProps) {
    const { checklist, completed, total, isLoading, isAllCompleted } = useOnboardingProgress();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isPending, startTransition] = useTransition();

    const progressPercent = (completed / total) * 100;

    // Don't render while loading or if all completed
    if (isLoading || isAllCompleted) {
        return null;
    }

    const handleDismiss = () => {
        startTransition(async () => {
            const result = await dismissOnboardingChecklist();
            if (result.success) {
                toast.success("¡Tutorial omitido!");
            }
        });
    };

    return (
        <div className={cn(
            "bg-card border rounded-xl overflow-hidden",
            className
        )}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Rocket className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-sm">Primeros Pasos</h3>
                        <p className="text-xs text-muted-foreground">
                            {completed}/{total} completados
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
            </button>

            {/* Progress Bar */}
            <div className="px-4 pb-2">
                <Progress value={progressPercent} className="h-1.5" />
            </div>

            {/* Steps */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-1">
                            {ONBOARDING_STEPS.map((step) => (
                                <OnboardingStep
                                    key={step.key}
                                    step={step}
                                    isCompleted={checklist[step.key] || false}
                                />
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-4 pb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground text-xs"
                                onClick={handleDismiss}
                                disabled={isPending}
                            >
                                <X className="h-3 w-3 mr-1" />
                                Omitir tutorial
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
