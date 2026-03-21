"use client";

import * as React from "react";
import { useLayoutStore, NavigationContext, type WorkspaceSection } from "@/stores/layout-store";
import { useRouter } from "@/i18n/routing";
import { useSidebarNavigation, contextRoutes } from "@/hooks/use-sidebar-navigation";
import { SidebarNavButton } from "./sidebar-button";
import { SidebarNotificationsButton } from "./sidebar-notifications-button";
import { SidebarUserButton } from "./sidebar-user-button";
import { SidebarOrgButton } from "./sidebar-org-button";
import { SidebarLogoButton } from "./sidebar-logo-button";
import { SidebarTooltipProvider, SidebarTooltip } from "./sidebar-tooltip";
import { Building, GraduationCap, Sparkles, Users, Shield, LayoutDashboard, HardHat, DollarSign, BookOpen, Video } from "lucide-react";
import { useFeatureFlags } from "@/providers/feature-flags-provider";
import { usePathname } from "@/i18n/routing";

// ============================================================================
// ACTIVITY BAR — Persistent vertical icon strip (VS Code / Slack pattern)
// ============================================================================
// Context-aware rail:
//   - Hub / non-workspace: global context buttons (Workspace, Academy, etc.)
//   - Inside workspace (organization): section buttons (General, Construcción, Finanzas)
//   - Inside academy (learnings): academy section buttons (Visión General, Cursos)
// ============================================================================

// Workspace section buttons — shown when inside organization context
const WORKSPACE_SECTIONS = [
    { id: 'overview' as WorkspaceSection, label: 'General', icon: LayoutDashboard },
    { id: 'catalog' as WorkspaceSection, label: 'Catálogo Técnico', icon: BookOpen },
    { id: 'construction' as WorkspaceSection, label: 'Construcción', icon: HardHat },
    { id: 'finance' as WorkspaceSection, label: 'Finanzas', icon: DollarSign },
];

// Academy section buttons — shown when inside academy (learnings) context
const ACADEMY_SECTIONS = [
    { id: 'academy-overview', label: 'Visión General', icon: LayoutDashboard, href: '/academy/overview' },
    { id: 'academy-courses', label: 'Cursos', icon: Video, href: '/academy/my-courses' },
];

interface ActivityBarProps {
    user?: {
        full_name?: string | null;
        email?: string | null;
        avatar_url?: string | null;
    } | null;
}

export function ActivityBar({ user }: ActivityBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { activeContext, activeBaseContext, activeWorkspaceSection, actions } = useLayoutStore();
    const { contexts } = useSidebarNavigation();
    const { isAdmin } = useFeatureFlags();

    // Icon map for each global context
    const contextIcons: Record<string, React.ElementType> = {
        organization: Building,
        learnings: GraduationCap,
        founders: Sparkles,
        community: Users,
        admin: Shield,
    };

    // Handle global context switch
    const handleContextClick = (ctx: NavigationContext) => {
        actions.setActiveContext(ctx);
        const route = contextRoutes[ctx];
        if (route) {
            actions.setPendingPathname(route);
        }
    };

    // Handle workspace section click
    const handleSectionClick = (sectionId: string) => {
        // If it's a workspace section (overview, catalog, construction, finance)
        if (['overview', 'catalog', 'construction', 'finance', 'founders'].includes(sectionId)) {
            actions.setActiveWorkspaceSection(sectionId as WorkspaceSection);
            actions.setActiveContext('organization');
        } else {
            actions.setActiveContext(sectionId as NavigationContext);
        }
        
        // Navigation is now handled natively by next/link! We just set pending pathname.
        const route = (() => {
            if (sectionId === 'overview') return '/organization';
            if (sectionId === 'founders') return contextRoutes['founders'];
            if (sectionId === 'academy-overview') return '/academy/overview';
            if (sectionId === 'academy-courses') return '/academy/my-courses';
            return contextRoutes[sectionId as NavigationContext];
        })();

        if (route) {
            actions.setPendingPathname(route);
        }
    };

    // Global context items (excluding home, admin, and founders — admin lives in bottom section, founders in workspace bottom)
    const contextItems = contexts
        .filter(ctx => ctx.id !== 'admin' && ctx.id !== 'founders')
        .map(ctx => ({
            id: ctx.id,
            label: ctx.label,
            icon: contextIcons[ctx.id] || ctx.icon,
            disabled: ctx.disabled,
            hidden: ctx.hidden,
            status: ctx.status,
        }));

    // Find the founders item to render it in the workspace bottom rail
    const foundersItem = contexts.find(ctx => ctx.id === 'founders');

    // Context states
    // Rail stability: use activeBaseContext instead of activeContext so that when we navigate
    // to Settings or Admin, the contextual rail we came from is preserved.
    const isInWorkspace = activeBaseContext === 'organization';
    const isInAcademy = activeBaseContext === 'learnings';

    return (
        <SidebarTooltipProvider>
            <div className="flex flex-col items-center w-[50px] h-full bg-sidebar shrink-0 py-2 border-r border-sidebar-border/30">
                {/* Logo → Hub */}
                <SidebarTooltip label="Hub" isExpanded={false}>
                    <SidebarLogoButton />
                </SidebarTooltip>

                {/* Separator */}
                <div className="w-5 h-px bg-border/40 my-1" />

                {/* Context-aware middle section */}
                <div className="flex flex-col items-center gap-1 flex-1">
                    {isInWorkspace ? (
                        /* Workspace sections: General, Construcción, Finanzas */
                        WORKSPACE_SECTIONS.map((section) => (
                            <SidebarTooltip
                                key={section.id}
                                label={section.label}
                                isExpanded={false}
                            >
                                <SidebarNavButton
                                    variant="compact"
                                    icon={section.icon}
                                    label={section.label}
                                    href={section.id === 'overview' ? '/organization' : undefined}
                                    isActive={activeContext === 'organization' && activeWorkspaceSection === section.id}
                                    onClick={() => handleSectionClick(section.id)}
                                />
                            </SidebarTooltip>
                        ))
                    ) : isInAcademy ? (
                        /* Academy sections: Visión General, Cursos */
                        ACADEMY_SECTIONS.map((section) => (
                            <SidebarTooltip
                                key={section.id}
                                label={section.label}
                                isExpanded={false}
                            >
                                <SidebarNavButton
                                    variant="compact"
                                    icon={section.icon}
                                    label={section.label}
                                    href={section.href}
                                    isActive={pathname.startsWith(section.href)}
                                    // Let Link navigate natively, just update UX context
                                    onClick={() => {
                                        actions.setActiveContext('learnings');
                                        actions.setPendingPathname(section.href);
                                    }}
                                />
                            </SidebarTooltip>
                        ))
                    ) : (
                        /* Global contexts: Workspace, Community */
                        contextItems.map((item) => (
                            <SidebarTooltip
                                key={item.id}
                                label={item.label}
                                restriction={item.hidden ? 'hidden' : (item.status as any) || undefined}
                                isExpanded={false}
                            >
                                <SidebarNavButton
                                    variant="compact"
                                    icon={item.icon}
                                    label={item.label}
                                    href={contextRoutes[item.id as NavigationContext]}
                                    // Visual highlight: if we are in Settings or Admin, don't highlight global icons
                                    // unless they match the activeBaseContext. Actually, if in Settings, activeContext is 'settings'.
                                    // We'll highlight the base context if no other item is strictly active.
                                    isActive={activeBaseContext === item.id}
                                    disabled={item.disabled}
                                    hidden={item.hidden}
                                    status={item.status}
                                    onClick={() => handleContextClick(item.id)}
                                />
                            </SidebarTooltip>
                        ))
                    )}
                    
                    {/* Bottom of middle section (above separator) */}
                    <div className="mt-auto flex flex-col w-full gap-1">
                        {isInWorkspace && foundersItem && (
                            <SidebarTooltip 
                                label={foundersItem.label} 
                                restriction={foundersItem.hidden ? 'hidden' : (foundersItem.status as any) || undefined}
                                isExpanded={false}
                            >
                                <SidebarNavButton
                                    variant="compact"
                                    icon={contextIcons['founders'] || foundersItem.icon}
                                    label={foundersItem.label}
                                    href={contextRoutes['founders']}
                                    isActive={activeContext === 'organization' && activeWorkspaceSection === 'founders'}
                                    disabled={foundersItem.disabled}
                                    hidden={foundersItem.hidden}
                                    status={foundersItem.status}
                                    onClick={() => handleSectionClick('founders')}
                                />
                            </SidebarTooltip>
                        )}
                    </div>
                </div>

                {/* Separator */}
                <div className="w-5 h-px bg-border/40 my-1 shrink-0" />

                {/* Bottom: Admin + Notifications + User */}
                <div className="flex flex-col items-center gap-1 pb-2">


                    {isAdmin && (
                        <SidebarTooltip label="Admin" isExpanded={false}>
                            <SidebarNavButton
                                variant="compact"
                                icon={Shield}
                                label="Admin"
                                href={contextRoutes['admin']}
                                isActive={activeContext === 'admin'}
                                onClick={() => handleContextClick('admin')}
                            />
                        </SidebarTooltip>
                    )}
                    <SidebarNotificationsButton
                        isExpanded={false}
                        variant="quick-access"
                        className="w-9 h-9 rounded-lg"
                    />
                    {isInWorkspace && <SidebarOrgButton isExpanded={false} />}
                    <SidebarUserButton isExpanded={false} />
                </div>
            </div>
        </SidebarTooltipProvider>
    );
}

