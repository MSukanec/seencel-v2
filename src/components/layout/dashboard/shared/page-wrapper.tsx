"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { PageHeader, BreadcrumbItem } from "./page-header"
import { MobileHeader } from "../mobile/mobile-header"

interface PageWrapperProps {
    /** Page title */
    title?: string | React.ReactNode
    /** Tab navigation */
    tabs?: React.ReactNode
    /** Action buttons */
    actions?: React.ReactNode
    /** Page content */
    children: React.ReactNode
    /** Additional className for the wrapper */
    className?: string
    /** Current user for mobile nav context */
    user?: any
    /** Optional icon to override header icon */
    icon?: React.ReactElement
    /** Optional back button for navigation */
    backButton?: React.ReactNode
    /** Desktop toolbar - renders as second row in header */
    toolbar?: React.ReactNode
    /** @deprecated Use without type — kept temporarily for compatibility */
    type?: 'dashboard' | 'page'
}

export function PageWrapper({
    type: _type,
    title,
    tabs,
    actions,
    children,
    className,
    user,
    icon,
    backButton,
    toolbar
}: PageWrapperProps) {
    return (
        <div className={cn("flex flex-col h-full overflow-hidden", className)}>
            {/* Mobile Header: ALWAYS visible */}
            <MobileHeader
                title={title}
                icon={icon}
                tabs={tabs}
                actions={actions}
                user={user}
            />

            {/* Desktop Header */}
            {title && (
                <PageHeader
                    breadcrumbs={[{ label: title }]}
                    tabs={tabs}
                    actions={actions}
                    icon={icon}
                    backButton={backButton}
                    toolbar={toolbar}
                />
            )}

            {/* Content area - flex context for children to fill height */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {children}
            </div>
        </div>
    )
}
