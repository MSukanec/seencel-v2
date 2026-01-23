"use client";

import { cn } from "@/lib/utils";
import { HealthStatus } from "../types";
import { LucideIcon, HeartPulse, AlertTriangle, CheckCircle, AlertOctagon, Activity } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HealthBadgeProps {
    score: number;
    status?: HealthStatus;
    showScore?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const STATUS_CONFIG: Record<HealthStatus, { color: string; icon: LucideIcon; label: string }> = {
    excellent: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle, label: "Excelente" },
    good: { color: "text-blue-500 bg-blue-500/10 border-blue-500/20", icon: Activity, label: "Bueno" },
    fair: { color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", icon: AlertTriangle, label: "Regular" },
    poor: { color: "text-orange-500 bg-orange-500/10 border-orange-500/20", icon: AlertOctagon, label: "Malo" },
    critical: { color: "text-red-500 bg-red-500/10 border-red-500/20", icon: HeartPulse, label: "Crítico" },
    unknown: { color: "text-gray-500 bg-gray-500/10 border-gray-500/20", icon: Activity, label: "Desconocido" },
};

export function HealthBadge({ score, status, showScore = true, size = "md", className }: HealthBadgeProps) {
    // Infer status if not provided (assume simple thresholds matching logic)
    const inferredStatus: HealthStatus = status ||
        (score >= 90 ? 'excellent' :
            score >= 75 ? 'good' :
                score >= 60 ? 'fair' :
                    score >= 40 ? 'poor' : 'critical');

    const config = STATUS_CONFIG[inferredStatus];
    const Icon = config.icon;

    const sizeClasses = {
        sm: "px-2 py-0.5 text-xs gap-1",
        md: "px-2.5 py-1 text-sm gap-1.5",
        lg: "px-3 py-1.5 text-base gap-2"
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "inline-flex items-center rounded-full border font-medium transition-colors cursor-help",
                        config.color,
                        sizeClasses[size],
                        className
                    )}>
                        <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
                        {showScore && <span>{Math.round(score)}/100</span>}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold">{config.label}</p>
                    <p className="text-xs text-muted-foreground">Puntaje de salud: {score}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

