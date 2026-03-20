/**
 * SeverityPopoverContent — Shared Command content for severity selection
 *
 * Used by: severity-chip (forms), severity-column (tables)
 * Single source of truth for the severity selector UI.
 */

"use client";

import * as React from "react";
import { Check, ShieldAlert, ShieldCheck, Shield, ShieldOff, ShieldBan } from "lucide-react";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

/** Matches DB enum site_log_severity + "none" for nullable cases */
export type SeverityLevel = "none" | "low" | "medium" | "high" | "critical";

export interface SeverityOption {
    value: string;
    label: string;
}

export interface SeverityPopoverContentProps {
    options: SeverityOption[];
    currentValue: string;
    onSelect: (value: string) => void;
}

// ─── Severity Visual Config ──────────────────────────────

export const SEVERITY_VISUAL_CONFIG: Record<SeverityLevel, {
    icon: React.ElementType;
    dotClass: string;
    labelClass: string;
    bgClass: string;
}> = {
    none: {
        icon: ShieldOff,
        dotClass: "bg-muted-foreground/40",
        labelClass: "text-muted-foreground",
        bgClass: "bg-muted/50",
    },
    low: {
        icon: ShieldCheck,
        dotClass: "bg-emerald-500",
        labelClass: "text-emerald-500",
        bgClass: "bg-emerald-500/10",
    },
    medium: {
        icon: Shield,
        dotClass: "bg-amber-500",
        labelClass: "text-amber-500",
        bgClass: "bg-amber-500/10",
    },
    high: {
        icon: ShieldAlert,
        dotClass: "bg-red-500",
        labelClass: "text-red-500",
        bgClass: "bg-red-500/10",
    },
    critical: {
        icon: ShieldBan,
        dotClass: "bg-purple-500",
        labelClass: "text-purple-500",
        bgClass: "bg-purple-500/10",
    },
};

// ─── Default Options ─────────────────────────────────────

export const DEFAULT_SEVERITY_OPTIONS: SeverityOption[] = [
    { value: "none", label: "Sin severidad" },
    { value: "low", label: "Baja" },
    { value: "medium", label: "Media" },
    { value: "high", label: "Alta" },
    { value: "critical", label: "Crítica" },
];

// ─── SeverityDot ─────────────────────────────────────────

export function SeverityDot({ level, className }: { level: SeverityLevel | string; className?: string }) {
    const config = SEVERITY_VISUAL_CONFIG[level as SeverityLevel];
    if (!config) return <div className={cn("h-2 w-2 rounded-full bg-muted-foreground/50", className)} />;
    return <div className={cn("h-2 w-2 rounded-full", config.dotClass, className)} />;
}

// ─── SeverityBadge ───────────────────────────────────────

export function SeverityBadge({ level, label, className }: { level: SeverityLevel | string; label?: string; className?: string }) {
    const config = SEVERITY_VISUAL_CONFIG[level as SeverityLevel];
    if (!config) return <span className="text-xs text-muted-foreground">{label || level}</span>;
    const Icon = config.icon;
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
            config.bgClass, config.labelClass,
            className
        )}>
            <Icon className="h-3 w-3" />
            {label || level}
        </span>
    );
}

// ─── Component ───────────────────────────────────────────

export function SeverityPopoverContent({
    options = DEFAULT_SEVERITY_OPTIONS,
    currentValue,
    onSelect,
}: SeverityPopoverContentProps) {
    return (
        <Command>
            <CommandList>
                <CommandGroup>
                    {options.map((option) => {
                        const config = SEVERITY_VISUAL_CONFIG[option.value as SeverityLevel];
                        const Icon = config?.icon || Shield;
                        return (
                            <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => onSelect(option.value)}
                                className="flex items-center gap-2 text-xs"
                            >
                                <Icon className={cn("h-3.5 w-3.5", config?.labelClass || "text-muted-foreground")} />
                                <span className="flex-1">{option.label}</span>
                                {currentValue === option.value && (
                                    <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                            </CommandItem>
                        );
                    })}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
