"use client";

import * as React from "react"
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useLayoutStore, NavigationContext, useActiveProjectId } from "@/store/layout-store";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
}

interface SidebarContentProps {
    isHovered?: boolean;
    onLinkClick?: () => void;
    mode?: "desktop" | "mobile";
}

export function SidebarContent({ isHovered = false, onLinkClick, mode = "desktop" }: SidebarContentProps) {
    const pathname = usePathname();
    const { activeContext, sidebarMode, actions } = useLayoutStore();
    const activeProjectId = useActiveProjectId();
    const tMega = useTranslations('MegaMenu');
    const router = useRouter();

    // Track if the dropdown is open (only relevant for desktop hover logic really)
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

    // Mobile is always "expanded" visually
    const isMobile = mode === "mobile";

    const isExpanded = isMobile ||
        sidebarMode === 'docked' ||
        (sidebarMode === 'expanded_hover' && (isHovered || isDropdownOpen));

    const contexts: { id: NavigationContext; label: string; icon: React.ElementType }[] = [
        { id: 'organization', label: 'Organización', icon: Building },
        { id: 'project', label: 'Proyecto', icon: Briefcase },
        { id: 'finance', label: 'Finanzas', icon: Wallet },
        { id: 'learnings', label: 'Aprendizajes', icon: GraduationCap },
        { id: 'community', label: 'Comunidad', icon: Users },
        { id: 'admin', label: 'Admin', icon: Hammer },
    ];

    const currentContext = contexts.find(c => c.id === activeContext) || contexts[0];

    const contextRoutes: Record<NavigationContext, string> = {
        organization: '/organization',
        project: '/organization/projects',
        finance: '/finance',
        learnings: '/learnings',
        community: '/organization',
        admin: '/admin'
    };

    const getNavItems = (context: NavigationContext): NavItem[] => {
        switch (context) {
            case 'organization':
                return [
                    { title: tMega('Organization.items.overview'), href: '/organization', icon: LayoutDashboard },
                    { title: tMega('Organization.items.identity'), href: '/organization/identity', icon: Building },
                    { title: 'Proyectos', href: '/organization/projects', icon: Briefcase },
                    { title: 'Contactos', href: '/organization/contacts', icon: Users },
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
            case 'finance':
                return [
                    { title: 'Visión General', href: '/finance', icon: LayoutDashboard },
                    { title: 'Facturas', href: '/finance', icon: FileText },
                    { title: 'Gastos', href: '/finance', icon: CreditCard },
                    { title: 'Impuestos', href: '/finance', icon: PieChart },
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
                    { title: 'Plataforma', href: '/admin/system', icon: Monitor },
                    { title: 'Configuración', href: '/admin/settings', icon: Settings },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems(activeContext);

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

    // Tooltips only on Desktop + Collapsed
    const showTooltips = !isMobile && !isExpanded && sidebarMode === 'collapsed';

    const ConditionalTooltip = ({ children, title }: { children: React.ReactNode; title: string }) => {
        if (!showTooltips) return <>{children}</>;
        return (
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent side="right">{title}</TooltipContent>
            </Tooltip>
        );
    };

    return (
        <div className="flex flex-col h-full items-center py-4 space-y-4 w-full overflow-hidden">
            {/* 1. CONTEXT SWITCHER */}
            <div className="w-full px-2">
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
                    <TooltipProvider delayDuration={0}>
                        <ConditionalTooltip title={`Cambiar Contexto (${currentContext.label})`}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="default"
                                    className={cn(
                                        "h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 shadow-sm transition-all duration-300",
                                        "w-full justify-start pl-3 pr-3"
                                    )}
                                >
                                    <currentContext.icon className="h-5 w-5 shrink-0" />
                                    <span
                                        className={cn(
                                            "font-medium truncate transition-all duration-300 overflow-hidden whitespace-nowrap",
                                            isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0 ml-0"
                                        )}
                                    >
                                        {currentContext.label}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                        </ConditionalTooltip>
                    </TooltipProvider>

                    <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="start" className="w-56 ml-2 p-2">
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider mb-1 px-2">
                            Cambiar Espacio de Trabajo
                        </DropdownMenuLabel>
                        {contexts.map((ctx) => (
                            <DropdownMenuItem
                                key={ctx.id}
                                onSelect={async () => {
                                    actions.setActiveContext(ctx.id);
                                    if (onLinkClick) onLinkClick();

                                    if (ctx.id === 'project') {
                                        const currentProjectId = useLayoutStore.getState().activeProjectId;
                                        if (currentProjectId) {
                                            router.push(`/project/${currentProjectId}` as any);
                                            return;
                                        }
                                        router.push('/organization/projects' as any);
                                        return;
                                    }

                                    const route = contextRoutes[ctx.id];
                                    if (route) {
                                        router.push(route as any);
                                    }
                                }}
                                className={cn("flex items-center gap-3 p-2 rounded-md cursor-pointer", activeContext === ctx.id && "bg-accent text-accent-foreground")}
                            >
                                <div className="p-1.5 rounded-md bg-muted/50 border border-border/50">
                                    <ctx.icon className="h-4 w-4" />
                                </div>
                                <span className="font-medium">{ctx.label}</span>
                                {activeContext === ctx.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="w-[calc(100%-16px)] h-[1px] bg-border/20" />

            {/* 2. NAVIGATION ICONS */}
            <ScrollArea className="flex-1 w-full px-2" type="scroll">
                <nav className="flex flex-col items-center gap-2 w-full">
                    <TooltipProvider delayDuration={0}>
                        {navItems.map((item, index) => (
                            <ConditionalTooltip key={index} title={item.title}>
                                <div className="w-full">
                                    <Button
                                        asChild
                                        variant={pathname === item.href ? "secondary" : "ghost"}
                                        size="default"
                                        className={cn(
                                            "h-10 rounded-lg transition-all duration-200 w-full justify-start pl-3 pr-3",
                                            pathname === item.href
                                                ? "bg-secondary text-foreground shadow-sm hover:bg-secondary/80"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        )}
                                        onClick={() => {
                                            if (onLinkClick) onLinkClick();
                                        }}
                                    >
                                        <Link href={item.href as any}>
                                            <item.icon className="h-5 w-5 shrink-0" />
                                            <span
                                                className={cn(
                                                    "font-medium truncate transition-all duration-300 overflow-hidden whitespace-nowrap",
                                                    isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0 ml-0"
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

            {/* Bottom Actions - HIDE ON MOBILE */}
            {!isMobile && (
                <div className="mt-auto px-2 pb-4 flex flex-col items-center gap-2 w-full">
                    <TooltipProvider delayDuration={0}>
                        <ConditionalTooltip title={getModeLabel()}>
                            <Button
                                variant="ghost"
                                size="default"
                                className={cn(
                                    "h-10 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-300 w-full justify-start pl-3 pr-3"
                                )}
                                onClick={cycleSidebarMode}
                            >
                                {React.createElement(getModeIcon(), { className: "h-5 w-5 shrink-0" })}
                                <span
                                    className={cn(
                                        "font-medium truncate transition-all duration-300 overflow-hidden whitespace-nowrap",
                                        isExpanded ? "w-auto opacity-100 ml-3" : "w-0 opacity-0 ml-0"
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
