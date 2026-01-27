"use client";

import { cn } from "@/lib/utils";
import type { BlockConfig } from "../../views/reports-builder-view";

interface KpiBlockProps {
    config: BlockConfig;
}

export function KpiBlock({ config }: KpiBlockProps) {
    const { title, value, subtitle, trend } = config;

    return (
        <div className="text-center py-4">
            {title && (
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                    {title}
                </p>
            )}
            <p className="text-4xl font-bold font-mono">
                {value || "—"}
            </p>
            {subtitle && (
                <p className="text-sm text-muted-foreground mt-2">
                    {subtitle}
                </p>
            )}
            {trend && (
                <div className={cn(
                    "inline-flex items-center gap-1 mt-2 text-sm font-medium px-2 py-0.5 rounded-full",
                    trend.direction === "up" && "text-green-600 bg-green-100",
                    trend.direction === "down" && "text-red-600 bg-red-100",
                    trend.direction === "neutral" && "text-gray-600 bg-gray-100",
                )}>
                    {trend.direction === "up" && "↑"}
                    {trend.direction === "down" && "↓"}
                    {trend.direction === "neutral" && "→"}
                    {trend.value}%
                </div>
            )}
        </div>
    );
}
