"use client";

import { CardBase } from "./card-base";

// ============================================================================
// INFO CARD — Simple contextual data (non-numeric)
// ============================================================================
// Usage: Exchange rates, status indicators, configuration display, countdowns
// ============================================================================

interface InfoCardProps {
    title: string;
    icon?: React.ReactNode;
    iconClassName?: string;
    children: React.ReactNode;
    className?: string;
    /** If true, card won't stretch to fill grid height */
    compact?: boolean;
}

export function InfoCard({
    title,
    icon,
    iconClassName,
    children,
    className,
    compact = true,
}: InfoCardProps) {
    return (
        <CardBase compact={compact} className={className}>
            <CardBase.Header title={title} icon={icon} iconClassName={iconClassName} />
            <CardBase.Body>{children}</CardBase.Body>
        </CardBase>
    );
}
