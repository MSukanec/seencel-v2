"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLayoutStore, NavigationContext } from "@/stores/layout-store";
import { usePathname, useRouter } from "@/i18n/routing";
import { useRouter as useNextRouter } from "next/navigation";
import { SidebarContextButton, SidebarBrandButton, SidebarNavButton, SidebarNotificationsButton, SidebarAdminButton } from "./buttons";
import { SidebarAccordionGroups } from "./sidebar-accordion";
import { SidebarPlanButton } from "./plan-button";
import { getPlanAccentVars } from "@/components/shared/plan-badge";
import { useOrganization } from "@/stores/organization-store";
import { SidebarInstallButton } from "./install-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    PanelLeft,
    PanelLeftClose,
    PanelLeftOpen,
    ArrowLeft,
    Building,
    EyeOff,
    Check,
    Bell,
    CalendarDays,
    Users,
    ClipboardList,
    LayoutDashboard,
} from "lucide-react";
import { useSidebarNavigation, contextRoutes } from "@/hooks/use-sidebar-navigation";
import { Badge } from "@/components/ui/badge";
import { Lock, Medal } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarMode } from "@/types/preferences";
import { SidebarTooltipProvider, SidebarTooltip, type SidebarRestriction } from "./sidebar-tooltip";

// ============================================================================
// V2 EXPERIMENTAL - DRILL-DOWN SIDEBAR
// ============================================================================
// Home State: Only context buttons (Dashboard, Academia, Comunidad, Admin)
// Context State: Back button + Accordions/Items for that context
// Animation: Slide right when entering, slide left when going back
// ============================================================================

interface SidebarContentProps {
    onLinkClick?: () => void;
    mode?: "desktop" | "mobile";
    isExpanded?: boolean;
    user?: {
        full_name?: string | null;
        email?: string | null;
        avatar_url?: string | null;
    } | null;
}

// For Dashboard context, we show Organization and Project as sub-accordions
// For Dashboard context, we show Organization and Project as sub-accordions
type DrillDownState = NavigationContext;

export function SidebarContent({
    onLinkClick,
    mode = "desktop",
    isExpanded: propIsExpanded,
    user
}: SidebarContentProps) {
    const pathname = usePathname();
    const router = useRouter();
    const nativeRouter = useNextRouter();
    const { activeContext, sidebarMode, actions } = useLayoutStore();
    const { contexts, contextRoutes, getNavItems, getNavGroups } = useSidebarNavigation();
    const { planSlug } = useOrganization();
    const planAccentVars = React.useMemo(() => getPlanAccentVars(planSlug), [planSlug]);



    const isMobile = mode === "mobile";
    const isExpanded = propIsExpanded ?? isMobile;

    // Drill-down state: "home" or a specific context
    const [drillState, setDrillState] = React.useState<DrillDownState>(() => {
        return "home";
    });

    // EFFECT: Sync drillState with activeContext
    React.useEffect(() => {
        if (activeContext && activeContext !== drillState) {
            setDrillState(activeContext);
        }
    }, [activeContext]);


    // Animation direction
    const [slideDirection, setSlideDirection] = React.useState<"left" | "right">("right");
    const [sidebarPopoverOpen, setSidebarPopoverOpen] = React.useState(false);

    // Handle context button click - drill into that context AND navigate instantly
    const handleContextEnter = (ctx: NavigationContext) => {
        setSlideDirection("right");
        setDrillState(ctx);
        actions.setActiveContext(ctx);
        // Navigate to the context's main page instantly
        router.push(contextRoutes[ctx] as any);
    };

    // Handle back button - return to home (HUB)
    const handleBack = () => {
        setSlideDirection("left");
        setDrillState("home");
        actions.setActiveContext("home");
        // Navigate to HUB page immediately
        router.push("/hub");
    };

    // Toggle sidebar mode: docked → expanded_hover → collapsed → docked
    const cycleSidebarMode = () => {
        if (sidebarMode === 'docked') actions.setSidebarMode('expanded_hover');
        else if (sidebarMode === 'expanded_hover') actions.setSidebarMode('collapsed');
        else actions.setSidebarMode('docked');
    };

    // Icons: docked (full) → PanelLeftClose, expanded_hover (hover) → PanelLeft, collapsed → PanelLeft
    const getModeIcon = () => {
        if (sidebarMode === 'docked') return PanelLeftClose;      // "click to reduce"
        return PanelLeft;                                          // "click to expand more"
    };
    const getModeLabel = () => {
        if (sidebarMode === 'docked') return "Hover";              // next: expanded_hover
        if (sidebarMode === 'expanded_hover') return "Colapsar";   // next: collapsed
        return "Fijar";                                            // next: docked
    };

    // Get unified nav groups for accordion rendering
    const navGroups = getNavGroups("organization");

    // 1. Sync Context based on URL (Navigation)
    React.useEffect(() => {
        // Project Context → unified under organization
        if (pathname.includes('/project/')) {
            if (activeContext !== 'organization') actions.setActiveContext('organization');
            return;
        }

        // Learnings Context
        if (pathname.includes('/academy')) {
            if (activeContext !== 'learnings') actions.setActiveContext('learnings');
            return;
        }

        // Community Context
        if (pathname.includes('/community')) {
            if (activeContext !== 'community') actions.setActiveContext('community');
            return;
        }

        // Organization Context (must be after project check to avoid overlaps if URL schema is weird, but usually distinct)
        if (pathname.includes('/organization')) {
            if (activeContext !== 'organization') actions.setActiveContext('organization');
            return;
        }

        // Admin Context
        if (pathname.includes('/admin')) {
            if (activeContext !== 'admin') actions.setActiveContext('admin');
            return;
        }

        // Hub Context
        if (pathname.includes('/hub')) {
            if (activeContext !== 'home') actions.setActiveContext('home');
            return;
        }

    }, [pathname, actions, activeContext]);



    // Slide animation classes
    const slideClass = cn(
        "transition-transform duration-200 ease-out",
        slideDirection === "right" ? "animate-slide-in-right" : "animate-slide-in-left"
    );

    // Width class
    const widthClass = isExpanded ? "w-[240px]" : "w-[50px]";

    // Unified Render Helper for Nav Items (Sub-items)
    const renderNavItem = (item: any, idx: number) => {
        const status = item.status;
        const isDisabled = item.disabled;
        const isHidden = item.hidden;

        // Badge
        let badge = null;
        if (isHidden) {
            badge = (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center bg-gray-500/10 hover:bg-gray-500/20 shadow-none">
                    <EyeOff className="h-3 w-3 text-gray-500" />
                </Badge>
            );
        } else if (status === 'maintenance') {
            badge = (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center bg-orange-500/10 hover:bg-orange-500/20 shadow-none">
                    <Lock className="h-3 w-3 text-orange-500" />
                </Badge>
            );
        } else if (status === 'founders') {
            badge = (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center bg-slate-400/10 hover:bg-slate-400/20 shadow-none">
                    <Medal className="h-3 w-3 text-slate-400" />
                </Badge>
            );
        }

        // Determine restriction for tooltip
        const restriction: SidebarRestriction = isHidden
            ? "hidden"
            : (status as SidebarRestriction) || null;

        const button = (
            <React.Fragment key={idx}>
                <SidebarNavButton
                    icon={item.icon}
                    label={item.title}
                    href={item.href}
                    isActive={pathname === item.href}
                    isExpanded={isExpanded}
                    onClick={onLinkClick}
                    badge={badge}
                    disabled={isDisabled}
                    isLocked={!!status || isHidden}
                />
            </React.Fragment>
        );

        // Wrap with unified SidebarTooltip (handles both tooltip + restriction info)
        return (
            <SidebarTooltip
                key={idx}
                label={item.title}
                restriction={restriction}
                isExpanded={isExpanded}
            >
                {button}
            </SidebarTooltip>
        );
    };

    return (

        <SidebarTooltipProvider>
            <div
                className={cn(
                    "flex flex-col h-full py-2 bg-sidebar border-r border-sidebar-border transition-all duration-150 ease-in-out relative",
                    widthClass
                )}
                style={planAccentVars as React.CSSProperties}
            >
                {/* SIDEBAR MODE POPOVER */}
                {!isMobile && (
                    <Popover open={sidebarPopoverOpen} onOpenChange={setSidebarPopoverOpen}>
                        <PopoverTrigger asChild>
                            <button
                                className="absolute left-full bottom-8 z-50 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-sidebar-border bg-sidebar shadow-md transition-colors hover:bg-accent hover:text-foreground text-muted-foreground"
                                title="Modo del sidebar"
                            >
                                {React.createElement(getModeIcon(), { className: "h-3 w-3" })}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="right"
                            align="end"
                            sideOffset={12}
                            className="w-[180px] p-1.5"
                        >
                            {([
                                { mode: 'docked' as SidebarMode, icon: PanelLeftClose, label: 'Fijado', desc: 'Siempre visible' },
                                { mode: 'expanded_hover' as SidebarMode, icon: PanelLeftOpen, label: 'Hover', desc: 'Aparece al pasar el cursor' },
                                { mode: 'collapsed' as SidebarMode, icon: PanelLeft, label: 'Colapsado', desc: 'Solo íconos' },
                            ]).map((opt) => (
                                <button
                                    key={opt.mode}
                                    onClick={() => {
                                        actions.setSidebarMode(opt.mode);
                                        setSidebarPopoverOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-2.5 w-full px-2.5 py-2 text-left rounded-md transition-colors",
                                        sidebarMode === opt.mode
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    <opt.icon className="h-4 w-4 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-medium">{opt.label}</span>
                                        <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
                                    </div>
                                    {sidebarMode === opt.mode && (
                                        <Check className="h-3 w-3 ml-auto shrink-0 text-primary" />
                                    )}
                                </button>
                            ))}
                        </PopoverContent>
                    </Popover>
                )}

                <div className="flex flex-col w-full h-full overflow-hidden">
                    <div className="w-full flex items-center gap-1.5 mb-2 px-2">
                        <div className="flex-1 min-w-0">
                            <SidebarBrandButton
                                isExpanded={isExpanded}
                            />
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="w-8 h-px bg-border/50 mb-2 mx-auto" />

                    <ScrollArea className="flex-1" type="scroll">
                        {/* ... (Previous Content Kept Same via Context, but I need to re-render it because replace_file requires context) 
                        Wait, this content is huge. using replace_file_content for the whole return is risky on size.
                        I should target START and END specific lines if possible.
                        But I am wrapping EVERYTHING inside the root div.
                        
                        I'll try to just wrap the RETURN statement content.
                    */}
                        {/* Only showing the modified structure here for clarity, will use code below */}

                        {/* ============================================================ */}
                        {/* HOME STATE: Context Buttons */}
                        {/* ============================================================ */}
                        {drillState === "home" && (
                            <nav className={cn("flex flex-col gap-2 px-2", slideClass)} key="home">
                                {contexts.map(ctx => {
                                    const descriptions: Record<string, string> = {
                                        organization: "Organización y proyectos",
                                        learnings: "Cursos y capacitaciones",
                                        community: "Fundadores y red Seencel",
                                        admin: "Panel de administración"
                                    };

                                    const labels: Record<string, string> = {
                                        organization: "Espacio de Trabajo"
                                    };

                                    const isDisabled = ctx.disabled;
                                    const status = ctx.status;

                                    // Badge Logic
                                    let badge = null;
                                    if (status === 'maintenance') {
                                        badge = (
                                            <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center bg-orange-500/10 hover:bg-orange-500/20 shadow-none">
                                                <Lock className="h-3 w-3 text-orange-500" />
                                            </Badge>
                                        );
                                    } else if (status === 'founders') {
                                        badge = (
                                            <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center bg-slate-400/10 hover:bg-slate-400/20 shadow-none">
                                                <Medal className="h-3 w-3 text-slate-400" />
                                            </Badge>
                                        );
                                    }

                                    const restriction: SidebarRestriction = (status as SidebarRestriction) || null;
                                    const ctxLabel = labels[ctx.id] || ctx.label;

                                    return (
                                        <SidebarTooltip
                                            key={ctx.id}
                                            label={ctxLabel}
                                            restriction={restriction}
                                            isExpanded={isExpanded}
                                        >
                                            <SidebarContextButton
                                                icon={ctx.icon}
                                                label={ctxLabel}
                                                description={descriptions[ctx.id]}
                                                isExpanded={isExpanded}
                                                onClick={() => {
                                                    if (isDisabled) return;
                                                    handleContextEnter(ctx.id);
                                                }}
                                                badge={isExpanded ? badge : null}
                                                isLocked={!!status}
                                                className={cn(
                                                    isDisabled && "cursor-not-allowed hover:bg-transparent",
                                                    !isDisabled && status && "cursor-pointer hover:opacity-60",
                                                    ctx.hidden && "opacity-40 border border-dashed border-primary/20 bg-muted/20"
                                                )}
                                            />
                                        </SidebarTooltip>
                                    );
                                })}
                            </nav>
                        )}

                        {/* ============================================================ */}
                        {/* ORGANIZATION STATE: Direct navigation buttons */}
                        {/* ============================================================ */}
                        {drillState === "organization" && (
                            <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key="organization">

                                {/* Quick Access Row */}
                                <div
                                    className={cn(
                                        "rounded-lg",
                                        "bg-sidebar-accent/30",
                                        "border border-sidebar-border/40",
                                        "p-1.5 mb-0.5"
                                    )}
                                    style={{
                                        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.12), inset 0 1px 0 0 rgba(255,255,255,0.06)",
                                    }}
                                >
                                    {/* Quick access icons */}
                                    <div className="grid grid-cols-4 gap-1">
                                        {/* Notifications — uses the full component with popover */}
                                        <SidebarTooltip label="Notificaciones" isExpanded={false}>
                                            <SidebarNotificationsButton variant="quick-access" />
                                        </SidebarTooltip>

                                        {([
                                            { icon: CalendarDays, label: 'Planificador', href: '/organization/planner' },
                                            { icon: Users, label: 'Equipo', href: '/organization/team' },
                                            { icon: ClipboardList, label: 'Tareas', href: '', disabled: true },
                                        ] as { icon: typeof CalendarDays; label: string; href: string; disabled?: boolean }[]).map((item) => (
                                            <SidebarTooltip key={item.label} label={item.label} isExpanded={false}>
                                                <button
                                                    onClick={() => {
                                                        if (item.disabled) return;
                                                        router.push(item.href as any);
                                                        onLinkClick?.();
                                                    }}
                                                    disabled={item.disabled}
                                                    className={cn(
                                                        "flex items-center justify-center h-8 w-full rounded-lg transition-all duration-150",
                                                        item.disabled
                                                            ? "text-muted-foreground/40 cursor-not-allowed opacity-50"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 cursor-pointer",
                                                        !item.disabled && pathname === item.href && "text-primary bg-primary/10"
                                                    )}
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                </button>
                                            </SidebarTooltip>
                                        ))}
                                    </div>
                                </div>

                                {/* Visión General — styled as card matching accordion items */}
                                <div
                                    className={cn(
                                        "rounded-lg",
                                        "bg-sidebar-accent/50",
                                        "border border-sidebar-border/40",
                                        "px-0.5 py-0.5",
                                    )}
                                    style={{
                                        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.12), inset 0 1px 0 0 rgba(255,255,255,0.06)",
                                        borderLeftColor: "var(--plan-border, rgba(255,255,255,0.06))",
                                        borderLeftWidth: "2px",
                                    }}
                                >
                                    <SidebarNavButton
                                        icon={LayoutDashboard}
                                        label="Visión General"
                                        href="/organization"
                                        isActive={pathname === '/organization'}
                                        isExpanded={isExpanded}
                                        onClick={onLinkClick}
                                    />
                                </div>

                                {/* Unified Nav Items with Accordion (exclude standalone 'principal' group) */}
                                <SidebarAccordionGroups
                                    groups={navGroups.filter(g => g.id !== 'principal')}
                                    renderItem={renderNavItem}
                                    isExpanded={isExpanded}
                                    activePath={pathname}
                                />
                            </nav>
                        )}



                        {/* LEARNINGS STATE */}
                        {drillState === "learnings" && (
                            <nav className={cn("flex flex-col gap-2 px-2", slideClass)} key="learnings">
                                {getNavItems("learnings").map((item, idx) => (
                                    <SidebarNavButton
                                        key={idx}
                                        icon={item.icon}
                                        label={item.title}
                                        href={item.href}
                                        isActive={pathname === item.href}
                                        isExpanded={isExpanded}
                                        onClick={onLinkClick}
                                    />
                                ))}
                            </nav>
                        )}

                        {/* COMMUNITY STATE */}
                        {drillState === "community" && (
                            <nav className={cn("flex flex-col gap-2 px-2", slideClass)} key="community">
                                {isExpanded && (
                                    <div className="px-3 py-2 text-sm font-semibold text-primary">
                                        Comunidad
                                    </div>
                                )}
                                {getNavItems("community").map(renderNavItem)}
                            </nav>
                        )}

                        {/* ADMIN STATE */}
                        {drillState === "admin" && (
                            <nav className={cn("flex flex-col gap-2 px-2", slideClass)} key="admin">

                                {getNavItems("admin").map((item, idx) => (
                                    <SidebarNavButton
                                        key={idx}
                                        icon={item.icon}
                                        label={item.title}
                                        href={item.href}
                                        isActive={pathname === item.href}
                                        isExpanded={isExpanded}
                                        onClick={onLinkClick}
                                    />
                                ))}
                            </nav>
                        )}
                    </ScrollArea>


                    {/* PWA Install prompt (above plan section) */}
                    {!isMobile && (
                        <div className="px-2 pb-1">
                            <SidebarInstallButton isExpanded={isExpanded} />
                        </div>
                    )}

                    {/* Mode Toggle (bottom, desktop only) */}
                    {!isMobile && (
                        <div className="mt-auto pt-3 border-t border-sidebar-border/50 px-2 space-y-2">
                            {/* Admin Button (only visible to admins) */}
                            <SidebarAdminButton isExpanded={isExpanded} />

                            {/* Hub Button — visible for all users */}
                            <SidebarNavButton
                                icon={ArrowLeft}
                                label="Volver al Hub"
                                href={"/organization" as any}
                                isActive={false}
                                isExpanded={isExpanded}
                                onClick={onLinkClick}
                            />

                            {/* Plan Badge — full width */}
                            <SidebarPlanButton isExpanded={isExpanded} />
                        </div>
                    )}
                </div>
            </div>
        </SidebarTooltipProvider>
    );
}

