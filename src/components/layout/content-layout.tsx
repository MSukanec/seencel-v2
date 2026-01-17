"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

interface ContentLayoutProps {
    /** Layout variant */
    variant: 'wide' | 'full' | 'narrow' | 'settings'
    /** Content */
    children: React.ReactNode
    /** Additional className */
    className?: string
}

const variantStyles = {
    /** Wide: padding on sides, scrollable - for tables, lists */
    wide: "px-6 md:px-8 pt-6 pb-20 overflow-y-auto h-full",
    /** Full: no padding, 100% height, no scroll - for canvas/maps */
    full: "h-full overflow-hidden",
}

export function ContentLayout({
    variant,
    children,
    className
}: ContentLayoutProps) {
    if (variant === 'narrow') {
        return (
            <div className={cn("h-full w-full overflow-y-auto bg-transparent", className)}>
                <div className="mx-auto max-w-4xl px-6 pt-8 pb-20 md:px-8">
                    {children}
                </div>
            </div>
        )
    }

    if (variant === 'settings') {
        return (
            <div className={cn("h-full w-full overflow-y-auto bg-transparent", className)}>
                <div className="mx-auto max-w-5xl px-6 pt-8 pb-20 md:px-8">
                    {children}
                </div>
            </div>
        )
    }

    if (variant === 'wide') {
        return (
            <div className={cn("h-full w-full overflow-y-auto bg-transparent", className)}>
                <div className="w-full px-6 pt-6 pb-20 md:px-8">
                    {children}
                </div>
            </div>
        )
    }

    // Fallback for 'full' or others
    return (
        <div className={cn(variantStyles[variant], className)}>
            {children}
        </div>
    )
}
