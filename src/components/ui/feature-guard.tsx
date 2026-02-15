"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { PlanBadge } from "@/components/shared/plan-badge";

// ============================================================================
// Types
// ============================================================================

interface FeatureGuardProps {
    /** Whether the feature is enabled for the current plan */
    isEnabled: boolean;
    /** The name of the feature (for the popover message) */
    featureName: string;
    /** The plan required to unlock this feature */
    requiredPlan?: string;
    /** The children to render (button, link, etc.) */
    children: React.ReactNode;
    /** Optional: Custom message for the popover */
    customMessage?: string;
    /** Optional: Whether to show locked badge */
    showBadge?: boolean;
    /** Optional: Link to upgrade (uses i18n routing) */
    upgradeHref?: string;
    /** Optional: Whether to show the hover popover on the children */
    showPopover?: boolean;
}

// ============================================================================
// Internal Components
// ============================================================================

function LockPopoverContent({
    featureName,
    requiredPlan,
    customMessage,
    upgradeHref,
    t
}: {
    featureName: string;
    requiredPlan: string;
    customMessage?: string;
    upgradeHref: string;
    t: ReturnType<typeof useTranslations>;
}) {
    return (
        <HoverCardContent
            className="w-64 p-3"
            side="bottom"
            align="center"
            sideOffset={8}
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <PlanBadge
                        planSlug={requiredPlan}
                        compact
                        showIcon
                        showLabel={false}
                        linkToPricing={false}
                    />
                    <div className="flex-1">
                        <p className="text-sm font-semibold leading-tight">
                            {t('locked')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {t('availableIn', { plan: requiredPlan })}
                        </p>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {customMessage || t('description', { feature: featureName, plan: requiredPlan })}
                </p>
                <Link
                    href={upgradeHref as any}
                    className={cn(
                        "mt-1 w-full no-underline",
                    )}
                >
                    <PlanBadge
                        planSlug={requiredPlan}
                        compact
                        linkToPricing={false}
                        className="w-full justify-center"
                    />
                </Link>
            </div>
        </HoverCardContent>
    );
}

/**
 * Standalone Badge component that shows the lock popover on hover.
 */
export function FeatureLockBadge({
    featureName,
    requiredPlan = "PRO",
    customMessage,
    upgradeHref = "/pricing"
}: {
    featureName: string;
    requiredPlan?: string;
    customMessage?: string;
    upgradeHref?: string;
}) {
    const t = useTranslations('Portal.FeatureGuard');

    return (
        <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
                <span className="cursor-help inline-flex hover:scale-105 transition-transform">
                    <PlanBadge
                        planSlug={requiredPlan}
                        micro
                        linkToPricing={false}
                    />
                </span>
            </HoverCardTrigger>
            <LockPopoverContent
                featureName={featureName}
                requiredPlan={requiredPlan}
                customMessage={customMessage}
                upgradeHref={upgradeHref}
                t={t}
            />
        </HoverCard>
    );
}

/**
 * A reusable wrapper component that gates features based on plan capabilities.
 * When the feature is disabled:
 * - Renders the children as disabled (pointer-events-none, opacity reduced)
 * - Shows a lock badge overlay (uses PlanBadge micro)
 * - On hover, shows a popover explaining the restriction and prompting upgrade
 */
export function FeatureGuard({
    isEnabled,
    featureName,
    requiredPlan = "PRO",
    children,
    customMessage,
    showBadge = true,
    showPopover = true,
    upgradeHref = "/pricing"
}: FeatureGuardProps) {
    const t = useTranslations('Portal.FeatureGuard');

    if (isEnabled) {
        // Feature is enabled, render children normally
        return <>{children}</>;
    }

    // Disabled content wrapper — w-fit so badge hugs the button
    const disabledContent = (
        <div className="relative w-fit cursor-not-allowed group">
            {/* Disabled children */}
            <div className="pointer-events-none opacity-50 select-none">
                {children}
            </div>

            {/* Lock badge overlay — PlanBadge micro (material system) */}
            {showBadge && (
                <div className="absolute -top-2 -right-1 group-hover:scale-110 transition-transform">
                    <PlanBadge
                        planSlug={requiredPlan}
                        micro
                        linkToPricing={false}
                    />
                </div>
            )}
        </div>
    );

    if (!showPopover) {
        return disabledContent;
    }

    // Feature is disabled, wrap with lock UI
    return (
        <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
                {disabledContent}
            </HoverCardTrigger>
            <LockPopoverContent
                featureName={featureName}
                requiredPlan={requiredPlan}
                customMessage={customMessage}
                upgradeHref={upgradeHref}
                t={t}
            />
        </HoverCard>
    );
}
