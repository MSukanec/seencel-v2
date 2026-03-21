"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Page Header Tabs Wrapper ─────────────────────────────
// Provides cincel-island styling for tabs rendered inside the
// header notch or left zone.

interface PageHeaderTabsProps {
    children: React.ReactNode;
    className?: string;
}

export function PageHeaderTabs({ children, className }: PageHeaderTabsProps) {
    return (
        <div className={cn(
            "flex items-center gap-1",
            // TabsList container: transparent, flex row
            "[&_[role=tablist]]:!bg-transparent [&_[role=tablist]]:!flex [&_[role=tablist]]:!items-center",
            "[&_[role=tablist]]:!p-0 [&_[role=tablist]]:!gap-1",
            "[&_[role=tablist]]:!h-auto [&_[role=tablist]]:!border-none [&_[role=tablist]]:!shadow-none",
            // Tab — Base: cincel-island raised button
            "[&_[role=tab]]:!relative [&_[role=tab]]:!flex [&_[role=tab]]:!items-center",
            "[&_[role=tab]]:!h-auto [&_[role=tab]]:!rounded-lg",
            "[&_[role=tab]]:!px-3 [&_[role=tab]]:!py-1.5 [&_[role=tab]]:!text-xs [&_[role=tab]]:!font-medium",
            "[&_[role=tab]]:!cursor-pointer [&_[role=tab]]:!transition-all [&_[role=tab]]:!duration-150",
            // Tab — Inactive: transparent, subtle hover
            "[&_[role=tab][data-state=inactive]]:!bg-transparent [&_[role=tab][data-state=inactive]]:!text-muted-foreground",
            "[&_[role=tab][data-state=inactive]]:!border-transparent [&_[role=tab][data-state=inactive]]:!shadow-none",
            "[&_[role=tab][data-state=inactive]:hover]:!bg-muted/50 [&_[role=tab][data-state=inactive]:hover]:!text-foreground",
            // Tab — Active: cincel-island raised (matches .cincel-island in globals.css)
            "[&_[role=tab][data-state=active]]:!text-foreground",
            "[&_[role=tab][data-state=active]]:!bg-background",
            "[&_[role=tab][data-state=active]]:!border [&_[role=tab][data-state=active]]:!border-white/[0.06]",
            "[&_[role=tab][data-state=active]]:!shadow-[0_1px_3px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)]",
            className,
        )}>
            {children}
        </div>
    );
}
