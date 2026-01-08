"use client";

import { cn } from "@/lib/utils";

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: "standard" | "wide" | "narrow" | "full";
}

export function PageLayout({ children, variant = "standard", className, ...props }: PageLayoutProps) {
    const maxWidthClass = {
        standard: "max-w-6xl",        // Settings, Org Details
        wide: "max-w-[1600px]",       // Dashboards
        narrow: "max-w-4xl",          // Focused forms
        full: "max-w-none",           // Full width
    }[variant];

    return (
        <div
            className={cn(
                "w-full mx-auto p-8 space-y-6 animate-in fade-in-0 duration-500",
                maxWidthClass,
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
