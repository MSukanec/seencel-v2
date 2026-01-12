"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { PageHeader, BreadcrumbItem } from "./page-header"

interface PageWrapperProps {
    /** Type of page: dashboard (no header) or page (with header) */
    type: 'dashboard' | 'page'
    /** Page title - only used when type='page' */
    title?: string
    /** Tab navigation - only used when type='page' */
    tabs?: React.ReactNode
    /** Action buttons - only used when type='page' */
    actions?: React.ReactNode
    /** Page content */
    children: React.ReactNode
    /** Additional className for the wrapper */
    className?: string
}

export function PageWrapper({
    type,
    title,
    tabs,
    actions,
    children,
    className
}: PageWrapperProps) {
    return (
        <div className={cn("flex flex-col h-full overflow-hidden", className)}>
            {/* Header - only for 'page' type */}
            {type === 'page' && title && (
                <PageHeader
                    breadcrumbs={[{ label: title }]}
                    tabs={tabs}
                    actions={actions}
                />
            )}

            {/* Content area */}
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    )
}
