"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Page Header Tabs Wrapper ─────────────────────────────
// Styles raw TabsList/TabTrigger children into pill/chip
// design that matches the header aesthetic.
// Usage: <PageHeaderTabs>{tabs}</PageHeaderTabs>

interface PageHeaderTabsProps {
    children: React.ReactNode;
    className?: string;
}

export function PageHeaderTabs({ children, className }: PageHeaderTabsProps) {
    return (
        <div className={cn(
            "flex items-center",
            // Container pill background
            "[&_[role=tablist]]:!bg-muted/50 [&_[role=tablist]]:!backdrop-blur-sm",
            "[&_[role=tablist]]:!p-1 [&_[role=tablist]]:!gap-0.5",
            "[&_[role=tablist]]:!h-auto [&_[role=tablist]]:!items-center",
            "[&_[role=tablist]]:!rounded-full [&_[role=tablist]]:!border [&_[role=tablist]]:!border-border/30",
            // TabTrigger - Base: chip style
            "[&_[role=tab]]:!relative [&_[role=tab]]:!h-auto",
            "[&_[role=tab]]:!rounded-full",
            "[&_[role=tab]]:!bg-transparent [&_[role=tab]]:!border-none",
            "[&_[role=tab]]:!px-4 [&_[role=tab]]:!py-1.5 [&_[role=tab]]:!text-xs [&_[role=tab]]:!font-medium",
            "[&_[role=tab]]:!text-muted-foreground [&_[role=tab]]:!shadow-none",
            "[&_[role=tab]]:!cursor-pointer [&_[role=tab]]:!transition-all [&_[role=tab]]:!duration-200",
            "[&_[role=tab]:hover]:!text-foreground [&_[role=tab]:hover]:!bg-muted/80",
            // TabTrigger - Active: solid chip
            "[&_[role=tab][data-state=active]]:!text-foreground [&_[role=tab][data-state=active]]:!bg-background",
            "[&_[role=tab][data-state=active]]:!shadow-sm",
            className,
        )}>
            {children}
        </div>
    );
}
