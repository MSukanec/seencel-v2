"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SplitEditorLayoutProps {
    children: ReactNode; // The main preview area
    sidebar: ReactNode; // The configuration panel
    sidebarPosition?: 'left' | 'right';
    sidebarWidth?: string; // e.g., "w-[400px]"
    className?: string;
    style?: React.CSSProperties;
}

export function SplitEditorLayout({
    children,
    sidebar,
    sidebarPosition = 'right',
    sidebarWidth = "w-[400px] md:w-[450px]",
    className,
    style
}: SplitEditorLayoutProps) {
    return (
        <div className={cn("flex-1 flex overflow-hidden h-full min-h-[600px]", className)} style={style}>
            {/* If sidebar is LEFT */}
            {sidebarPosition === 'left' && (
                <aside className={cn(
                    "flex-none border-r border-border/40 bg-background/50 backdrop-blur-3xl flex flex-col z-10 shadow-xl",
                    sidebarWidth
                )}>
                    {sidebar}
                </aside>
            )}

            {/* Main Content (Preview) */}
            <main className="flex-1 relative bg-[#e5e5e5] dark:bg-[#121212] overflow-hidden flex flex-col">
                {children}
            </main>

            {/* If sidebar is RIGHT */}
            {sidebarPosition === 'right' && (
                <aside className={cn(
                    "flex-none border-l border-border/40 bg-background/50 backdrop-blur-3xl flex flex-col z-10 shadow-xl",
                    sidebarWidth
                )}>
                    {sidebar}
                </aside>
            )}
        </div>
    );
}

// Subcomponent for the Sidebar content to ensure standard padding/scrolling
export function SplitEditorSidebar({ children, header }: { children: ReactNode, header?: ReactNode }) {
    return (
        <>
            {/* Optional Header Area for Tabs or Title */}
            {header && (
                <div className="flex-none px-6 pt-6 pb-2">
                    {header}
                </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-6 space-y-8">
                    {children}
                </div>
            </div>
        </>
    );
}

// Subcomponent for Preview Area centering
export function SplitEditorPreview({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={cn("flex-1 w-full h-full flex items-center justify-center p-8 overflow-hidden", className)}>
            {children}
        </div>
    );
}
