"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * DetailContentTabs — Tab bar that portals into the page header center slot.
 * 
 * Re-designed as a seamless cutout/notch extending from the outer shell
 * into the main content area with organic inverted corners.
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            {/* Drop shadow wrapper tracing the full notch contour.
                Matches the <main> shell inset shadows: 
                drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 1px 1px rgba(0,0,0,0.2)) 
            */}
            <div 
                className="flex items-start pointer-events-auto shadow-tabs"
                style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3)) drop-shadow(0px 1px 1px rgba(0,0,0,0.2))" }}
            >
                {/* Left inverted corner */}
                <div 
                    className="w-3 h-3 relative"
                    style={{
                        background: 'radial-gradient(circle at 0% 100%, transparent 11.5px, var(--shell) 12px)'
                    }}
                />
                
                {/* Notch Body */}
                <div className="bg-shell px-2 pb-1.5 pt-1 rounded-b-xl flex items-center justify-center -mx-[0.5px]">
                    <div className={cn(
                        "detail-content-tabs toolbar-inset flex items-center gap-1",
                        // Base TabList resets
                        "[&_[role=tablist]]:bg-transparent [&_[role=tablist]]:border-none [&_[role=tablist]]:shadow-none",
                        "[&_[role=tablist]]:p-0 [&_[role=tablist]]:gap-1",
                        "[&_[role=tablist]]:h-auto [&_[role=tablist]]:items-center",
                        "[&_[role=tablist]]:rounded-none",
                        // TabTrigger overrides
                        "[&_[role=tab]]:relative [&_[role=tab]]:h-auto",
                        "[&_[role=tab]]:px-3 [&_[role=tab]]:py-1.5 [&_[role=tab]]:text-[13px] [&_[role=tab]]:font-medium",
                        "[&_[role=tab]]:text-muted-foreground",
                        "[&_[role=tab]]:cursor-pointer [&_[role=tab]]:transition-all [&_[role=tab]]:duration-150",
                        className,
                    )}>
                        {children}
                    </div>
                </div>
                
                {/* Right inverted corner */}
                <div 
                    className="w-3 h-3 relative"
                    style={{
                        background: 'radial-gradient(circle at 100% 100%, transparent 11.5px, var(--shell) 12px)'
                    }}
                />
            </div>
        </div>
    );

    if (!portalRoot) {
        // Fallback: render inline if portal target not found
        return <div className="flex justify-center w-full relative h-[40px]">{content}</div>;
    }

    return createPortal(content, portalRoot);
}
