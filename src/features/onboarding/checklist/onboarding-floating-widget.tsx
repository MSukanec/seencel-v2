"use client";

import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "./types";
import { OnboardingStep } from "./onboarding-step";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Rocket, X, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useTransition } from "react";
import { dismissOnboardingChecklist } from "../actions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingProgress } from "./use-onboarding-progress";

/**
 * Floating Onboarding Widget
 * Positioned at bottom-right corner, above Sonner toasts
 */
export function OnboardingFloatingWidget() {
    const { checklist, completed, total, isLoading, isAllCompleted } = useOnboardingProgress();
    const [isExpanded, setIsExpanded] = useState(false);
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
        <div className="contents">
            {/* Floating Button - Fixed position */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "fixed bottom-20 right-4 z-50",
                    "flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    isExpanded && "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
            >
                <Rocket className="h-4 w-4" />
                <span className="text-sm font-medium">
                    {completed}/{total}
                </span>
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                ) : (
                    <ChevronUp className="h-4 w-4" />
                )}
            </motion.button>

            {/* Expanded Panel - Positioned above the button */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-32 right-4 z-50 w-72 bg-card border rounded-xl shadow-lg overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Rocket className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Primeros Pasos</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {completed}/{total} completados
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsExpanded(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Progress */}
                        <div className="px-4 py-2">
                            <Progress value={progressPercent} className="h-1.5" />
                        </div>

                        {/* Steps */}
                        <div className="px-4 pb-4 space-y-1 max-h-64 overflow-y-auto">
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
                                Omitir tutorial
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

