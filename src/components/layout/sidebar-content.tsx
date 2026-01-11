"use client";

import * as React from "react"
import { cn } from "@/lib/utils";
import { useLayoutStore, NavigationContext, useActiveProjectId } from "@/store/layout-store";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    LayoutDashboard,
    Building,
    Briefcase,
    Wallet,
    GraduationCap,
    Users,
    Settings,
    FileText,
    CreditCard,
    PieChart,
    Hammer,
    HardHat,
    Video,
    MessageSquare,
    Calendar,
    BookOpen,
    Monitor,
    PanelLeft,
    PanelLeftOpen,
    PanelLeftClose,
    Info,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
}

// ============================================================================
// ENVIRONMENTS RAIL (Left column - always 60px, icons only)
// ============================================================================

interface EnvironmentsRailProps {
    hoveredContext: NavigationContext | null;
    onHoverContext: (ctx: NavigationContext | null) => void;
    onLinkClick?: () => void;
}

const contexts: { id: NavigationContext; label: string; icon: React.ElementType }[] = [
    { id: 'organization', label: 'Organización', icon: Building },
    { id: 'project', label: 'Proyecto', icon: Briefcase },
    { id: 'learnings', label: 'Aprendizajes', icon: GraduationCap },
    { id: 'community', label: 'Comunidad', icon: Users },
    { id: 'admin', label: 'Admin', icon: Hammer },
];

const contextRoutes: Record<NavigationContext, string> = {
    organization: '/organization',
    project: '/organization/projects',
    learnings: '/learnings',
    community: '/organization',
    admin: '/admin'
};

export function EnvironmentsRail({ hoveredContext, onHoverContext, onLinkClick }: EnvironmentsRailProps) {
    const { activeContext, actions } = useLayoutStore();
    const activeProjectId = useActiveProjectId();
    const router = useRouter();

    const handleContextClick = (ctx: NavigationContext) => {
        actions.setActiveContext(ctx);
        if (onLinkClick) onLinkClick();

        if (ctx === 'project') {
            const currentProjectId = useLayoutStore.getState().activeProjectId;
            if (currentProjectId) {
                router.push(`/project/${currentProjectId}` as any);
                return;
            }
            router.push('/organization/projects' as any);
            return;
        }

        const route = contextRoutes[ctx];
        if (route) {
            router.push(route as any);
        }
    };

    return (
        <div className="flex flex-col h-full items-center py-4 w-[60px] shrink-0 border-r border-border/50">
            <TooltipProvider delayDuration={0}>
                <nav className="flex flex-col items-center gap-2 flex-1">
                    {contexts.map((ctx) => {
                        const isActive = activeContext === ctx.id;
                        const isHovered = hoveredContext === ctx.id;

                        return (
                            <Tooltip key={ctx.id}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-10 w-10 rounded-xl",
                                            isActive
                                                ? "bg-primary/10 text-primary shadow-sm"
                                                : isHovered
                                                    ? "bg-secondary text-foreground"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        )}
                                        onClick={() => handleContextClick(ctx.id)}
                                        onMouseEnter={() => onHoverContext(ctx.id)}
                                    >
                                        <ctx.icon className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={8}>
                                    {ctx.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>
            </TooltipProvider>
        </div>
    );
}

// ============================================================================
// PAGES PANEL (Right column - follows sidebar modes)
// ============================================================================

interface PagesPanelProps {
    context: NavigationContext;
    isHovered: boolean;
    onLinkClick?: () => void;
    mode?: "desktop" | "mobile";
}

export function PagesPanel({ context, isHovered, onLinkClick, mode = "desktop" }: PagesPanelProps) {
    const pathname = usePathname();
    const { sidebarMode, actions } = useLayoutStore();
    const activeProjectId = useActiveProjectId();
    const tMega = useTranslations('MegaMenu');

    const isMobile = mode === "mobile";

    // Panel expansion logic - applies sidebarMode to this panel
    const isExpanded = isMobile ||
        sidebarMode === 'docked' ||
        (sidebarMode === 'expanded_hover' && isHovered);

    // Tooltips only when collapsed
    const showTooltips = !isMobile && !isExpanded && sidebarMode === 'collapsed';

    const getNavItems = (ctx: NavigationContext): NavItem[] => {
        switch (ctx) {
            case 'organization':
                return [
                    { title: tMega('Organization.items.overview'), href: '/organization', icon: LayoutDashboard },
                    { title: tMega('Organization.items.identity'), href: '/organization/identity', icon: Building },
                    { title: 'Proyectos', href: '/organization/projects', icon: Briefcase },
                    { title: 'Contactos', href: '/organization/contacts', icon: Users },
                    { title: 'Finanzas', href: '/organization/finance', icon: Wallet },
                    { title: 'Gastos Generales', href: '/organization/general-costs', icon: CreditCard },
                    { title: 'Configuración', href: '/organization/settings', icon: Settings },
                ];
            case 'project':
                const projectBase = activeProjectId
                    ? `/project/${activeProjectId}`
                    : '/organization/projects';

                return [
                    {
                        title: activeProjectId ? 'Visión General' : 'Seleccionar Proyecto',
                        href: projectBase,
                        icon: LayoutDashboard
                    },
                    {
                        title: 'Información',
                        href: activeProjectId ? `${projectBase}/details` : '/organization/projects',
                        icon: Info
                    },
                    { title: 'Archivos', href: `${projectBase}/files`, icon: FileText },
                    { title: 'Documentación', href: `${projectBase}/docs`, icon: BookOpen },
                    { title: 'Construcción', href: `${projectBase}/construction`, icon: HardHat },
                    { title: 'Volver a la Lista', href: '/organization/projects', icon: Briefcase },
                ];
            case 'learnings':
                return [
                    { title: 'Visión General', href: '/learnings', icon: LayoutDashboard },
                    { title: 'Cursos', href: '/learnings/courses', icon: Video },
                    { title: 'Documentación', href: '/learnings/docs', icon: BookOpen },
                ];
            case 'community':
                return [
                    { title: 'Foros', href: '/organization', icon: MessageSquare },
                    { title: 'Eventos', href: '/organization', icon: Calendar },
                ];
            case 'admin':
                return [
                    { title: 'Visión General', href: '/admin', icon: LayoutDashboard },
                    { title: 'Directorio', href: '/admin/directory', icon: Users },
                    { title: 'Finanzas', href: '/admin/finance', icon: Wallet },
                    { title: 'Actividad', href: '/admin/audit-logs', icon: FileText },
                    { title: 'Plataforma', href: '/admin/system', icon: Monitor },
                    { title: 'Configuración', href: '/admin/settings', icon: Settings },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems(context);

    const cycleSidebarMode = () => {
        if (sidebarMode === 'collapsed') actions.setSidebarMode('expanded_hover');
        else if (sidebarMode === 'expanded_hover') actions.setSidebarMode('docked');
        else actions.setSidebarMode('collapsed');
    };

    const getModeIcon = () => {
        if (sidebarMode === 'collapsed') return PanelLeft;
        if (sidebarMode === 'expanded_hover') return PanelLeftOpen;
        return PanelLeftClose;
    };

    const getModeLabel = () => {
        if (sidebarMode === 'collapsed') return "Expandir al pasar el mouse";
        if (sidebarMode === 'expanded_hover') return "Fijar Barra Lateral";
        return "Colapsar Barra Lateral";
    };

    const ConditionalTooltip = ({ children, title }: { children: React.ReactNode; title: string }) => {
        if (!showTooltips) return <>{children}</>;
        return (
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent side="right">{title}</TooltipContent>
            </Tooltip>
        );
    };

    // Find context label for header
    const currentContextLabel = contexts.find(c => c.id === context)?.label || context;

    return (
        <div
            className={cn(
                "flex flex-col h-full py-4 overflow-hidden",
                isExpanded ? "w-[180px]" : "w-[60px]"
            )}
        >
            {/* Context Title (only when expanded) */}
            <div className={cn(
                "px-3 mb-2",
                isExpanded ? "opacity-100" : "opacity-0"
            )}>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {currentContextLabel}
                </span>
            </div>

            {/* Navigation Items */}
            <ScrollArea className="flex-1 px-2" type="scroll">
                <nav className="flex flex-col gap-1">
                    <TooltipProvider delayDuration={0}>
                        {navItems.map((item, index) => (
                            <ConditionalTooltip key={index} title={item.title}>
                                <div>
                                    <Button
                                        asChild
                                        variant={pathname === item.href ? "secondary" : "ghost"}
                                        size="default"
                                        className={cn(
                                            "h-9 rounded-lg w-full px-2.5", // Fixed horizontal padding
                                            "justify-start", // Always start aligned
                                            pathname === item.href
                                                ? "bg-secondary text-foreground shadow-sm hover:bg-secondary/80"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        )}
                                        onClick={() => {
                                            if (onLinkClick) onLinkClick();
                                        }}
                                    >
                                        <Link href={item.href as any} className="flex items-center w-full"> {/* Ensure Link takes full width */}
                                            <item.icon className="h-4 w-4 shrink-0" /> {/* Icon size fixed */}
                                            <span
                                                className={cn(
                                                    "font-medium text-sm truncate overflow-hidden whitespace-nowrap",
                                                    isExpanded ? "w-auto opacity-100 ml-2" : "w-0 opacity-0 ml-0"
                                                )}
                                            >
                                                {item.title}
                                            </span>
                                        </Link>
                                    </Button>
                                </div>
                            </ConditionalTooltip>
                        ))}
                    </TooltipProvider>
                </nav>
            </ScrollArea>

            {/* Mode Toggle (bottom, desktop only) */}
            {!isMobile && (
                <div className="mt-auto px-2 pt-2">
                    <TooltipProvider delayDuration={0}>
                        <ConditionalTooltip title={getModeLabel()}>
                            <Button
                                variant="ghost"
                                size="default"
                                className={cn(
                                    "h-9 rounded-lg text-muted-foreground hover:text-foreground w-full px-2.5", // Fixed padding
                                    "justify-start" // Always start aligned
                                )}
                                onClick={cycleSidebarMode}
                            >
                                {React.createElement(getModeIcon(), { className: "h-4 w-4 shrink-0" })}
                                <span
                                    className={cn(
                                        "font-medium text-sm truncate overflow-hidden whitespace-nowrap",
                                        isExpanded ? "w-auto opacity-100 ml-2" : "w-0 opacity-0 ml-0"
                                    )}
                                >
                                    {getModeLabel()}
                                </span>
                            </Button>
                        </ConditionalTooltip>
                    </TooltipProvider>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// LEGACY EXPORT: SidebarContent (for mobile sheet compatibility)
// Mobile still uses single-column layout
// ============================================================================

interface SidebarContentProps {
    isHovered?: boolean;
    onLinkClick?: () => void;
    mode?: "desktop" | "mobile";
}

export function SidebarContent({ isHovered = false, onLinkClick, mode = "desktop" }: SidebarContentProps) {
    const { activeContext } = useLayoutStore();
    const [hoveredContext, setHoveredContext] = React.useState<NavigationContext | null>(null);

    // For mobile mode, just show full single-column view with active context
    if (mode === "mobile") {
        return (
            <div className="flex flex-col h-full">
                <PagesPanel
                    context={activeContext}
                    isHovered={true}
                    onLinkClick={onLinkClick}
                    mode="mobile"
                />
            </div>
        );
    }

    // Desktop: dual-column layout
    const displayContext = hoveredContext || activeContext;

    return (
        <div
            className="flex h-full"
            onMouseLeave={() => setHoveredContext(null)}
        >
            <EnvironmentsRail
                hoveredContext={hoveredContext}
                onHoverContext={setHoveredContext}
                onLinkClick={onLinkClick}
            />
            <PagesPanel
                context={displayContext}
                isHovered={isHovered}
                onLinkClick={onLinkClick}
            />
        </div>
    );
}
