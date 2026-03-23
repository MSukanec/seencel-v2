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
import { useEntitlements, type EntitlementKey } from "@/hooks/use-entitlements";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface FeatureGuardProps {
    /** The entitlement key to check against the Engine */
    entitlement?: EntitlementKey;
    /** Fallback boolean if entitlement key is not provided */
    fallbackEnabled?: boolean;
    /** The name of the feature (for the popover message) */
    featureName?: string;
    /** The plan required to unlock this feature (defaults to PRO or what entitlement returns) */
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
    /** Mode: override semantic mode manually */
    mode?: 'plan' | 'maintenance' | 'founders';
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
    entitlement,
    featureName,
    requiredPlan,
    customMessage,
    upgradeHref = "/pricing",
    mode
}: {
    entitlement?: EntitlementKey;
    featureName: string;
    requiredPlan?: string;
    customMessage?: string;
    upgradeHref?: string;
    mode?: 'plan' | 'maintenance' | 'founders';
}) {
    const t = useTranslations('Portal.FeatureGuard');
    const { check } = useEntitlements();

    let computedRequiredPlan = requiredPlan || "PRO";
    let computedMode = mode || "plan";

    if (entitlement) {
        const result = check(entitlement);
        if (result.requiredPlan) computedRequiredPlan = result.requiredPlan;
        if (result.reason === 'maintenance') computedMode = 'maintenance';
        if (result.reason === 'founders') computedMode = 'founders';
    }

    const isMaintenance = computedMode === 'maintenance';

    return (
        <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
                <span className="cursor-help inline-flex hover:scale-105 transition-transform">
                    {isMaintenance ? (
                        <div className="h-5 w-5 rounded-full bg-semantic-warning/20 border border-semantic-warning/30 flex items-center justify-center">
                            <Wrench className="h-2.5 w-2.5 text-semantic-warning" />
                        </div>
                    ) : (
                        <PlanBadge
                            planSlug={computedRequiredPlan}
                            micro
                            linkToPricing={false}
                        />
                    )}
                </span>
            </HoverCardTrigger>
            {isMaintenance ? (
                <MaintenancePopoverContent
                    featureName={featureName}
                    customMessage={customMessage}
                />
            ) : (
                <LockPopoverContent
                    featureName={featureName}
                    requiredPlan={computedRequiredPlan}
                    customMessage={customMessage}
                    upgradeHref={upgradeHref}
                    t={t}
                />
            )}
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
    entitlement,
    fallbackEnabled,
    featureName = "Esta función",
    requiredPlan,
    children,
    customMessage,
    showBadge = true,
    showPopover = true,
    upgradeHref = "/pricing",
    mode,
}: FeatureGuardProps) {
    const t = useTranslations('Portal.FeatureGuard');
    const { check, isAdmin } = useEntitlements();

    // 1. Evaluate entitlement if provided
    let isAllowed = fallbackEnabled ?? true;
    let isShadowMode = false;
    let computedReason = null;
    let computedRequiredPlan = requiredPlan || "PRO";
    let computedMode = mode || "plan";

    if (entitlement) {
        const result = check(entitlement);
        isAllowed = result.isAllowed;
        isShadowMode = result.isShadowMode;
        computedReason = result.reason;
        if (result.requiredPlan) computedRequiredPlan = result.requiredPlan;
        
        if (result.reason === 'maintenance') computedMode = 'maintenance';
        if (result.reason === 'founders') computedMode = 'founders';
    } else if (!isAllowed && isAdmin) {
        // Fallback mode (no entitlement key): admin gets shadow bypass
        isShadowMode = true;
    }

    // 2. If allowed and not in shadow mode, render normally
    if (isAllowed && !isShadowMode) {
        return <>{children}</>;
    }

    const isMaintenance = computedMode === 'maintenance';

    const handleShadowClick = (e: React.MouseEvent) => {
        if (isShadowMode) {
            toast.warning("Modo Shadow (Admin)", {
                description: `Evadiendo bloqueo de ${computedReason}. El usuario final lo verá bloqueado.`,
                duration: 4000
            });
            // Let the click propagate to the children!
        }
    };

    // Disabled content wrapper
    const disabledContent = (
        <div 
            className="relative w-fit group" 
            onClick={isShadowMode ? handleShadowClick : undefined}
        >
            {/* The children. If shadowMode, they are clickable but look gray. If not, pointer-events-none completely blocks it. */}
            <div className={cn(
                "select-none transition-all duration-300",
                !isShadowMode ? "pointer-events-none opacity-50 grayscale" : "opacity-80 grayscale-[30%] hover:grayscale-0",
                !isShadowMode && "cursor-not-allowed"
            )}>
                {children}
            </div>

            {/* Lock badge overlay */}
            {showBadge && (
                <div className="absolute -top-2 -right-1 group-hover:scale-110 transition-transform pointer-events-none">
                    {isMaintenance ? (
                        <div className="h-5 w-5 rounded-full bg-semantic-warning/20 border border-semantic-warning/30 flex items-center justify-center">
                            <Wrench className="h-2.5 w-2.5 text-semantic-warning" />
                        </div>
                    ) : (
                        <PlanBadge
                            planSlug={computedRequiredPlan}
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
                    featureName={featureName!}
                    requiredPlan={computedRequiredPlan}
                    customMessage={customMessage}
                    upgradeHref={upgradeHref}
                    t={t}
                />
            )}
        </HoverCard>
    );
}

