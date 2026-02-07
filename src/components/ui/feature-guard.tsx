"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

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
    t: any;
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
                    <div
                        className="h-8 w-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--plan-pro) 20%, transparent)' }}
                    >
                        <Lock className="h-4 w-4" style={{ color: 'var(--plan-pro)' }} />
                    </div>
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
                        "mt-1 w-full inline-flex items-center justify-center",
                        "text-xs font-medium py-1.5 px-3 rounded-md",
                        "bg-[var(--plan-pro)] text-white hover:opacity-90 transition-opacity"
                    )}
                >
                    {t('upgrade', { plan: requiredPlan })}
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
                <Badge
                    variant="secondary"
                    className={cn(
                        "h-5 px-1.5 text-[10px] font-semibold",
                        "bg-[var(--plan-pro)] text-white border-0",
                        "flex items-center gap-0.5 cursor-help",
                        "hover:scale-105 transition-transform"
                    )}
                >
                    <Lock className="h-2.5 w-2.5" />
                    {requiredPlan}
                </Badge>
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
 * - Shows a lock badge overlay
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

    // Disabled content wrapper
    const disabledContent = (
        <div className="relative w-full cursor-not-allowed group">
            {/* Disabled children */}
            <div className="pointer-events-none opacity-50 select-none w-full">
                {children}
            </div>

            {/* Lock badge overlay */}
            {showBadge && (
                <Badge
                    variant="secondary"
                    className={cn(
                        "absolute -top-1.5 -right-1.5 h-5 px-1.5 text-[10px] font-semibold",
                        "bg-[var(--plan-pro)] text-white border-0",
                        "flex items-center gap-0.5 shadow-lg",
                        "group-hover:scale-110 transition-transform"
                    )}
                >
                    <Lock className="h-2.5 w-2.5" />
                    {requiredPlan}
                </Badge>
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


