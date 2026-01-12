"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { ProjectSelectorWrapper } from "@/components/layout/project-selector-wrapper";


export interface BreadcrumbItem {
    label: string
    href?: string
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Breadcrumb items - only the LAST item is displayed as page title */
    breadcrumbs: BreadcrumbItem[]
    /** Action buttons on the right */
    actions?: React.ReactNode
    /** Tab navigation below the title */
    tabs?: React.ReactNode
}

export function PageHeader({
    breadcrumbs,
    actions,
    tabs,
    className,
    children,
    ...props
}: PageHeaderProps) {
    // Only display the last item as the page title
    const titleItem = breadcrumbs[breadcrumbs.length - 1];

    return (
        <div
            className={cn(
                "sticky top-0 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border",
                className
            )}
            {...props}
        >
            <div className="px-8 pt-2 pb-0">
                <div className="flex items-center justify-between gap-4">
                    {/* Page Title */}
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {titleItem?.label}
                    </h1>

                    <div className="flex items-center gap-4">
                        <ProjectSelectorWrapper />

                        {/* Actions */}
                        {actions && (
                            <div className="flex items-center gap-2">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs - negative margin to overlap with header border */}
                {tabs && (
                    <div className="-mb-[2px] mt-2">
                        {tabs}
                    </div>
                )}

                {children}
            </div>
        </div>
    )
}
