"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLayoutStore, NavigationContext, usePendingPathname, useActiveWorkspaceSection } from "@/stores/layout-store";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useRouter as useNextRouter } from "next/navigation";
import { SidebarNavButton } from "./sidebar-button";
import { SidebarProjectSelector } from "./sidebar-project-selector";
import { SidebarAccordionGroups } from "./sidebar-accordion";
import { SidebarInstallButton } from "./install-button";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
    ArrowLeft,
    Building,
    EyeOff,
    CalendarDays,
    Clock,
    Wrench,
    Users,
    ClipboardList,
    LayoutDashboard,
    UserCircle,
    Shield,
    CreditCard,
    Compass,
    Settings as SettingsIcon,
    Sliders,
    GraduationCap,
    Sparkles,
    Package,
    HardHat,
    BookOpen,
    DollarSign,
} from "lucide-react";
import { useSidebarNavigation, contextRoutes, type NavItem, type NavSubItem } from "@/hooks/use-sidebar-navigation";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Lock, Medal } from "lucide-react";
import { useAccessContextStore, useIsDualAccess, useAccessMode, useViewingAs } from "@/stores/access-context-store";
import { EXTERNAL_ACTOR_TYPE_LABELS } from "@/features/external-actors/types";

import { SidebarTooltipProvider, SidebarTooltip, type SidebarRestriction } from "./sidebar-tooltip";

// ============================================================================
// SIDEBAR CONTENT — Detail panel for the active context
// ============================================================================
// Renders the navigation items for the currently selected context from the
// Activity Bar. No more "home" state — that's handled by the Activity Bar.
// Always renders in expanded mode (isExpanded is always true now).
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

export function SidebarContent({
    onLinkClick,
    mode = "desktop",
    isExpanded: propIsExpanded,
    user
}: SidebarContentProps) {
    const pathname = usePathname();
    const pendingPathname = usePendingPathname();
    const router = useRouter();
    const nativeRouter = useNextRouter();
    const { activeContext, actions, previousPath } = useLayoutStore();
    const activeWorkspaceSection = useActiveWorkspaceSection();
    const { contexts, contextRoutes, getNavItems, getNavGroups } = useSidebarNavigation();

    // Optimistic pathname: use pending (set immediately on click) until real pathname catches up
    const effectivePathname = pendingPathname ?? pathname;

    // Clear pendingPathname once real navigation completes
    React.useEffect(() => {
        if (pendingPathname && pathname === pendingPathname) {
            actions.setPendingPathname(null);
        }
    }, [pathname, pendingPathname, actions]);

    // Access mode
    const isDualAccess = useIsDualAccess();
    const accessMode = useAccessMode();
    const switchMode = useAccessContextStore((s) => s.switchMode);
    const externalActorType = useAccessContextStore((s) => s.externalActorType);
    const viewingAs = useViewingAs();

    const isMobile = mode === "mobile";
    const isExpanded = propIsExpanded ?? true;

    // The active context determines what we show
    const drillState = activeContext;

    // Page-level drill-down: when a NavItem has children, we track it here
    const [pageSubItems, setPageSubItems] = React.useState<{
        parentTitle: string;
        parentHref: string;
        parentIcon: React.ElementType;
        children: NavSubItem[];
    } | null>(null);

    // EFFECT: Auto-detect page sub-items from URL (uses effectivePathname for instant response)
    React.useEffect(() => {
        if (drillState !== 'organization' && drillState !== 'admin') return;
        const ctx = drillState === 'admin' ? 'admin' : 'organization';
        const groups = getNavGroups(ctx);
        for (const group of groups) {
            for (const item of group.items) {
                if (item.children && item.children.length > 0) {
                    // Skip catalog drill-down when catalog section is active (items rendered flat)
                    if (activeWorkspaceSection === 'catalog' && item.href.includes('/catalog')) continue;
                    const isOnParent = effectivePathname === item.href;
                    const isOnChild = item.children.some(child => effectivePathname === child.href);
                    const isOnDynamicChild = effectivePathname.startsWith(item.href + '/');
                    if (isOnParent || isOnChild || isOnDynamicChild) {
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
    }, [effectivePathname, drillState, activeWorkspaceSection]);


    // Animation direction
    const [slideDirection, setSlideDirection] = React.useState<"left" | "right">("right");

    // URL-based synchronization logic (Context and Workspace Section) has been moved to SidebarLayout
    // so it executes reliably even when this component unmounts (e.g. Academy context where sidebar is hidden).

    // Get unified nav groups for accordion rendering
    const navGroups = getNavGroups("organization");

    // Find the single active nav item across the entire active context by longest matching prefix
    const deepestMatchHref = React.useMemo(() => {
        let longest = "";
        const groups = getNavGroups(
            drillState === 'admin' ? 'admin' : drillState === 'settings' ? 'settings' : 'organization'
        );
        for (const g of groups) {
            for (const item of g.items) {
                if (effectivePathname === item.href || effectivePathname.startsWith(item.href + '/')) {
                    if (item.href.length > longest.length) longest = item.href;
                }
                if (item.children) {
                    for (const child of item.children) {
                        if (effectivePathname === child.href || effectivePathname.startsWith(child.href + '/')) {
                            if (child.href.length > longest.length) longest = child.href;
                        }
                    }
                }
            }
        }
        if (drillState === 'organization' && activeWorkspaceSection === 'founders') {
            const items = getNavItems('founders');
            for (const item of items) {
                if (effectivePathname === item.href || effectivePathname.startsWith(item.href + '/')) {
                    if (item.href.length > longest.length) longest = item.href;
                }
            }
        }
        if (drillState === 'learnings' || drillState === 'discover') {
            const items = getNavItems(drillState);
            for (const item of items) {
                if (effectivePathname === item.href || effectivePathname.startsWith(item.href + '/')) {
                    if (item.href.length > longest.length) longest = item.href;
                }
            }
        }
        return longest || effectivePathname;
    }, [effectivePathname, drillState, getNavGroups, getNavItems]);

    // Handle drill into page sub-items — set pendingPathname for instant sidebar response
    const handlePageDrillIn = (item: NavItem) => {
        if (item.children && item.children.length > 0) {
            setSlideDirection("right");
            setPageSubItems({
                parentTitle: item.title,
                parentHref: item.href,
                parentIcon: item.icon,
                children: item.children,
            });
            actions.setPendingPathname(item.href);
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
        const isShadowMode = item.isShadowMode;
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
                    <Wrench className="h-3 w-3 text-semantic-warning" />
                </Badge>
            );
        } else if (status === 'coming_soon') {
            badge = (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center bg-blue-400/10 hover:bg-blue-400/20 shadow-none">
                    <Clock className="h-3 w-3 text-blue-400" />
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

        // Check if this item or any of its children is active based on the deepest matching prefix
        const isItemActive = hasChildren
            ? (deepestMatchHref === item.href || item.children.some((c: NavSubItem) => deepestMatchHref === c.href))
            : deepestMatchHref === item.href;

        const button = (
            <React.Fragment key={idx}>
                <SidebarNavButton
                    icon={item.icon}
                    label={item.title}
                    href={hasChildren ? undefined : item.href}
                    isActive={isItemActive}
                    isExpanded={isExpanded}
                    onClick={hasChildren ? () => handlePageDrillIn(item) : () => {
                        if (item.href) actions.setPendingPathname(item.href);
                        onLinkClick?.();
                    }}
                    badge={badge}
                    disabled={isDisabled}
                    status={status}
                    isShadowMode={isShadowMode}
                    hidden={isHidden}
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

    // Slide animation classes
    const slideClass = cn(
        "transition-transform duration-200 ease-out",
        slideDirection === "right" ? "animate-slide-in-right" : "animate-slide-in-left"
    );

    return (
        <SidebarTooltipProvider>
            <div className="flex flex-col h-full py-2 bg-sidebar transition-all duration-150 ease-in-out relative w-full">
                <div className="flex flex-col w-full h-full overflow-hidden">
                    {/* Universal Header: Context or Section Title */}
                    <div className="w-full px-2 mb-1">
                        {(() => {
                            let meta: { icon: React.ElementType; label: string; subtitle: string } | null = null;
                            if (drillState === 'organization') {
                                // "Viewing As" mode: show external portal label
                                if (viewingAs) {
                                    const actorLabel = EXTERNAL_ACTOR_TYPE_LABELS[viewingAs.actorType] || viewingAs.actorType;
                                    meta = { icon: EyeOff, label: `Portal ${actorLabel}`, subtitle: viewingAs.isSimulation ? 'Modo simulación' : `Viendo como ${viewingAs.userName}` };
                                } else {
                                    switch (activeWorkspaceSection) {
                                        case 'overview':
                                            meta = { icon: LayoutDashboard, label: 'General', subtitle: 'Gestión del espacio' }; break;
                                        case 'catalog':
                                            meta = { icon: BookOpen, label: 'Catálogo Técnico', subtitle: 'Recursos y tareas' }; break;
                                        case 'construction':
                                            meta = { icon: HardHat, label: 'Construcción', subtitle: 'Ejecución de obras' }; break;
                                        case 'finance':
                                            meta = { icon: DollarSign, label: 'Finanzas', subtitle: 'Control económico' }; break;
                                        case 'founders':
                                            meta = { icon: Medal, label: 'Fundadores', subtitle: 'Programa exclusivo' }; break;
                                    }
                                }
                            } else {
                                const contextMeta: Record<string, { icon: React.ElementType; label: string; subtitle: string }> = {
                                    learnings: { icon: GraduationCap, label: 'Academia', subtitle: 'Cursos y formación' },
                                    discover: { icon: Compass, label: 'Descubrir', subtitle: 'Explora y conecta' },
                                    admin: { icon: Shield, label: 'Administración', subtitle: 'Panel de control' },
                                    settings: { icon: SettingsIcon, label: 'Configuración', subtitle: 'Cuenta y organización' },
                                };
                                meta = contextMeta[drillState] || null;
                            }

                            if (!meta || !isExpanded) return null;
                            const Icon = meta.icon;
                            return (
                                <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 w-full">
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/10 shrink-0">
                                        <Icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                        <span className="text-sm font-semibold truncate w-full text-left leading-tight text-sidebar-foreground">
                                            {meta.label}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground leading-tight truncate w-full text-left">
                                            {meta.subtitle}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Separator */}
                    <div className="w-8 h-px bg-border/50 mb-2 mx-auto" />

                    <ScrollArea className="flex-1 min-h-0" type="scroll">
                        {/* Project Selector (for Organization context, except Catalog/Founders where it's not strictly needed or could stay) */}
                        {drillState === 'organization' && activeWorkspaceSection !== 'founders' && !viewingAs && (
                            <div className="w-full px-2 mb-2">
                                <SidebarProjectSelector isExpanded={isExpanded} />
                            </div>
                        )}

                        {/* ============================================================ */}
                        {/* ORGANIZATION STATE: Direct navigation buttons */}
                        {/* ============================================================ */}
                        {/* VIEWING AS MODE: Direct render of external nav groups */}
                        {drillState === "organization" && viewingAs && !pageSubItems && (
                            <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key="viewing-as">
                                {navGroups.flatMap(g => g.items).map((item, i) => renderNavItem(item, i))}
                            </nav>
                        )}

                        {drillState === "organization" && !viewingAs && !pageSubItems && (
                            <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key={`organization-${activeWorkspaceSection}`}>

                                {/* === GENERAL SECTION === */}
                                {activeWorkspaceSection === 'overview' && (
                                    <>
                                        {/* Visión General & Planificador */}
                                        {navGroups
                                            .filter(g => g.id === 'principal')
                                            .flatMap(g => g.items)
                                            .map((item, i) => renderNavItem(item, i))
                                        }

                                        {/* Gestión items (Proyectos, Archivos, Contactos — sin Catálogo Técnico) */}
                                        {navGroups
                                            .filter(g => g.id === 'gestion')
                                            .flatMap(g => g.items)
                                            .filter(item => !item.href.includes('/catalog'))
                                            .map((item, i) => renderNavItem(item, i))
                                        }
                                    </>
                                )}

                                {/* === CATALOG SECTION === */}
                                {activeWorkspaceSection === 'catalog' && (
                                    <>
                                        {[
                                            { title: 'Visión General', href: '/organization/catalog', icon: LayoutDashboard },
                                            { title: 'Tareas', href: '/organization/catalog/tasks', icon: ClipboardList },
                                            { title: 'Materiales', href: '/organization/catalog/materials', icon: Package },
                                            { title: 'Mano de Obra', href: '/organization/catalog/labor', icon: HardHat },
                                        ].map((item) => (
                                            <SidebarNavButton
                                                key={item.href}
                                                icon={item.icon}
                                                label={item.title}
                                                href={item.href}
                                                isActive={deepestMatchHref === item.href}
                                                isExpanded={isExpanded}
                                                onClick={() => {
                                                    actions.setPendingPathname(item.href);
                                                    onLinkClick?.();
                                                }}
                                            />
                                        ))}
                                    </>
                                )}

                                {/* === CONSTRUCTION SECTION === */}
                                {activeWorkspaceSection === 'construction' && (
                                    <>
                                        {navGroups
                                            .filter(g => g.id === 'construccion')
                                            .flatMap(g => g.items)
                                            .map((item, i) => renderNavItem(item, i))
                                        }
                                    </>
                                )}

                                {/* === FINANCE SECTION === */}
                                {activeWorkspaceSection === 'finance' && (
                                    <>
                                        {navGroups
                                            .filter(g => g.id === 'finanzas')
                                            .flatMap(g => g.items)
                                            .map((item, i) => renderNavItem(item, i))
                                        }
                                    </>
                                )}

                                {/* === FOUNDERS SECTION === */}
                                {activeWorkspaceSection === 'founders' && (
                                    <>
                                        {getNavItems("founders").map((item, i) => renderNavItem(item, i))}
                                    </>
                                )}
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
                                        isActive={deepestMatchHref === child.href}
                                        isExpanded={isExpanded}
                                        onClick={() => {
                                            actions.setPendingPathname(child.href);
                                            onLinkClick?.();
                                        }}
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
                                        isActive={deepestMatchHref === item.href}
                                        isExpanded={isExpanded}
                                        onClick={() => {
                                            actions.setPendingPathname(item.href);
                                            onLinkClick?.();
                                        }}
                                    />
                                ))}
                            </nav>
                        )}



                        {/* DISCOVER STATE */}
                        {drillState === "discover" && (
                            <nav className={cn("flex flex-col gap-2 px-2", slideClass)} key="discover">
                                {getNavItems("discover").map(renderNavItem)}
                            </nav>
                        )}

                        {/* ADMIN STATE — Accordion groups */}
                        {drillState === "admin" && !pageSubItems && (
                            <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key="admin">

                                {/* Visión General */}
                                <SidebarNavButton
                                    icon={LayoutDashboard}
                                    label="Visión General"
                                    href="/admin"
                                    isActive={deepestMatchHref === '/admin'}
                                    isExpanded={isExpanded}
                                    onClick={() => {
                                        actions.setPendingPathname('/admin');
                                        onLinkClick?.();
                                    }}
                                />

                                {/* Admin Nav Groups with Accordion */}
                                <SidebarAccordionGroups
                                    groups={getNavGroups('admin').filter(g => g.id !== 'principal')}
                                    renderItem={renderNavItem}
                                    isExpanded={isExpanded}
                                    activePath={deepestMatchHref}
                                    flat
                                />
                            </nav>
                        )}

                        {/* ADMIN PAGE SUB-ITEMS STATE: Drill-down into admin page children */}
                        {drillState === "admin" && pageSubItems && (
                            <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key={`admin-page-${pageSubItems.parentHref}`}>
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
                                        isActive={deepestMatchHref === child.href}
                                        isExpanded={isExpanded}
                                        onClick={() => {
                                            actions.setPendingPathname(child.href);
                                            onLinkClick?.();
                                        }}
                                    />
                                ))}
                            </nav>
                        )}

                        {/* ============================================================ */}
                        {/* SETTINGS STATE: Independent sidebar (Linear-style) */}
                        {/* ============================================================ */}
                        {drillState === "settings" && (
                            <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key="settings">
                                {/* Settings Nav Groups with Accordion */}
                                <SidebarAccordionGroups
                                    groups={getNavGroups('settings')}
                                    renderItem={renderNavItem}
                                    isExpanded={isExpanded}
                                    activePath={deepestMatchHref}
                                    flat
                                />
                            </nav>
                        )}
                    </ScrollArea>

                    {/* PWA Install prompt */}
                    {!isMobile && (
                        <div className="mt-auto px-2 pb-1 shrink-0">
                            <SidebarInstallButton isExpanded={isExpanded} />
                        </div>
                    )}


                    {/* Access Mode Selector — only when user has dual access */}
                    {!isMobile && drillState === 'organization' && isDualAccess && (
                        <div className="px-2 pb-2 shrink-0">
                            <div className="rounded-lg bg-sidebar-accent/30 border border-sidebar-border/40 p-1 space-y-0.5">
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
                        </div>
                    )}
                </div>
            </div>
        </SidebarTooltipProvider>
    );
}
