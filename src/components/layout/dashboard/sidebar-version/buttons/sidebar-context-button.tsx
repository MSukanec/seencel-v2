"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { SidebarExpandableButtonBase } from "./sidebar-expandable-button-base";

// ============================================================================
// CONTEXT BUTTON
// ============================================================================
// Used for navigation contexts (Dashboard, Academia, Comunidad, Admin)
// Shows: Icon + Title + Description + Chevron
// ============================================================================

interface SidebarContextButtonProps {
    icon: React.ElementType;
    label: string;
    description: string;
    isExpanded?: boolean;
    onClick?: () => void;
    className?: string;
}

export function SidebarContextButton({
    icon: Icon,
    label,
    description,
    isExpanded = false,
    onClick,
    className,
    badge,
    isLocked
}: SidebarContextButtonProps & { badge?: React.ReactNode; isLocked?: boolean }) {
    return (
        <SidebarExpandableButtonBase
            isExpanded={isExpanded}
            onClick={onClick}
            className={className}
            height="lg"
            leftContent={<Icon className="h-5 w-5" />}
            title={label}
            subtitle={description}
            badge={badge}
            rightContent={<ChevronRight className="h-4 w-4" />}
            isLocked={isLocked}
        />
    );
}

