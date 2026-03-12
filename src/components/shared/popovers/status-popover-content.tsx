/**
 * StatusPopoverContent — Shared Command content for status selection
 *
 * Used by: status-chip (forms), status-column (tables)
 * Single source of truth for the status selector UI.
 */

"use client";

import * as React from "react";
import { Check, CheckCircle2, Clock, XCircle, Circle } from "lucide-react";
import {
    Command,
    CommandInput,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export type StatusVariant = "positive" | "negative" | "warning" | "neutral";

export interface StatusPopoverOption {
    value: string;
    label: string;
    variant: StatusVariant;
}

export interface StatusPopoverContentProps {
    options: StatusPopoverOption[];
    currentValue: string;
    onSelect: (value: string) => void;
    placeholder?: string;
}

// ─── Variant config ──────────────────────────────────────

const VARIANT_CONFIG: Record<StatusVariant, { icon: React.ElementType; className: string }> = {
    positive: { icon: CheckCircle2, className: "text-amount-positive" },
    negative: { icon: XCircle, className: "text-amount-negative" },
    warning: { icon: Clock, className: "text-semantic-warning" },
    neutral: { icon: Circle, className: "text-muted-foreground" },
};

export function StatusDot({ variant }: { variant: StatusVariant }) {
    const { icon: Icon, className } = VARIANT_CONFIG[variant];
    return <Icon className={cn("h-3.5 w-3.5", className)} />;
}

// ─── Component ───────────────────────────────────────────

export function StatusPopoverContent({
    options,
    currentValue,
    onSelect,
    placeholder = "Cambiar estado...",
}: StatusPopoverContentProps) {
    return (
        <Command>
            <CommandInput placeholder={placeholder} className="h-8 text-xs" />
            <CommandList>
                <CommandGroup>
                    {options.map((option) => (
                        <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => onSelect(option.value)}
                            className="flex items-center gap-2 text-xs"
                        >
                            <StatusDot variant={option.variant} />
                            <span className="flex-1">{option.label}</span>
                            {currentValue === option.value && (
                                <Check className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
