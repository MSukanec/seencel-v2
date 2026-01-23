import { cn } from "@/lib/utils";
import React from "react";

interface SplitEditorLayoutProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
    sidebarPosition?: "left" | "right";
    className?: string;
}

export function SplitEditorLayout({
    children,
    sidebar,
    sidebarPosition = "right",
    className
}: SplitEditorLayoutProps) {
    return (
        <div className={cn("flex h-full w-full", className)}>
            {sidebarPosition === "left" && (
                <div className="w-[350px] flex-none border-r bg-card h-full overflow-hidden flex flex-col z-10 shadow-lg">
                    {sidebar}
                </div>
            )}

            <div className="flex-1 min-w-0 h-full relative overflow-hidden">
                {children}
            </div>

            {sidebarPosition === "right" && (
                <div className="w-[350px] flex-none border-l bg-card h-full overflow-hidden flex flex-col z-10 shadow-lg">
                    {sidebar}
                </div>
            )}
        </div>
    );
}

interface SplitEditorSidebarProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export function SplitEditorSidebar({ children, header, footer, className }: SplitEditorSidebarProps) {
    return (
        <div className={cn("flex flex-col h-full", className)}>
            {header && <div className="flex-none p-4">{header}</div>}
            <div className="flex-1 overflow-y-auto px-4">
                {children}
            </div>
            {footer && <div className="flex-none p-4 border-t">{footer}</div>}
        </div>
    );
}

export function SplitEditorPreview({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("h-full w-full flex items-center justify-center bg-muted/20 p-8 overflow-hidden relative", className)}>
            {children}
        </div>
    );
}
