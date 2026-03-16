"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLayoutStore, NavigationContext } from "@/stores/layout-store";
import { usePathname, useRouter } from "@/i18n/routing";
import { useRouter as useNextRouter } from "next/navigation";
import { SidebarContextButton, SidebarBrandButton, SidebarNavButton, SidebarNotificationsButton, SidebarAdminButton } from "./buttons";
import { HeaderOrgSelector } from "@/components/layout/dashboard/shared/header-org-selector";
import { SidebarProjectSelector } from "./sidebar-project-selector";
import { SidebarAccordionGroups } from "./sidebar-accordion";
import { SidebarPlanButton } from "./plan-button";
import { getPlanAccentVars } from "@/components/shared/plan-badge";
import { useOrganization } from "@/stores/organization-store";
import { SidebarInstallButton } from "./install-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarCommandBarTrigger } from "@/components/layout/dashboard/shared/command-bar";
import { HeaderAvatarButton } from "@/components/layout/dashboard/shared/header-avatar-button";
import {
    ArrowLeft,
    Building,
    EyeOff,
    Bell,
    CalendarDays,
    Users,
    ClipboardList,
    LayoutDashboard,
    UserCircle,
    Shield,
    CreditCard,
    Settings as SettingsIcon,
    Sliders,
} from "lucide-react";
import { useSidebarNavigation, contextRoutes, type NavItem, type NavSubItem } from "@/hooks/use-sidebar-navigation";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Lock, Medal } from "lucide-react";
import { useAccessContextStore, useIsDualAccess, useAccessMode } from "@/stores/access-context-store";
import { EXTERNAL_ACTOR_TYPE_LABELS } from "@/features/external-actors/types";

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
    const { activeContext, actions } = useLayoutStore();
    const { contexts, contextRoutes, getNavItems, getNavGroups } = useSidebarNavigation();
    const { planSlug } = useOrganization();
    const planAccentVars = React.useMemo(() => getPlanAccentVars(planSlug), [planSlug]);

    // Access mode
    const isDualAccess = useIsDualAccess();
    const accessMode = useAccessMode();
    const switchMode = useAccessContextStore((s) => s.switchMode);
    const externalActorType = useAccessContextStore((s) => s.externalActorType);



    const isMobile = mode === "mobile";
    const isExpanded = propIsExpanded ?? isMobile;

    // Drill-down state: "home" or a specific context
    const [drillState, setDrillState] = React.useState<DrillDownState>(() => {
        return "home";
    });

    // Page-level drill-down: when a NavItem has children, we track it here
    const [pageSubItems, setPageSubItems] = React.useState<{
        parentTitle: string;
        parentHref: string;
        parentIcon: React.ElementType;
        children: NavSubItem[];
    } | null>(null);

    // EFFECT: Sync drillState with activeContext
    React.useEffect(() => {
        if (activeContext && activeContext !== drillState) {
            setDrillState(activeContext);
        }
    }, [activeContext]);

    // EFFECT: Auto-detect page sub-items from URL
    React.useEffect(() => {
        if (drillState !== 'organization') return;
        const groups = getNavGroups('organization');
        for (const group of groups) {
            for (const item of group.items) {
                if (item.children && item.children.length > 0) {
                    // Check if current pathname matches any child href OR is a sub-route of the parent
                    const isOnParent = pathname === item.href;
                    const isOnChild = item.children.some(child => pathname === child.href);
                    const isOnDynamicChild = pathname.startsWith(item.href + '/');
                    if (isOnParent || isOnChild || isOnDynamicChild) {
                        // Only set if not already showing these sub-items
                        if (!pageSubItems || pageSubItems.parentHref !== item.href) {
                            setPageSubItems({
                                parentTitle: item.title,
                                parentHref: item.href,
                                parentIcon: item.icon,
                                children: item.children,
                            });
                        }
                        return;
                    }
                }
            }
        }
        // If URL doesn't match any page with children, clear sub-items
        if (pageSubItems) {
            setPageSubItems(null);
        }
    }, [pathname, drillState]);


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

        // Profile Context — MUST be before organization to avoid /profile/organizations matching /organization
        if (pathname.includes('/profile')) {
            if (activeContext !== 'profile') actions.setActiveContext('profile');
            return;
        }

        // Organization Context (must be after project and profile checks)
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

    // Handle drill into page sub-items
    const handlePageDrillIn = (item: NavItem) => {
        if (item.children && item.children.length > 0) {
            setSlideDirection("right");
            setPageSubItems({
                parentTitle: item.title,
                parentHref: item.href,
                parentIcon: item.icon,
                children: item.children,
            });
            // Navigate to the parent page
            router.push(item.href as any);
        }
    };

    // Handle back from page sub-items
    const handlePageDrillBack = () => {
        setSlideDirection("left");
        setPageSubItems(null);
    };

    // Unified Render Helper for Nav Items (Sub-items)
    const renderNavItem = (item: any, idx: number) => {
        const status = item.status;
        const isDisabled = item.disabled;
        const isHidden = item.hidden;
        const hasChildren = item.children && item.children.length > 0;

        // Badge — chevron for items with children, or status badge
        let badge = null;
        if (hasChildren && isExpanded) {
            badge = (
                <div className="h-5 w-5 flex items-center justify-center">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            );
        } else if (isHidden) {
            badge = (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center bg-gray-500/10 hover:bg-gray-500/20 shadow-none">
                    <EyeOff className="h-3 w-3 text-gray-500" />
                </Badge>
            );
        } else if (status === 'maintenance') {
            badge = (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center bg-semantic-warning/10 hover:bg-semantic-warning/20 shadow-none">
                    <Lock className="h-3 w-3 text-semantic-warning" />
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

        // Check if this item or any of its children is active
        const isItemActive = hasChildren
            ? (pathname === item.href || item.children.some((c: NavSubItem) => pathname === c.href) || pathname.startsWith(item.href + '/'))
            : pathname === item.href;

        const button = (
            <React.Fragment key={idx}>
                <SidebarNavButton
                    icon={item.icon}
                    label={item.title}
                    href={hasChildren ? undefined : item.href}
                    isActive={isItemActive}
                    isExpanded={isExpanded}
                    onClick={hasChildren ? () => handlePageDrillIn(item) : onLinkClick}
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
                    "flex flex-col h-full py-2 bg-sidebar transition-all duration-150 ease-in-out relative",
                    widthClass
                )}
                style={planAccentVars as React.CSSProperties}
            >


                <div className="flex flex-col w-full h-full overflow-hidden">
                    {drillState === "home" || drillState === "profile" ? (
                        <div className="w-full flex items-center gap-1.5 mb-2 px-2">
                            <div className="flex-1 min-w-0">
                                <SidebarBrandButton isExpanded={isExpanded} />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full px-2 mb-1 mt-1">
                            <SidebarProjectSelector isExpanded={isExpanded} />
                        </div>
                    )}

                    {/* Separator — hidden in profile mode (has its own after "Volver a la app") */}
                    {drillState !== "profile" && (
                        <div className="w-8 h-px bg-border/50 mb-2 mx-auto" />
                    )}

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
                                            <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center bg-semantic-warning/10 hover:bg-semantic-warning/20 shadow-none">
                                                <Lock className="h-3 w-3 text-semantic-warning" />
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
                        {drillState === "organization" && !pageSubItems && (
                            <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key="organization">

                                {/* Command Bar */}
                                <SidebarCommandBarTrigger isExpanded={isExpanded} />

                                {/* Spacer */}
                                <div className="h-1" />

                                {/* Visión General */}
                                <SidebarNavButton
                                    icon={LayoutDashboard}
                                    label="Visión General"
                                    href="/organization"
                                    isActive={pathname === '/organization'}
                                    isExpanded={isExpanded}
                                    onClick={onLinkClick}
                                />

                                <SidebarNavButton
                                    icon={CalendarDays}
                                    label="Planificador"
                                    href="/organization/planner"
                                    isActive={pathname === '/organization/planner'}
                                    isExpanded={isExpanded}
                                    onClick={onLinkClick}
                                />

                                {/* Unified Nav Items with Accordion (exclude standalone 'principal' group) */}
                                <SidebarAccordionGroups
                                    groups={navGroups.filter(g => g.id !== 'principal')}
                                    renderItem={renderNavItem}
                                    isExpanded={isExpanded}
                                    activePath={pathname}
                                />
                            </nav>
                        )}

                        {/* ============================================================ */}
                        {/* PAGE SUB-ITEMS STATE: Drill-down into a page's children */}
                        {/* ============================================================ */}
                        {drillState === "organization" && pageSubItems && (
                            <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key={`page-${pageSubItems.parentHref}`}>
                                {/* Back button */}
                                <SidebarNavButton
                                    icon={ArrowLeft}
                                    label={pageSubItems.parentTitle}
                                    isActive={false}
                                    isExpanded={isExpanded}
                                    onClick={handlePageDrillBack}
                                />

                                {/* Separator */}
                                <div className="w-8 h-px bg-border/50 my-1 mx-auto" />

                                {/* Sub-items */}
                                {pageSubItems.children.map((child, idx) => (
                                    <SidebarNavButton
                                        key={idx}
                                        icon={child.icon || pageSubItems.parentIcon}
                                        label={child.title}
                                        href={child.href as any}
                                        isActive={pathname === child.href}
                                        isExpanded={isExpanded}
                                        onClick={onLinkClick}
                                    />
                                ))}
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

                        {/* ADMIN STATE — Accordion groups identical to organization */}
                        {drillState === "admin" && (
                            <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key="admin">

                                {/* Visión General */}
                                <SidebarNavButton
                                    icon={LayoutDashboard}
                                    label="Visión General"
                                    href="/admin"
                                    isActive={pathname === '/admin'}
                                    isExpanded={isExpanded}
                                    onClick={onLinkClick}
                                />

                                {/* Admin Nav Groups with Accordion (exclude standalone 'principal' group) */}
                                <SidebarAccordionGroups
                                    groups={getNavGroups('admin').filter(g => g.id !== 'principal')}
                                    renderItem={renderNavItem}
                                    isExpanded={isExpanded}
                                    activePath={pathname}
                                />
                            </nav>
                        )}

                        {/* ============================================================ */}
                        {/* PROFILE STATE: Independent sidebar (Linear-style) */}
                        {/* ============================================================ */}
                        {drillState === "profile" && (
                            <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key="profile">
                                {/* Back to app */}
                                <SidebarNavButton
                                    icon={ArrowLeft}
                                    label="Volver a la app"
                                    isActive={false}
                                    isExpanded={isExpanded}
                                    onClick={() => {
                                        const prevPath = useLayoutStore.getState().previousPath;
                                        setSlideDirection("left");
                                        setDrillState("organization");
                                        actions.setActiveContext("organization");
                                        router.push((prevPath || '/organization') as any);
                                    }}
                                />

                                {/* Separator */}
                                <div className="w-8 h-px bg-border/50 my-1 mx-auto" />

                                {/* CUENTA group label */}
                                {isExpanded && (
                                    <div className="px-3 py-1.5">
                                        <span className="text-[11px] font-semibold uppercase text-muted-foreground/60">Cuenta</span>
                                    </div>
                                )}
                                <SidebarNavButton
                                    icon={UserCircle}
                                    label="Perfil"
                                    href="/profile"
                                    isActive={pathname === '/profile'}
                                    isExpanded={isExpanded}
                                    onClick={onLinkClick}
                                />
                                <SidebarNavButton
                                    icon={Building}
                                    label="Organizaciones"
                                    href="/profile/organizations"
                                    isActive={pathname === '/profile/organizations'}
                                    isExpanded={isExpanded}
                                    onClick={onLinkClick}
                                />
                                <SidebarNavButton
                                    icon={Shield}
                                    label="Seguridad"
                                    href="/profile/security"
                                    isActive={pathname === '/profile/security'}
                                    isExpanded={isExpanded}
                                    onClick={onLinkClick}
                                />

                                {/* FACTURACIÓN group label */}
                                {isExpanded && (
                                    <div className="px-3 py-1.5 mt-2">
                                        <span className="text-[11px] font-semibold uppercase text-muted-foreground/60">Facturación</span>
                                    </div>
                                )}
                                <SidebarNavButton
                                    icon={CreditCard}
                                    label="Facturación"
                                    href="/profile/billing"
                                    isActive={pathname === '/profile/billing'}
                                    isExpanded={isExpanded}
                                    onClick={onLinkClick}
                                />

                                {/* PREFERENCIAS group label */}
                                {isExpanded && (
                                    <div className="px-3 py-1.5 mt-2">
                                        <span className="text-[11px] font-semibold uppercase text-muted-foreground/60">Preferencias</span>
                                    </div>
                                )}
                                <SidebarNavButton
                                    icon={Bell}
                                    label="Notificaciones"
                                    href="/profile/notifications"
                                    isActive={pathname === '/profile/notifications'}
                                    isExpanded={isExpanded}
                                    onClick={onLinkClick}
                                />
                                <SidebarNavButton
                                    icon={Sliders}
                                    label="Preferencias"
                                    href="/profile/preferences"
                                    isActive={pathname === '/profile/preferences'}
                                    isExpanded={isExpanded}
                                    onClick={onLinkClick}
                                />
                            </nav>
                        )}
                    </ScrollArea>

                    {/* PWA Install prompt */}
                    {!isMobile && (
                        <div className="mt-auto px-2 pb-2">
                            <SidebarInstallButton isExpanded={isExpanded} />
                        </div>
                    )}

                    {/* Admin, Hub & System Toggle (bottom, desktop only) */}
                    {!isMobile && drillState !== 'profile' && (
                        <div className="px-2 pb-3 space-y-2 mt-2">
                            {/* Admin Button (only visible to admins) */}
                            <SidebarAdminButton isExpanded={isExpanded} />

                            {/* Navigation Out/Back — Below Admin */}
                            <div className={cn("space-y-1", slideClass)}>
                                {/* Back to Workspace — only in admin context */}
                                {drillState === "admin" && (
                                    <SidebarNavButton
                                        icon={ArrowLeft}
                                        label="Espacio de Trabajo"
                                        href={"/organization" as any}
                                        isActive={false}
                                        isExpanded={isExpanded}
                                        onClick={onLinkClick}
                                    />
                                )}

                                {/* Hub Button — visible when NOT already in hub */}
                                {drillState !== "home" && (
                                    <SidebarNavButton
                                        icon={ArrowLeft}
                                        label="Volver al Hub"
                                        href={"/hub" as any}
                                        isActive={false}
                                        isExpanded={isExpanded}
                                        onClick={onLinkClick}
                                    />
                                )}
                            </div>

                            {/* Access Mode Selector — only when user has dual access */}
                            {isDualAccess && isExpanded && (
                                <div
                                    className="rounded-lg bg-sidebar-accent/30 border border-sidebar-border/40 p-1 space-y-0.5"
                                >
                                    <button
                                        onClick={() => {
                                            switchMode("member");
                                            router.push("/organization" as any);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all duration-150 cursor-pointer",
                                            accessMode === "member"
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        )}
                                    >
                                        <Building className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">Miembro</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            switchMode("external");
                                            // Navigate to the external actor overview
                                            if (externalActorType === "client") {
                                                router.push("/organization/external/client" as any);
                                            }
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all duration-150 cursor-pointer",
                                            accessMode === "external"
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        )}
                                    >
                                        <UserCircle className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">
                                            {externalActorType
                                                ? EXTERNAL_ACTOR_TYPE_LABELS[externalActorType]
                                                : "Externo"}
                                        </span>
                                    </button>
                                </div>
                            )}

                            {/* Access Mode Selector — collapsed sidebar (icon only) */}
                            {isDualAccess && !isExpanded && (
                                <SidebarTooltip
                                    label={accessMode === "member" ? "Cambiar a modo externo" : "Cambiar a modo miembro"}
                                    isExpanded={false}
                                >
                                    <button
                                        onClick={() => {
                                            const newMode = accessMode === "member" ? "external" : "member";
                                            switchMode(newMode);
                                            if (newMode === "external" && externalActorType === "client") {
                                                router.push("/organization/external/client" as any);
                                            } else {
                                                router.push("/organization" as any);
                                            }
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-center h-8 rounded-lg transition-all duration-150",
                                            "text-muted-foreground hover:text-foreground hover:bg-secondary/80 cursor-pointer"
                                        )}
                                    >
                                        {accessMode === "member"
                                            ? <UserCircle className="h-4 w-4" />
                                            : <Building className="h-4 w-4" />
                                        }
                                    </button>
                                </SidebarTooltip>
                            )}

                            {/* Plan Badge — deshabilitado temporalmente */}
                            {/* <SidebarPlanButton isExpanded={isExpanded} /> */}

                            {/* Organization Selector + User + Notifications */}
                            <div className="flex flex-col gap-1.5 pt-3 mt-1 border-t border-sidebar-border/50">
                                {drillState !== "home" && (
                                    <div className="w-full">
                                        <HeaderOrgSelector
                                            variant="sidebar"
                                            isExpanded={isExpanded}
                                        />
                                    </div>
                                )}
                                
                                <div className={cn(
                                    "flex items-stretch gap-1.5",
                                    isExpanded ? "justify-between" : "justify-center flex-col"
                                )}>
                                    <div className="flex-1 min-w-0">
                                        <HeaderAvatarButton variant={isExpanded ? "sidebar" : "sidebar-collapsed"} />
                                    </div>
                                    <SidebarNotificationsButton
                                        isExpanded={false}
                                        variant="quick-access"
                                        className={isExpanded ? "w-11 h-auto rounded-xl" : ""}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SidebarTooltipProvider>
    );
}

