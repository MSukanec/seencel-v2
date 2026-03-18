"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Lock, Wrench } from "lucide-react";
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
    /** Mode: 'plan' (default) for plan-based locks, 'maintenance' for maintenance locks */
    mode?: 'plan' | 'maintenance';
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

function MaintenancePopoverContent({
    featureName,
    customMessage,
}: {
    featureName: string;
    customMessage?: string;
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
                    <div className="h-7 w-7 rounded-full bg-semantic-warning/10 flex items-center justify-center shrink-0">
                        <Wrench className="h-3.5 w-3.5 text-semantic-warning" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold leading-tight">
                            En Mantenimiento
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            Temporalmente no disponible
                        </p>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {customMessage || `${featureName} se encuentra temporalmente en mantenimiento. Volvé a intentar más tarde.`}
                </p>
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
 * A reusable wrapper component that gates features based on plan capabilities or maintenance mode.
 * 
 * Modes:
 * - 'plan' (default): Shows PRO badge, upgrade link, plan-based messaging
 * - 'maintenance': Shows wrench icon, no plan badge, no upgrade link
 * 
 * When the feature is disabled:
 * - Renders the children as disabled (pointer-events-none, opacity reduced)
 * - Shows a badge overlay (plan badge or lock icon depending on mode)
 * - On hover, shows a popover explaining the restriction
 */
export function FeatureGuard({
    isEnabled,
    featureName,
    requiredPlan = "PRO",
    children,
    customMessage,
    showBadge = true,
    showPopover = true,
    upgradeHref = "/pricing",
    mode = "plan",
}: FeatureGuardProps) {
    const t = useTranslations('Portal.FeatureGuard');

    if (isEnabled) {
        // Feature is enabled, render children normally
        return <>{children}</>;
    }

    const isMaintenance = mode === 'maintenance';

    // Disabled content wrapper — w-fit so badge hugs the button
    const disabledContent = (
        <div className="relative w-fit cursor-not-allowed group">
            {/* Disabled children */}
            <div className="pointer-events-none opacity-50 select-none">
                {children}
            </div>

            {/* Lock badge overlay */}
            {showBadge && (
                <div className="absolute -top-2 -right-1 group-hover:scale-110 transition-transform">
                    {isMaintenance ? (
                        <div className="h-5 w-5 rounded-full bg-semantic-warning/20 border border-semantic-warning/30 flex items-center justify-center">
                            <Wrench className="h-2.5 w-2.5 text-semantic-warning" />
                        </div>
                    ) : (
                        <PlanBadge
                            planSlug={requiredPlan}
                            micro
                            linkToPricing={false}
                        />
                    )}
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
            {isMaintenance ? (
                <MaintenancePopoverContent
                    featureName={featureName}
                    customMessage={customMessage}
                />
            ) : (
                <LockPopoverContent
                    featureName={featureName}
                    requiredPlan={requiredPlan}
                    customMessage={customMessage}
                    upgradeHref={upgradeHref}
                    t={t}
                />
            )}
        </HoverCard>
    );
}

