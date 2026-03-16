"use client";

/**
 * ViewEmptyState — Premium empty state with optional Quick Start Templates & Onboarding Steps
 *
 * Three modes:
 * 1. "empty"         → No data exists (onboarding). Supports quickStartPacks + onboardingSteps.
 * 2. "no-results"    → Filters applied but nothing matches. Minimal UI.
 * 3. "context-empty" → Data in org, but not in selected project.
 *
 * Visual: SVG illustration composed from the feature icon, adapts to theme.
 * No dashed borders, no diagonal hatching. Uses dot grid + radial glow.
 *
 * Quick Start Packs: create template items with one click (mode="empty").
 * Onboarding Steps: numbered guide steps with navigation (mode="empty").
 * Both are defined per-feature and passed as props. They can coexist.
 * The component is generic — it doesn't know about specific features.
 */

import { useState } from "react";
import { LucideIcon, BookOpen, RotateCcw, Plus, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasDocsForPath } from "@/features/docs/lib/docs-mapping";
import { useContextSidebarOverlay } from "@/stores/sidebar-store";
import { DocsInlinePanel } from "@/features/docs/components/docs-inline-panel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

// ─── Types ───────────────────────────────────────────────

/** Internal button that opens docs inline via ContextSidebar overlay */
function DocsButton({ docsPath }: { docsPath: string }) {
    const { pushOverlay, hasOverlay } = useContextSidebarOverlay();

    // docsPath comes as "/docs/proyectos/introduccion" — extract slug
    const slug = docsPath.replace(/^\/(es\/|en\/)?docs\//, '');

    if (!slug) return null;

    const handleClick = () => {
        if (hasOverlay) return;
        pushOverlay(
            <DocsInlinePanel slug={slug} />,
            { title: "Documentación" }
        );
    };

    return (
        <Button variant="outline" size="sm" onClick={handleClick}>
            <BookOpen className="mr-2 h-4 w-4" />
            Documentación
        </Button>
    );
}

export interface QuickStartPack {
    /** Unique identifier */
    id: string;
    /** Icon representing this template pack */
    icon: LucideIcon;
    /** Short name (e.g. "Pack Servicios") */
    label: string;
    /** What gets created (e.g. "Luz, Gas, Internet, Agua") */
    description: string;
    /**
     * Called when user clicks. Should create the template items.
     * Return void — toast/refresh is handled by the caller.
     */
    onApply: () => Promise<void>;
}

export interface OnboardingStep {
    /** Unique identifier */
    id: string;
    /** Icon representing this step */
    icon: LucideIcon;
    /** Short name (e.g. "Crear Conceptos") */
    label: string;
    /** What this step does (e.g. "Definí los tipos de gasto de tu organización") */
    description: string;
    /** Route to navigate to (optional — uses Link) */
    href?: string;
    /** Action to perform (optional — uses onClick) */
    onClick?: () => void;
}

interface ViewEmptyStateProps {
    /**
     * "empty"         → No data exists (initial state)
     * "no-results"    → Filters applied but no matches
     * "context-empty" → Data exists in org but not in the selected project
     */
    mode: "empty" | "no-results" | "context-empty";

    /** Icon representing the page/feature */
    icon: LucideIcon;

    /** Name of the view (e.g., "Materiales", "Pagos") */
    viewName: string;

    /**
     * Only for mode="empty": Extensive description of the feature.
     * Can be string or JSX.
     */
    featureDescription?: React.ReactNode;

    /** Only for mode="empty" and "context-empty": Primary action callback */
    onAction?: () => void;

    /** Only for mode="empty" and "context-empty": Label for the action button */
    actionLabel?: string;

    /** Only for mode="empty": Icon for the action button (defaults to Plus) */
    actionIcon?: LucideIcon;

    /**
     * Only for mode="empty": Path to documentation page.
     */
    docsPath?: string;

    /** Only for mode="no-results": Callback to reset filters */
    onResetFilters?: () => void;

    /** Optional: Custom filter description for no-results mode */
    filterContext?: string;

    /** Only for mode="context-empty": Name of the active project */
    projectName?: string;

    /** Only for mode="context-empty": Callback to switch to org context */
    onSwitchToOrg?: () => void;

    /**
     * Quick Start template packs (mode="empty" only).
     * Each feature defines its own packs.
     * When provided, renders a "Quick Start" section above the manual action.
     */
    quickStartPacks?: QuickStartPack[];

    /**
     * Onboarding steps (mode="empty" only).
     * Numbered guide steps with navigation — no data creation.
     * Ideal for dashboards that depend on data from other sections.
     */
    onboardingSteps?: OnboardingStep[];

    className?: string;
}

// ─── Sub: SVG Illustration ───────────────────────────────

function EmptyStateIllustration({ icon: Icon }: { icon: LucideIcon }) {
    return (
        <div className="relative mb-8 z-10">
            {/* Pulsing radial glow behind the icon */}
            <div
                className="absolute inset-0 -m-8 rounded-full blur-3xl pointer-events-none"
                style={{
                    background: "radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 70%)",
                    animation: "emptyGlow 4s ease-in-out infinite",
                }}
            />

            {/* Icon — large, no card, float animation */}
            <div
                className="relative flex items-center justify-center"
                style={{ animation: "emptyBreathe 5s ease-in-out infinite" }}
            >
                <Icon className="h-16 w-16 text-primary/70" strokeWidth={1} />
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes emptyBreathe {
                    0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
                    25% { transform: translateY(-5px) rotate(2deg) scale(1.03); }
                    50% { transform: translateY(-3px) rotate(-1.5deg) scale(1.01); }
                    75% { transform: translateY(-6px) rotate(1deg) scale(1.04); }
                }
                @keyframes emptyGlow {
                    0%, 100% { opacity: 0.5; transform: scale(0.95); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
}

// ─── Sub: Quick Start Pack Card ──────────────────────────

function QuickStartCard({ pack }: { pack: QuickStartPack }) {
    const [isApplying, setIsApplying] = useState(false);
    const PackIcon = pack.icon;

    const handleApply = async () => {
        if (isApplying) return;
        setIsApplying(true);
        try {
            await pack.onApply();
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <button
            onClick={handleApply}
            disabled={isApplying}
            className={cn(
                "group flex items-start gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-200 text-left cursor-pointer w-full",
                "hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.15)]",
                isApplying && "opacity-60 pointer-events-none"
            )}
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                {isApplying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <PackIcon className="h-4 w-4" />
                )}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                    {pack.label}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {pack.description}
                </span>
            </div>
        </button>
    );
}

// ─── Sub: Onboarding Step Item (Timeline) ────────────────

function OnboardingStepItem({ step, index, isLast }: { step: OnboardingStep; index: number; isLast: boolean }) {
    const StepIcon = step.icon;
    const isClickable = !!(step.href || step.onClick);

    const content = (
        <div
            className={cn(
                "group flex items-start gap-3 text-left w-full relative",
                isClickable && "cursor-pointer"
            )}
        >
            {/* Timeline: circle + connector line */}
            <div className="flex flex-col items-center shrink-0">
                <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                    isClickable
                        ? "border-primary/30 text-primary bg-primary/5 group-hover:bg-primary/15 group-hover:border-primary/50"
                        : "border-border text-muted-foreground bg-muted/30"
                )}>
                    {index + 1}
                </div>
                {!isLast && (
                    <div className="w-[2px] h-full min-h-[16px] bg-border/50 mt-1" />
                )}
            </div>

            {/* Content */}
            <div className={cn("flex items-center gap-2.5 flex-1 min-w-0 pb-4", isLast && "pb-0")}>
                <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                    isClickable
                        ? "text-muted-foreground group-hover:text-primary"
                        : "text-muted-foreground/60"
                )}>
                    <StepIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <span className={cn(
                        "text-sm font-medium transition-colors",
                        isClickable
                            ? "text-foreground/80 group-hover:text-foreground"
                            : "text-muted-foreground"
                    )}>
                        {step.label}
                    </span>
                    <span className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
                        {step.description}
                    </span>
                </div>
                {isClickable && (
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                )}
            </div>
        </div>
    );

    if (step.href) {
        return <Link href={step.href as any}>{content}</Link>;
    }

    if (step.onClick) {
        return <button onClick={step.onClick} className="w-full">{content}</button>;
    }

    return content;
}

// ─── Main Component ──────────────────────────────────────

export function ViewEmptyState({
    mode,
    icon: Icon,
    viewName,
    featureDescription,
    onAction,
    actionLabel,
    actionIcon: ActionIcon = Plus,
    docsPath,
    onResetFilters,
    filterContext,
    projectName,
    onSwitchToOrg,
    quickStartPacks,
    onboardingSteps,
    className,
}: ViewEmptyStateProps) {
    const isEmptyMode = mode === "empty";
    const isContextEmpty = mode === "context-empty";
    const isNoResults = mode === "no-results";
    const hasPacks = isEmptyMode && quickStartPacks && quickStartPacks.length > 0;
    const hasSteps = isEmptyMode && onboardingSteps && onboardingSteps.length > 0;

    // ─── No Results — Minimal ────────────────────────────
    if (isNoResults) {
        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center flex-1 min-h-0 h-full p-8 text-center",
                    "animate-in fade-in-50 duration-300",
                    className
                )}
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mb-4">
                    <Icon className="h-6 w-6 text-muted-foreground/60" />
                </div>
                <h3 className="text-base font-medium text-foreground/80">
                    Sin resultados
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
                    {filterContext
                        ? `No se encontraron ${viewName.toLowerCase()} ${filterContext}.`
                        : `No se encontraron ${viewName.toLowerCase()} con los filtros aplicados.`}
                </p>
                {onResetFilters && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetFilters}
                        className="mt-4"
                    >
                        <RotateCcw className="mr-2 h-3.5 w-3.5" />
                        Limpiar filtros
                    </Button>
                )}
            </div>
        );
    }

    // ─── Empty & Context-Empty ───────────────────────────

    const title = isContextEmpty
        ? `No hay ${viewName.toLowerCase()} en ${projectName || "este proyecto"}`
        : viewName;

    const description = isContextEmpty
        ? `Este proyecto aún no tiene ${viewName.toLowerCase()} vinculados. Podés crear uno nuevo o ver todos los ${viewName.toLowerCase()} de la organización.`
        : featureDescription;

    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center flex-1 min-h-0 h-full p-8 text-center overflow-hidden",
                "animate-in fade-in-50 zoom-in-[0.98] duration-500",
                className
            )}
        >
            {/* Background: Dot grid pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.035]"
                style={{
                    backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
            />

            {/* Background: Radial glow from center */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full opacity-[0.04]"
                    style={{
                        background: "radial-gradient(ellipse, hsl(var(--primary)), transparent 70%)",
                    }}
                />
            </div>

            {/* Illustration */}
            <EmptyStateIllustration icon={Icon} />

            {/* Title */}
            <h3 className="relative z-10 text-xl font-semibold tracking-tight text-foreground/90">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="relative z-10 mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
                    {description}
                </p>
            )}

            {/* Quick Start Templates */}
            {hasPacks && (
                <div className="relative z-10 mt-6 w-full max-w-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-3.5 w-3.5 text-primary/60" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Comenzá rápido
                        </span>
                    </div>
                    <div className="flex flex-col gap-2">
                        {quickStartPacks!.map((pack) => (
                            <QuickStartCard key={pack.id} pack={pack} />
                        ))}
                    </div>
                </div>
            )}

            {/* Onboarding Steps (Timeline) */}
            {hasSteps && (
                <div className="relative z-10 mt-6 w-full max-w-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowRight className="h-3.5 w-3.5 text-primary/60" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Primeros pasos
                        </span>
                    </div>
                    <div className="flex flex-col">
                        {onboardingSteps!.map((step, i) => (
                            <OnboardingStepItem
                                key={step.id}
                                step={step}
                                index={i}
                                isLast={i === onboardingSteps!.length - 1}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className={cn(
                "relative z-10 flex items-center gap-3",
                (hasPacks || hasSteps) ? "mt-5" : "mt-6",
                "animate-in slide-in-from-bottom-2 fade-in duration-500 delay-150"
            )}>
                {isEmptyMode ? (
                    <>
                        {onAction && actionLabel && (
                            <Button onClick={onAction} size="sm">
                                <ActionIcon className="mr-2 h-4 w-4" />
                                {actionLabel}
                            </Button>
                        )}
                        {docsPath && hasDocsForPath(docsPath) && (
                            <DocsButton docsPath={docsPath} />
                        )}
                    </>
                ) : isContextEmpty ? (
                    <>
                        {onAction && actionLabel && (
                            <Button onClick={onAction} size="sm">
                                <ActionIcon className="mr-2 h-4 w-4" />
                                {actionLabel}
                            </Button>
                        )}
                        {onSwitchToOrg && (
                            <Button variant="outline" size="sm" onClick={onSwitchToOrg}>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Ver todos
                            </Button>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default ViewEmptyState;
