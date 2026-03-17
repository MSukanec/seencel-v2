"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * DetailContentTabs — Tab bar that portals into the page header center slot.
 * 
 * Uses Card variant="inset" (same as ToolbarCard) for the recessed/carved surface.
 * Tab triggers get the cincel-island aesthetic via CSS (.detail-content-tabs).
 * Portals into #page-header-tabs (center of header row).
 * 
 * Usage:
 * ```tsx
 * <DetailContentTabs>
 *   <TabsList>
 *     <TabsTrigger value="general">Perfil</TabsTrigger>
 *     <TabsTrigger value="location">Ubicación</TabsTrigger>
 *   </TabsList>
 * </DetailContentTabs>
 * ```
 */
export function DetailContentTabs({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const portalRoot = document.getElementById("page-header-tabs");

    const content = (
        <Card
            variant="inset"
            className={cn(
                "detail-content-tabs toolbar-inset flex items-center gap-1",
                // Override TabsList defaults — transparent, no bg
                "[&_[role=tablist]]:bg-transparent [&_[role=tablist]]:border-none [&_[role=tablist]]:shadow-none",
                "[&_[role=tablist]]:p-0 [&_[role=tablist]]:gap-1",
                "[&_[role=tablist]]:h-auto [&_[role=tablist]]:items-center",
                "[&_[role=tablist]]:rounded-none",
                // TabTrigger - Base: reset shadcn defaults, let CSS handle cincel
                "[&_[role=tab]]:relative [&_[role=tab]]:h-auto",
                "[&_[role=tab]]:px-3 [&_[role=tab]]:py-1.5 [&_[role=tab]]:text-xs [&_[role=tab]]:font-medium",
                "[&_[role=tab]]:text-muted-foreground",
                "[&_[role=tab]]:cursor-pointer [&_[role=tab]]:transition-all [&_[role=tab]]:duration-150",
                className,
            )}
        >
            {children}
        </Card>
    );

    if (!portalRoot) {
        // Fallback: render inline if portal target not found
        return <div className="flex justify-center py-3 px-4">{content}</div>;
    }

    return createPortal(content, portalRoot);
}
