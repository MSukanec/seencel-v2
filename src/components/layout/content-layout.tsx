"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

interface ContentLayoutProps {
    /** Layout variant */
    variant: 'wide' | 'full' | 'narrow'
    /** Content */
    children: React.ReactNode
    /** Additional className */
    className?: string
}

const variantStyles = {
    /** Wide: padding on sides, scrollable - for tables, lists */
    wide: "px-6 md:px-8 py-6 overflow-y-auto h-full",
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
                <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
                    {children}
                </div>
            </div>
        )
    }

    return (
        <div className={cn(variantStyles[variant], className)}>
            {children}
        </div>
    )
}
