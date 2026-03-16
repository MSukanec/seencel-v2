/**
 * ChipRow — Container for chips in forms
 *
 * Renders chips in a horizontal flex-wrap layout.
 * Inspired by Linear's metadata row in creation modals.
 */

"use client";

import { cn } from "@/lib/utils";

export interface ChipRowProps {
    children: React.ReactNode;
    className?: string;
}

export function ChipRow({ children, className }: ChipRowProps) {
    return (
        <div className={cn("flex flex-wrap items-center gap-1.5 pb-4 border-b border-border/30", className)}>
            {children}
        </div>
    );
}
