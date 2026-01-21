"use client";

import * as React from "react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { useLayoutStore, NavigationContext, useActiveProjectId } from "@/store/layout-store";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { SidebarButton } from "./sidebar-button";
import { SidebarAccordion } from "./sidebar-accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    PanelLeft,
    PanelLeftClose
} from "lucide-react";
import { useTranslations } from "next-intl";

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    sectionHeader?: string;
}

import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";

// ============================================================================
// CONFIGURATION -> MOVED TO HOOK
// ============================================================================

// ============================================================================
// UNIFIED SIDEBAR CONTENT
// ============================================================================

interface SidebarContentProps {
    onLinkClick?: () => void;
    mode?: "desktop" | "mobile";
    isExpanded?: boolean;
}

export function SidebarContent({ onLinkClick, mode = "desktop", isExpanded: propIsExpanded }: SidebarContentProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { activeContext, sidebarMode, actions } = useLayoutStore();
    const tMega = useTranslations('MegaMenu');

    // Use the new hook for navigation data
    const { contexts, contextRoutes, getNavItems } = useSidebarNavigation();

    // Sidebar Expansion Logic
    const isMobile = mode === "mobile";
    const isExpanded = propIsExpanded ?? isMobile;

    // When sidebar is collapsed, we only show icons. Opening an accordion should trigger expansion or mode change.
    // However, the user requested "Never more than one accordion open".

    // Derived state for which accordion is open based on active context
    // We can allow users to manually toggle them, but syncing with activeContext is good default
    const [openContext, setOpenContext] = React.useState<NavigationContext | null>(activeContext);

    // Sync open context with active context when it changes externally (e.g. navigation)
    React.useEffect(() => {
        setOpenContext(activeContext);
    }, [activeContext]);

    const handleAccordionToggle = (ctx: NavigationContext) => {
        // Mini-Accordion Logic: We DO NOT expand the sidebar. We just toggle the context.
        // User wants icon-only expansion in collapsed mode.

        // Single accordion exclusive open logic
        if (openContext === ctx) {
            // Already open, do nothing or toggle off? Usually sidebar nav keeps one open.
            // Let's just set it active.
        } else {
            setOpenContext(ctx);
        }

        // Also Update Global Context
        actions.setActiveContext(ctx);

        // Optional: Navigate to base route of context if not already there?
        // For now, we just expand the menu.
    };

    const handleContextMainClick = (ctx: NavigationContext) => {
        // Navigate to the main route of the context
        const route = contextRoutes[ctx];
        if (route) {
            router.push(route as any);
        }
    };

    // getNavItems is now provided by the hook

    const cycleSidebarMode = () => {
        if (sidebarMode === 'docked') actions.setSidebarMode('expanded_hover');
        else actions.setSidebarMode('docked');
    };

    const getModeIcon = () => {
        if (sidebarMode === 'docked') return PanelLeftClose;
        return PanelLeft;
    };

    const getModeLabel = () => {
        if (sidebarMode === 'docked') return "Colapsar Barra Lateral";
        return "Fijar Barra Lateral";
    };

    // Logic to ensure exclusive focus: If a Right Sidebar tool is active, Left Sidebar should NOT be active.
    const RIGHT_SIDEBAR_PATHS = ['/organization/kanban'];
    const isRightSidebarActive = RIGHT_SIDEBAR_PATHS.some(path => pathname?.startsWith(path));

    // Width classes based on state
    const widthClass = isExpanded ? "w-[240px]" : "w-[50px]";

    // Tooltips should only be shown in strictly collapsed mode.
    // In 'expanded_hover' mode, the sidebar expands on interaction, so tooltips are redundant/annoying.
    const showTooltips = false; // Disable tooltips as we rely on hover expansion

    return (
        <div
            className={cn(
                "flex flex-col h-full py-2 bg-sidebar border-r border-sidebar-border transition-all duration-150 ease-in-out",
                widthClass
            )}
            onMouseEnter={() => {
                if (sidebarMode === 'expanded_hover' && !isMobile) {
                    // Handled by CSS/State usually
                }
            }}
        >
            {/* Top Logo Section */}
            <div className="w-full flex items-center mb-2 px-2">
                <Link href="/organization" className="flex items-center rounded-lg hover:bg-secondary/50 transition-colors h-8 w-full p-0 gap-0">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <NextImage src="/logo.png" alt="Seencel" width={20} height={20} className="object-contain" />
                    </div>

                    <span className={cn(
                        "font-bold text-lg tracking-tight text-foreground/90 whitespace-nowrap overflow-hidden transition-all duration-150 ease-in-out",
                        isExpanded ? "w-auto opacity-100 pl-3" : "w-0 opacity-0 pl-0"
                    )}>
                        SEENCEL
                    </span>
                </Link>
            </div>

            {/* Separator */}
            <div className="w-8 h-px bg-border/50 mb-2 mx-auto" />

            <ScrollArea className="flex-1" type="scroll">
                <nav className="flex flex-col gap-2 px-2">
                    {contexts.map((ctx) => {
                        const navItems = getNavItems(ctx.id);
                        const isOpen = openContext === ctx.id && isExpanded;
                        const isActiveContext = activeContext === ctx.id;

                        // Calculate if any child is active
                        const isChildActive = navItems.some(item => pathname === item.href);

                        // Master Switch: If Right Sidebar is active, Left Sidebar is OFF.
                        // FIX: Only highlight if a child is active. Opening the accordion (isActiveContext) should NOT make it active color.
                        const shouldHighlight = isChildActive && !isRightSidebarActive;

                        return (
                            <SidebarAccordion
                                key={ctx.id}
                                icon={ctx.icon as any}
                                label={ctx.label}
                                isOpen={isOpen}
                                onToggle={() => handleAccordionToggle(ctx.id)}
                                isSidebarExpanded={isExpanded}
                                isActive={shouldHighlight}
                                tooltipDisabled={!showTooltips}
                            >
                                {navItems.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        {item.sectionHeader && isExpanded && (
                                            <div className="px-2 pb-1 pt-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                {item.sectionHeader}
                                            </div>
                                        )}
                                        <SidebarButton
                                            icon={item.icon}
                                            label={item.title}
                                            href={item.href}
                                            // Also apply exclusivity to individual buttons
                                            isActive={pathname === item.href && !isRightSidebarActive}
                                            activeVariant="secondary"
                                            isExpanded={isExpanded} // Dynamic expansion based on sidebar state
                                            className="h-8 w-full p-0 pl-[4px]"
                                            size="default" // Use full width with text
                                            onClick={() => {
                                                if (onLinkClick) onLinkClick();
                                            }}
                                        />
                                    </React.Fragment>
                                ))}
                            </SidebarAccordion>
                        );
                    })}
                </nav>
            </ScrollArea>

            {/* Mode Toggle (bottom, desktop only) */}
            {!isMobile && (
                <div className="mt-auto pt-2 border-t border-sidebar-border/50 px-[9px]">
                    <SidebarButton
                        icon={getModeIcon()}
                        label={getModeLabel()}
                        isExpanded={isExpanded}
                        // size="icon" when collapsed, "default" when expanded
                        size={isExpanded ? "default" : "icon"}
                        onClick={cycleSidebarMode}
                        tooltip={showTooltips ? getModeLabel() : undefined}
                        className={cn(
                            "h-8 transition-all duration-200",
                            "w-full justify-start pl-[4px]"
                        )}
                    />
                </div>
            )}
        </div>
    );
}
