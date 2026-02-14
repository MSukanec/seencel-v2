"use client";

// ============================================================================
// PLAN BADGE — Architectural Metal Plate
// ============================================================================
// Industrial membership plate. Each plan = different metal material.
// Physical, engraved, premium. Not SaaS. Not gaming. Architecture.
//
// Materials:
//   Essential    → Anodized matte aluminum (flat, almost invisible)
//   Professional → Brushed steel (cool, textured, subtle depth)
//   Teams        → Tempered blue steel (deep, desaturated, technical)
//   Enterprise   → Satin brass (warm, dominant, weighty)
//
// Used in: sidebar, overview widget, organization list, pricing
// ============================================================================

import React from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// ============================================================================
// ENGRAVED MARKS — Laser-etched, not icons
// ============================================================================

function MarkEssential({ color }: { color: string }) {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="1.5" fill={color} />
        </svg>
    );
}

function MarkProfessional({ color }: { color: string }) {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="2" y1="6" x2="10" y2="6" stroke={color} strokeWidth="1" strokeLinecap="round" />
        </svg>
    );
}

function MarkTeams({ color }: { color: string }) {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="2" y1="4.5" x2="10" y2="4.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
            <line x1="2" y1="7.5" x2="10" y2="7.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
        </svg>
    );
}

function MarkEnterprise({ color }: { color: string }) {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3.5 8L6 3.5L8.5 8" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ============================================================================
// MOUNTING SCREW — Hex/Allen head, recessed
// ============================================================================

function Screw({ className, color }: { className?: string; color: string }) {
    return (
        <svg
            width="6"
            height="6"
            viewBox="0 0 6 6"
            fill="none"
            className={className}
        >
            {/* Outer recess — subtle ring */}
            <circle cx="3" cy="3" r="2.5" stroke={color} strokeWidth="0.5" opacity="0.5" />
            {/* Inner hex slot */}
            <circle cx="3" cy="3" r="0.8" fill={color} opacity="0.4" />
        </svg>
    );
}
// ============================================================================
// PLAN CONFIG
// ============================================================================

type PlanSlug = "essential" | "free" | "pro" | "teams" | "enterprise" | "founder";

export interface PlanConfig {
    mark: React.ComponentType<{ color: string }>;
    label: string;
    shortLabel: string;
}

const PLAN_CONFIG: Record<PlanSlug, PlanConfig> = {
    free: { mark: MarkEssential, label: "Essential", shortLabel: "Essential" },
    essential: { mark: MarkEssential, label: "Essential", shortLabel: "Essential" },
    pro: { mark: MarkProfessional, label: "Professional", shortLabel: "Pro" },
    teams: { mark: MarkTeams, label: "Teams", shortLabel: "Teams" },
    enterprise: { mark: MarkEnterprise, label: "Enterprise", shortLabel: "Enterprise" },
    founder: { mark: MarkEssential, label: "Founder", shortLabel: "Founder" },
};

export function getPlanConfig(slugOrName?: string | null): PlanConfig {
    if (!slugOrName) return PLAN_CONFIG.free;
    const lower = slugOrName.toLowerCase().trim();
    if (lower in PLAN_CONFIG) return PLAN_CONFIG[lower as PlanSlug];
    if (lower.includes("enterprise") || lower.includes("empresa")) return PLAN_CONFIG.enterprise;
    if (lower.includes("team") || lower.includes("equipo")) return PLAN_CONFIG.teams;
    if (lower.includes("pro") || lower.includes("profesional")) return PLAN_CONFIG.pro;
    if (lower.includes("founder") || lower.includes("fundador")) return PLAN_CONFIG.founder;
    return PLAN_CONFIG.free;
}

function resolvePlanSlug(slugOrName?: string | null): PlanSlug {
    if (!slugOrName) return "free";
    const lower = slugOrName.toLowerCase().trim();
    if (lower in PLAN_CONFIG) return lower as PlanSlug;
    if (lower.includes("enterprise") || lower.includes("empresa")) return "enterprise";
    if (lower.includes("team") || lower.includes("equipo")) return "teams";
    if (lower.includes("pro") || lower.includes("profesional")) return "pro";
    if (lower.includes("founder") || lower.includes("fundador")) return "founder";
    return "free";
}

// ============================================================================
// PLAN ACCENT SYSTEM — "DNA" for contextual UI (sidebar, cards, etc.)
// ============================================================================
// These are NOT the badge materials. They're subtle accent colors derived from
// the plan material, used to tint active states, borders, and glows in the UI.
// Rule: Accent should be felt, not seen. Never replicate the badge.
// ============================================================================

const PLAN_ACCENTS: Record<PlanSlug, Record<string, string>> = {
    free: {
        "--plan-accent": "rgba(255,255,255,0.04)",
        "--plan-glow": "0 0 0 transparent",
        "--plan-border": "rgba(255,255,255,0.08)",
    },
    essential: {
        "--plan-accent": "rgba(255,255,255,0.04)",
        "--plan-glow": "0 0 0 transparent",
        "--plan-border": "rgba(255,255,255,0.08)",
    },
    pro: {
        "--plan-accent": "rgba(180,190,220,0.08)",
        "--plan-glow": "0 0 10px rgba(180,190,220,0.06)",
        "--plan-border": "rgba(180,195,230,0.25)",
    },
    teams: {
        "--plan-accent": "rgba(210,180,100,0.08)",
        "--plan-glow": "0 0 10px rgba(210,180,100,0.06)",
        "--plan-border": "rgba(215,185,100,0.25)",
    },
    enterprise: {
        "--plan-accent": "rgba(160,155,210,0.10)",
        "--plan-glow": "0 0 12px rgba(160,155,220,0.08)",
        "--plan-border": "rgba(165,160,220,0.30)",
    },
    founder: {
        "--plan-accent": "rgba(255,255,255,0.04)",
        "--plan-glow": "0 0 0 transparent",
        "--plan-border": "rgba(255,255,255,0.08)",
    },
};

/** Returns CSS custom properties for a given plan slug, for use as `style` prop */
export function getPlanAccentVars(slugOrName?: string | null): Record<string, string> {
    const slug = resolvePlanSlug(slugOrName);
    return PLAN_ACCENTS[slug];
}

// ============================================================================
// MATERIAL SYSTEM
// ============================================================================

interface Material {
    surface: string;
    bevelLight: string;
    bevelDark: string;
    dropShadow: string;
    border: string;
    engrave: string;
    /** Solid color for the SVG mark icon — matches cutFill brightness */
    markColor: string;
    /** Gradient visible "through" the text cutout — the reveal material */
    cutFill: string;
    /** Founder sub-text cut fill (usually dimmer) */
    founderCutFill: string;
    /** text-shadow for depth (dark inset below text) */
    cutDepth: string;
    brushTexture: string | null;
    hasSheen: boolean;
    isDominant: boolean;
    /** Mouse light color (rgba) — matches material warmth */
    lightColor: string;
    /** Letter spacing for plan name */
    letterSpacing: string;
    /** Inner glow box-shadow (glass/crystal depth) */
    innerGlow: string | null;
    /** Mouse hover: radial-gradient shape + size */
    hoverShape: string;
    /** Mouse hover: opacity multiplier (0-1) */
    hoverIntensity: number;
}

const MATERIALS: Record<PlanSlug, Material> = {
    // ── FLAT GRAY PLASTIC — basic, plain, not premium ──
    free: {
        surface: "#3a3a3a",
        bevelLight: "rgba(255,255,255,0.03)",
        bevelDark: "rgba(0,0,0,0.22)",
        dropShadow: "0 1px 2px rgba(0,0,0,0.10)",
        border: "rgba(255,255,255,0.03)",
        engrave: "#444",
        markColor: "#808080",
        cutFill: "linear-gradient(160deg, #8a8a8a 0%, #757575 40%, #929292 60%, #7a7a7a 100%)",
        founderCutFill: "linear-gradient(160deg, #7a7a7a 0%, #686868 50%, #848484 100%)",
        cutDepth: "0 1px 1px rgba(0 0 0 / 0.6)",
        brushTexture: null,
        hasSheen: false,
        isDominant: false,
        lightColor: "rgba(255,255,255,0.07)",
        letterSpacing: "0.08em",
        innerGlow: null,
        hoverShape: "circle 120px",
        hoverIntensity: 1.3,
    },
    essential: {
        surface: "#3a3a3a",
        bevelLight: "rgba(255,255,255,0.03)",
        bevelDark: "rgba(0,0,0,0.22)",
        dropShadow: "0 1px 2px rgba(0,0,0,0.10)",
        border: "rgba(255,255,255,0.03)",
        engrave: "#444",
        markColor: "#808080",
        cutFill: "linear-gradient(160deg, #8a8a8a 0%, #757575 40%, #929292 60%, #7a7a7a 100%)",
        founderCutFill: "linear-gradient(160deg, #7a7a7a 0%, #686868 50%, #848484 100%)",
        cutDepth: "0 1px 1px rgba(0 0 0 / 0.6)",
        brushTexture: null,
        hasSheen: false,
        isDominant: false,
        lightColor: "rgba(255,255,255,0.07)",
        letterSpacing: "0.08em",
        innerGlow: null,
        hoverShape: "circle 120px",
        hoverIntensity: 1.3,
    },

    // ── SILVER PLATE — cool polished silver, first real upgrade ──
    pro: {
        surface: "linear-gradient(175deg, #484848, #3e3e3e)",
        bevelLight: "rgba(220,220,230,0.08)",
        bevelDark: "rgba(0,0,0,0.35)",
        dropShadow: "0 1px 3px rgba(0,0,0,0.18)",
        border: "rgba(200,200,210,0.08)",
        engrave: "#555",
        markColor: "#a8a8b0",
        cutFill: "linear-gradient(160deg, #b0b0b8 0%, #888890 40%, #c0c0c8 60%, #969698 100%)",
        founderCutFill: "linear-gradient(160deg, #959598 0%, #78787e 50%, #a5a5a8 100%)",
        cutDepth: "0 1px 1px rgba(0 0 0 / 0.55)",
        brushTexture: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(200,200,220,0.010) 2px, rgba(200,200,220,0.010) 3px)",
        hasSheen: true,
        isDominant: false,
        lightColor: "rgba(200,210,230,0.10)",
        letterSpacing: "0.10em",
        innerGlow: null,
        hoverShape: "circle 80px",
        hoverIntensity: 1.0,
    },

    // ── GOLD — warm gold surface, premium tier ──
    teams: {
        surface: "linear-gradient(175deg, #443820, #3a3018)",
        bevelLight: "rgba(210,175,100,0.10)",
        bevelDark: "rgba(0,0,0,0.45)",
        dropShadow: "0 1px 4px rgba(0,0,0,0.25)",
        border: "rgba(200,165,90,0.12)",
        engrave: "#6a5530",
        markColor: "#c8a848",
        cutFill: "linear-gradient(160deg, #d4b060 0%, #a88030 25%, #e0c470 50%, #b89038 75%, #d0a850 100%)",
        founderCutFill: "linear-gradient(160deg, #b89845 0%, #8a6828 50%, #c8a855 100%)",
        cutDepth: "0 1px 1px rgba(0 0 0 / 0.55)",
        brushTexture: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(210,175,100,0.010) 2px, rgba(210,175,100,0.010) 3px)",
        hasSheen: true,
        isDominant: false,
        lightColor: "rgba(230,210,170,0.12)",
        letterSpacing: "0.10em",
        innerGlow: null,
        hoverShape: "circle 60px",
        hoverIntensity: 0.8,
    },

    // ── OBSIDIAN — polished volcanic glass, glassy reflections ──
    enterprise: {
        surface: "linear-gradient(175deg, #232328, #18181c, #1e1e24)",
        bevelLight: "rgba(200,200,240,0.14)",
        bevelDark: "rgba(0,0,0,0.70)",
        dropShadow: "0 3px 10px rgba(0,0,0,0.50)",
        border: "rgba(160,160,210,0.12)",
        engrave: "#2a2a32",
        markColor: "#9090a8",
        cutFill: "linear-gradient(160deg, #a8a8b8 0%, #8088a0 20%, #90b0a8 40%, #a898b8 60%, #88a0b0 80%, #b0a8b8 100%)",
        founderCutFill: "linear-gradient(160deg, #8888a0 0%, #607888 40%, #887898 60%, #708898 100%)",
        cutDepth: "0 1px 1px rgba(0 0 0 / 0.65)",
        brushTexture: "repeating-linear-gradient(135deg, transparent, transparent 1px, rgba(180,180,240,0.008) 1px, rgba(180,180,240,0.008) 2px)",
        hasSheen: true,
        isDominant: true,
        lightColor: "rgba(180,170,220,0.14)",
        letterSpacing: "0.14em",
        innerGlow: "inset 0 0 12px rgba(150,140,200,0.06), inset 0 1px 0 rgba(180,180,220,0.08)",
        hoverShape: "ellipse 100px 40px",
        hoverIntensity: 0.7,
    },

    // ── Founder standalone — inherits Essential (flat gray) ──
    founder: {
        surface: "#3a3a3a",
        bevelLight: "rgba(255,255,255,0.03)",
        bevelDark: "rgba(0,0,0,0.22)",
        dropShadow: "0 1px 2px rgba(0,0,0,0.10)",
        border: "rgba(255,255,255,0.03)",
        engrave: "#444",
        markColor: "#808080",
        cutFill: "linear-gradient(160deg, #8a8a8a 0%, #757575 40%, #929292 60%, #7a7a7a 100%)",
        founderCutFill: "linear-gradient(160deg, #7a7a7a 0%, #686868 50%, #848484 100%)",
        cutDepth: "0 1px 1px rgba(0 0 0 / 0.6)",
        brushTexture: null,
        hasSheen: false,
        isDominant: false,
        lightColor: "rgba(255,255,255,0.07)",
        letterSpacing: "0.08em",
        innerGlow: null,
        hoverShape: "circle 120px",
        hoverIntensity: 1.3,
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

interface PlanBadgeProps {
    planSlug?: string | null;
    /** @deprecated */
    variant?: "default" | "glass";
    /** @deprecated */
    locale?: string;
    className?: string;
    showIcon?: boolean;
    showLabel?: boolean;
    linkToPricing?: boolean;
    compact?: boolean;
    /** Shows "FOUNDER" engraved below plan name */
    isFounder?: boolean;
}

export function PlanBadge({
    planSlug,
    className,
    showIcon = true,
    showLabel = true,
    linkToPricing = true,
    compact = false,
    isFounder = false,
}: PlanBadgeProps) {
    const slug = resolvePlanSlug(planSlug);
    const config = getPlanConfig(planSlug);
    const mat = MATERIALS[slug];
    const Mark = config.mark;
    const label = compact ? config.shortLabel : config.label;

    // Mouse-as-light: affects both surface glow and text engraving
    const plateRef = React.useRef<HTMLDivElement>(null);
    const lightRef = React.useRef<HTMLDivElement>(null);

    const handleMouseMove = React.useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const plate = plateRef.current;
            if (!plate) return;
            const rect = plate.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Surface light glow (shape + intensity matched to material)
            if (lightRef.current) {
                lightRef.current.style.background =
                    `radial-gradient(${mat.hoverShape} at ${x}px ${y}px, ${mat.lightColor} 0%, transparent 100%)`;
                lightRef.current.style.opacity = String(mat.hoverIntensity);
            }

            // Store mouse position for text highlight
            plate.style.setProperty("--mouse-x", `${x}px`);
            plate.style.setProperty("--mouse-y", `${y}px`);
        },
        [],
    );

    const handleMouseLeave = React.useCallback(() => {
        if (lightRef.current) {
            lightRef.current.style.opacity = "0";
        }
        if (plateRef.current) {
            plateRef.current.style.removeProperty("--mouse-x");
            plateRef.current.style.removeProperty("--mouse-y");
        }
    }, []);

    const badge = (
        <div
            ref={plateRef}
            className={cn(
                "relative inline-flex items-center gap-2 overflow-hidden",
                "rounded-md",
                mat.isDominant
                    ? "px-7 py-3"
                    : (showLabel ? "px-6 py-2" : "px-2 py-2"),
                linkToPricing && "cursor-pointer",
                className,
            )}
            style={{
                background: mat.surface,
                border: `1px solid ${mat.border}`,
                boxShadow: [
                    `inset 0 1px 0 ${mat.bevelLight}`,
                    `inset 0 -1px 0 ${mat.bevelDark}`,
                    mat.dropShadow,
                    ...(mat.innerGlow ? [mat.innerGlow] : []),
                ].join(", "),
                animation: "plan-settle 0.25s ease-out both",
            } as React.CSSProperties}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* ── Mounting screws (4 corners) ── */}
            {showLabel && (
                <>
                    <Screw className="absolute top-1.5 left-1.5" color={mat.engrave} />
                    <Screw className="absolute top-1.5 right-1.5" color={mat.engrave} />
                    <Screw className="absolute bottom-1.5 left-1.5" color={mat.engrave} />
                    <Screw className="absolute bottom-1.5 right-1.5" color={mat.engrave} />
                </>
            )}
            {/* ── Brushed texture (horizontal lines, barely visible) ── */}
            {mat.brushTexture && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: mat.brushTexture }}
                />
            )}

            {/* ── Automatic sheen — runs along the top edge (bevel light) ── */}
            {mat.hasSheen && (
                <div
                    className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(90deg, transparent 0%, transparent 10%, rgba(255,255,255,0.25) 46%, rgba(255,255,255,0.08) 54%, transparent 90%, transparent 100%)",
                        animation: "plan-reflection 12s linear infinite",
                    }}
                />
            )}

            {/* ── Mouse-as-light overlay (follows cursor, all plans) ── */}
            <div
                ref={lightRef}
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{ opacity: 0 }}
            />

            {/* ── Engraved mark ── */}
            {showIcon && (
                <div className="relative z-10 shrink-0">
                    <Mark color={mat.markColor} />
                </div>
            )}

            {/* ── Text — cut through metal, revealing material beneath ── */}
            {showLabel && (
                <div className="relative z-10 flex flex-col min-w-0">
                    {/* Plan name — cut revealing material */}
                    <span
                        className={cn(
                            "uppercase leading-none",
                            mat.isDominant ? "text-[13px] font-bold" : "text-xs font-semibold",
                        )}
                        style={{
                            backgroundImage: mat.cutFill,
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            color: "transparent",
                            letterSpacing: mat.letterSpacing,
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        {label}
                    </span>

                    {/* Founder — dimmer cut */}
                    {isFounder && (
                        <span
                            className="uppercase leading-none mt-1.5 font-medium"
                            style={{
                                backgroundImage: mat.founderCutFill,
                                WebkitBackgroundClip: "text",
                                backgroundClip: "text",
                                color: "transparent",
                                fontSize: "8.5px",
                                letterSpacing: "0.18em",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Founder
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    if (!linkToPricing) return badge;

    return (
        <Link href="/pricing" className="no-underline">
            {badge}
        </Link>
    );
}

// ============================================================================
// FOUNDER BADGE — Standalone
// ============================================================================

interface FounderBadgeProps {
    variant?: "default" | "glass";
    locale?: string;
    className?: string;
}

export function FounderBadge({ className }: FounderBadgeProps) {
    return (
        <PlanBadge
            planSlug="essential"
            isFounder
            className={className}
            linkToPricing={false}
        />
    );
}

export default PlanBadge;
