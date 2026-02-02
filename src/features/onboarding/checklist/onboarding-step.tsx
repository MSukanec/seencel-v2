"use client";

import { cn } from "@/lib/utils";
import { OnboardingStep as StepType } from "./types";
import { Check, ChevronRight, User, Building, Users, CreditCard, LayoutDashboard } from "lucide-react";
import { Link } from "@/i18n/routing";

const iconMap = {
    User,
    Building,
    Users,
    CreditCard,
    LayoutDashboard,
};

interface OnboardingStepProps {
    step: StepType;
    isCompleted: boolean;
}

export function OnboardingStep({ step, isCompleted }: OnboardingStepProps) {
    const Icon = iconMap[step.icon as keyof typeof iconMap] || User;

    return (
        <Link
            href={step.href as any}
            className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors group",
                isCompleted
                    ? "bg-muted/30 cursor-default"
                    : "hover:bg-muted/50 cursor-pointer"
            )}
        >
            {/* Status Icon */}
            <div
                className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    isCompleted
                        ? "bg-emerald-500/20 text-emerald-600"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}
            >
                {isCompleted ? (
                    <Check className="h-4 w-4" />
                ) : (
                    <Icon className="h-4 w-4" />
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        "text-sm font-medium truncate",
                        isCompleted && "text-muted-foreground line-through"
                    )}
                >
                    {step.title}
                </p>
            </div>

            {/* Arrow */}
            {!isCompleted && (
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </Link>
    );
}
