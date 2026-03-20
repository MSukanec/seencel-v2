/**
 * VisibilityPopoverContent — Shared Command content for client visibility selection
 *
 * Used by: visibility-chip (forms), visibility-column (tables)
 * Single source of truth for the visibility selector UI.
 * Concept: "client_visibility" — whether a record is visible to external clients.
 */

"use client";

import * as React from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export type VisibilityLevel = "public" | "internal";

export interface VisibilityOption {
    value: VisibilityLevel;
    label: string;
}

export interface VisibilityPopoverContentProps {
    options?: VisibilityOption[];
    currentValue: VisibilityLevel;
    onSelect: (value: VisibilityLevel) => void;
}

// ─── Visibility Visual Config ────────────────────────────

export const VISIBILITY_VISUAL_CONFIG: Record<VisibilityLevel, {
    icon: React.ElementType;
    dotClass: string;
    labelClass: string;
}> = {
    public: {
        icon: Eye,
        dotClass: "bg-amount-positive",
        labelClass: "text-amount-positive",
    },
    internal: {
        icon: EyeOff,
        dotClass: "bg-amount-negative",
        labelClass: "text-amount-negative",
    },
};

// ─── Default Options ─────────────────────────────────────

export const DEFAULT_VISIBILITY_OPTIONS: VisibilityOption[] = [
    { value: "public", label: "Visible cliente" },
    { value: "internal", label: "Solo interno" },
];

// ─── VisibilityIcon helper ───────────────────────────────

export function VisibilityIcon({ isPublic, className }: { isPublic: boolean; className?: string }) {
    const level: VisibilityLevel = isPublic ? "public" : "internal";
    const config = VISIBILITY_VISUAL_CONFIG[level];
    const Icon = config.icon;
    return <Icon className={cn("h-3.5 w-3.5", config.labelClass, className)} />;
}

// ─── VisibilityDot ───────────────────────────────────────

export function VisibilityDot({ isPublic, className }: { isPublic: boolean; className?: string }) {
    const level: VisibilityLevel = isPublic ? "public" : "internal";
    const config = VISIBILITY_VISUAL_CONFIG[level];
    return <div className={cn("h-2 w-2 rounded-full", config.dotClass, className)} />;
}

// ─── VisibilityBadge ─────────────────────────────────────

export function VisibilityBadge({ isPublic, className }: { isPublic: boolean; className?: string }) {
    const level: VisibilityLevel = isPublic ? "public" : "internal";
    const config = VISIBILITY_VISUAL_CONFIG[level];
    const option = DEFAULT_VISIBILITY_OPTIONS.find(o => o.value === level);
    const Icon = config.icon;
    return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-[450]", className)}>
            <Icon className={cn("h-3.5 w-3.5", config.labelClass)} />
            <span className="text-foreground">{option?.label || level}</span>
        </span>
    );
}

// ─── Component ───────────────────────────────────────────

export function VisibilityPopoverContent({
    options = DEFAULT_VISIBILITY_OPTIONS,
    currentValue,
    onSelect,
}: VisibilityPopoverContentProps) {
    return (
        <Command>
            <CommandList>
                <CommandGroup>
                    {options.map((option) => {
                        const config = VISIBILITY_VISUAL_CONFIG[option.value];
                        const Icon = config.icon;
                        return (
                            <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => onSelect(option.value)}
                                className="flex items-center gap-2 text-xs"
                            >
                                <VisibilityDot isPublic={option.value === "public"} />
                                <Icon className={cn("h-3.5 w-3.5", config.labelClass)} />
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
