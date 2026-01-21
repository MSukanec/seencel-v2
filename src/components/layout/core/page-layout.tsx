"use client";

import { cn } from "@/lib/utils";

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    header?: React.ReactNode;
    variant?: "standard" | "wide" | "narrow" | "full";
}

export function PageLayout({ children, header, variant = "standard", className, ...props }: PageLayoutProps) {
    const maxWidthClass = {
        standard: "max-w-6xl",        // Settings, Org Details
        wide: "max-w-[1600px]",       // Dashboards
        narrow: "max-w-4xl",          // Focused forms
        full: "max-w-none",           // Full width
    }[variant];

    return (
        <div
            className={cn(
                "w-full mx-auto animate-in fade-in-0 duration-500",
                maxWidthClass,
                className
            )}
            {...props}
        >
            {header}
            <div className={cn("space-y-6", header ? "p-8 pt-6" : "p-8")}>
                {children}
            </div>
        </div>
    );
}
