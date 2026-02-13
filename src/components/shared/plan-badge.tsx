"use client";

// ============================================================================
// PLAN BADGE — Unified Component
// ============================================================================
// Single source of truth for plan display across the entire application.
// Supports two visual variants:
//   - "default": For use in pages, tables, lists (solid background)
//   - "glass": For overlay on images/maps (backdrop-blur, semi-transparent)
//
// Always links to /pricing on click.
// ============================================================================

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Sparkles, Zap, Users, Building2, Medal, type LucideIcon } from "lucide-react";

// ============================================================================
// PLAN CONFIG — Single source of truth
// ============================================================================

export interface PlanConfig {
    icon: LucideIcon;
    cssVar: string;
    labelEs: string;
    labelEn: string;
    shortLabelEs: string;
    shortLabelEn: string;
}

const PLAN_CONFIG: Record<string, PlanConfig> = {
    free: {
        icon: Sparkles,
        cssVar: "var(--plan-free)",
        labelEs: "Plan Esencial",
        labelEn: "Essential Plan",
        shortLabelEs: "Esencial",
        shortLabelEn: "Essential",
    },
    essential: {
        icon: Sparkles,
        cssVar: "var(--plan-free)",
        labelEs: "Plan Esencial",
        labelEn: "Essential Plan",
        shortLabelEs: "Esencial",
        shortLabelEn: "Essential",
    },
    pro: {
        icon: Zap,
        cssVar: "var(--plan-pro)",
        labelEs: "Plan Profesional",
        labelEn: "Professional Plan",
        shortLabelEs: "Profesional",
        shortLabelEn: "Professional",
    },
    teams: {
        icon: Users,
        cssVar: "var(--plan-teams)",
        labelEs: "Plan Equipos",
        labelEn: "Teams Plan",
        shortLabelEs: "Equipos",
        shortLabelEn: "Teams",
    },
    enterprise: {
        icon: Building2,
        cssVar: "var(--plan-enterprise)",
        labelEs: "Plan Empresarial",
        labelEn: "Enterprise Plan",
        shortLabelEs: "Empresa",
        shortLabelEn: "Enterprise",
    },
    founder: {
        icon: Medal,
        cssVar: "var(--plan-founder)",
        labelEs: "Fundadora",
        labelEn: "Founder",
        shortLabelEs: "Fundadora",
        shortLabelEn: "Founder",
    },
};

/**
 * Resolve a plan slug or name to its config.
 * Handles slugs ("pro"), display names ("Profesional"), and case variations.
 */
export function getPlanConfig(slugOrName?: string | null): PlanConfig {
    if (!slugOrName) return PLAN_CONFIG.free;

    const lower = slugOrName.toLowerCase().trim();

    // Direct slug match
    if (PLAN_CONFIG[lower]) return PLAN_CONFIG[lower];

    // Name-based fallback (for legacy data that passes plan names instead of slugs)
    if (lower.includes("enterprise") || lower.includes("empresa")) return PLAN_CONFIG.enterprise;
    if (lower.includes("team") || lower.includes("equipo")) return PLAN_CONFIG.teams;
    if (lower.includes("pro") || lower.includes("profesional")) return PLAN_CONFIG.pro;
    if (lower.includes("founder") || lower.includes("fundador")) return PLAN_CONFIG.founder;

    return PLAN_CONFIG.free;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface PlanBadgeProps {
    /** Plan slug (e.g. "pro", "teams") or plan name (e.g. "Profesional") */
    planSlug?: string | null;
    /** Visual variant */
    variant?: "default" | "glass";
    /** Current locale for i18n */
    locale?: string;
    /** Additional classes */
    className?: string;
    /** Whether to show the icon */
    showIcon?: boolean;
    /** Whether to show the label */
    showLabel?: boolean;
    /** Whether to link to pricing */
    linkToPricing?: boolean;
    /** Use short label (e.g. "Esencial" instead of "Plan Esencial") */
    compact?: boolean;
}

export function PlanBadge({
    planSlug,
    variant = "default",
    locale = "es",
    className,
    showIcon = true,
    showLabel = true,
    linkToPricing = true,
    compact = false,
}: PlanBadgeProps) {
    const config = getPlanConfig(planSlug);
    const Icon = config.icon;
    const label = compact
        ? (locale === "en" ? config.shortLabelEn : config.shortLabelEs)
        : (locale === "en" ? config.labelEn : config.labelEs);

    const content = (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 transition-colors",
                variant === "glass" && [
                    "px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-white/15",
                ],
                variant === "default" && [
                    "px-2 py-0.5 rounded-full border",
                ],
                linkToPricing && "cursor-pointer",
                className,
            )}
            style={{
                ...(variant === "glass" && {
                    backgroundColor: `color-mix(in srgb, ${config.cssVar} 20%, transparent)`,
                }),
                ...(variant === "default" && {
                    backgroundColor: `color-mix(in srgb, ${config.cssVar} 12%, transparent)`,
                    borderColor: `color-mix(in srgb, ${config.cssVar} 30%, transparent)`,
                    color: config.cssVar,
                }),
            }}
        >
            {showIcon && (
                <Icon
                    className={cn(
                        "shrink-0",
                        variant === "glass" ? "w-3 h-3 text-white/70" : "w-3 h-3",
                    )}
                    style={variant === "default" ? { color: config.cssVar } : undefined}
                />
            )}
            {showLabel && (
                <span
                    className={cn(
                        "font-semibold tracking-wide",
                        variant === "glass" && "text-[11px] text-white/80",
                        variant === "default" && "text-[11px]",
                    )}
                    style={variant === "default" ? { color: config.cssVar } : undefined}
                >
                    {label}
                </span>
            )}
        </div>
    );

    if (!linkToPricing) return content;

    return (
        <Link href="/pricing" className="no-underline">
            {content}
        </Link>
    );
}

// ============================================================================
// FOUNDER BADGE — Special variant for founder status
// ============================================================================

interface FounderBadgeProps {
    variant?: "default" | "glass";
    locale?: string;
    className?: string;
}

export function FounderBadge({
    variant = "default",
    locale = "es",
    className,
}: FounderBadgeProps) {
    return (
        <PlanBadge
            planSlug="founder"
            variant={variant}
            locale={locale}
            className={className}
            linkToPricing={false}
        />
    );
}
