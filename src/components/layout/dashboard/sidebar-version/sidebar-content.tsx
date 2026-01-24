"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLayoutStore, NavigationContext } from "@/store/layout-store";
import { usePathname, useRouter } from "@/i18n/routing";
import { useRouter as useNextRouter } from "next/navigation";
import { SidebarContextButton, SidebarAvatarButton, SidebarBrandButton, SidebarNavButton, SidebarNotificationsButton, SidebarFeedbackButton } from "./buttons";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    PanelLeft,
    PanelLeftClose,
    ArrowLeft,
    Building,
} from "lucide-react";
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { useSidebarData } from "@/hooks/use-sidebar-data";

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
type DrillDownState = "home" | NavigationContext;

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
    const { contexts, contextRoutes, getNavItems } = useSidebarNavigation();

    // Get org/project data from hook
    const {
        projects,
        currentOrg,
        currentProject,
        handleProjectChange
    } = useSidebarData();

    const isMobile = mode === "mobile";
    const isExpanded = propIsExpanded ?? isMobile;

    // Drill-down state: "home" or a specific context
    const [drillState, setDrillState] = React.useState<DrillDownState>("home");

    // Animation direction
    const [slideDirection, setSlideDirection] = React.useState<"left" | "right">("right");

    // Handle context button click - drill into that context
    // NOTE: Changing context should NOT navigate to a different page
    // It only updates the sidebar menu to show that context's navigation items
    const handleContextEnter = (ctx: NavigationContext) => {
        setSlideDirection("right");
        setDrillState(ctx);
        actions.setActiveContext(ctx);
        // Intentionally not navigating - user stays on current page
    };

    // Handle back button - return to home
    const handleBack = () => {
        setSlideDirection("left");
        setDrillState("home");
    };

    // Toggle sidebar mode
    const cycleSidebarMode = () => {
        if (sidebarMode === 'docked') actions.setSidebarMode('expanded_hover');
        else actions.setSidebarMode('docked');
    };

    const getModeIcon = () => sidebarMode === 'docked' ? PanelLeftClose : PanelLeft;
    const getModeLabel = () => sidebarMode === 'docked' ? "Colapsar" : "Fijar";

    // Get nav items for specific contexts
    const orgNavItems = getNavItems("organization");
    const projectNavItems = getNavItems("project");

    // Sync sidebar project with URL projectId
    // If user navigates directly to a project URL, update the sidebar to show that project
    React.useEffect(() => {
        const projectMatch = pathname.match(/\/project\/([^/]+)/);
        if (projectMatch) {
            const urlProjectId = projectMatch[1];
            // If URL has a different project than currently selected, sync it
            if (urlProjectId && currentProject?.id !== urlProjectId) {
                const projectInList = projects.find(p => p.id === urlProjectId);
                if (projectInList) {
                    handleProjectChange(urlProjectId);
                    // Also switch to project context
                    setDrillState("project");
                    actions.setActiveContext("project");
                }
            }
        }
    }, [pathname, currentProject?.id, projects, handleProjectChange, actions]);

    // Slide animation classes
    const slideClass = cn(
        "transition-transform duration-200 ease-out",
        slideDirection === "right" ? "animate-slide-in-right" : "animate-slide-in-left"
    );

    // Width class
    const widthClass = isExpanded ? "w-[240px]" : "w-[50px]";

    return (
        <div
            className={cn(
                "flex flex-col h-full py-2 bg-sidebar border-r border-sidebar-border transition-all duration-150 ease-in-out overflow-hidden",
                widthClass
            )}
        >
            {/* Top Brand Section */}
            <div className="w-full flex items-center mb-2 px-2">
                <SidebarBrandButton
                    mode={drillState === "home" ? "home" : drillState === "project" ? "project" : "organization"}
                    isExpanded={isExpanded}
                    currentOrg={currentOrg}
                    currentProject={currentProject}
                    projects={projects}
                    onOrgClick={() => {
                        setSlideDirection("left");
                        setDrillState("organization");
                        actions.setActiveContext("organization");
                        // Intentionally not navigating - user stays on current page
                    }}
                    onProjectChange={(projectId) => {
                        // Change context to project
                        setSlideDirection("right");
                        setDrillState("project");
                        actions.setActiveContext("project");
                        // Update state and save preference
                        handleProjectChange(projectId);

                        // Navigate to the new project
                        // If already on a project page, stay on same sub-page
                        // If on organization page, go to project overview
                        // Extract locale from current URL (e.g., /es/project/... -> es)
                        const localeMatch = window.location.pathname.match(/^\/([a-z]{2})\//);
                        const locale = localeMatch ? localeMatch[1] : 'es';

                        const projectPathMatch = pathname.match(/\/project\/[^/]+\/?(.*)$/);
                        if (projectPathMatch) {
                            // On a project page, navigate to same sub-page in new project
                            const subPage = projectPathMatch[1] || '';
                            nativeRouter.push(`/${locale}/project/${projectId}${subPage ? `/${subPage}` : ''}`);
                        } else {
                            // On organization page, navigate to project overview
                            nativeRouter.push(`/${locale}/project/${projectId}`);
                        }
                    }}
                />
            </div>

            {/* Separator */}
            <div className="w-8 h-px bg-border/50 mb-2 mx-auto" />

            <ScrollArea className="flex-1" type="scroll">
                {/* ============================================================ */}
                {/* HOME STATE: Context Buttons */}
                {/* ============================================================ */}
                {drillState === "home" && (
                    <nav className={cn("flex flex-col gap-2 px-2", slideClass)} key="home">
                        <SidebarContextButton
                            icon={contexts.find(c => c.id === "organization")?.icon || Building}
                            label="Dashboard"
                            description="Organización y proyectos"
                            isExpanded={isExpanded}
                            onClick={() => handleContextEnter("organization")}
                        />
                        <SidebarContextButton
                            icon={contexts.find(c => c.id === "learnings")?.icon || Building}
                            label="Academia"
                            description="Cursos y capacitaciones"
                            isExpanded={isExpanded}
                            onClick={() => handleContextEnter("learnings")}
                        />
                        <SidebarContextButton
                            icon={contexts.find(c => c.id === "community")?.icon || Building}
                            label="Comunidad"
                            description="Fundadores y red Seencel"
                            isExpanded={isExpanded}
                            onClick={() => handleContextEnter("community")}
                        />
                        <SidebarContextButton
                            icon={contexts.find(c => c.id === "admin")?.icon || Building}
                            label="Admin"
                            description="Panel de administración"
                            isExpanded={isExpanded}
                            onClick={() => handleContextEnter("admin")}
                        />
                    </nav>
                )}

                {/* ============================================================ */}
                {/* ORGANIZATION STATE: Direct navigation buttons */}
                {/* ============================================================ */}
                {drillState === "organization" && (
                    <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key="organization">
                        {/* Back Button */}
                        <SidebarNavButton
                            icon={ArrowLeft}
                            label="Volver"
                            isExpanded={isExpanded}
                            onClick={handleBack}
                        />

                        {/* Separator */}
                        <div className="w-full h-px bg-border/30 my-1" />

                        {/* Organization Nav Items */}
                        {orgNavItems.map((item, idx) => (
                            <React.Fragment key={idx}>
                                {item.sectionHeader && isExpanded && (
                                    <div className="px-2 pb-1 pt-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        {item.sectionHeader}
                                    </div>
                                )}
                                <SidebarNavButton
                                    icon={item.icon}
                                    label={item.title}
                                    href={item.href}
                                    isActive={pathname === item.href}
                                    isExpanded={isExpanded}
                                    onClick={onLinkClick}
                                />
                            </React.Fragment>
                        ))}
                    </nav>
                )}

                {/* ============================================================ */}
                {/* PROJECT STATE: Direct navigation buttons */}
                {/* ============================================================ */}
                {drillState === "project" && (
                    <nav className={cn("flex flex-col gap-1 px-2", slideClass)} key="project">
                        {/* Back Button */}
                        <SidebarNavButton
                            icon={ArrowLeft}
                            label="Volver"
                            isExpanded={isExpanded}
                            onClick={handleBack}
                        />

                        {/* Separator */}
                        <div className="w-full h-px bg-border/30 my-1" />

                        {/* Project Nav Items */}
                        {projectNavItems.map((item, idx) => (
                            <React.Fragment key={idx}>
                                {item.sectionHeader && isExpanded && (
                                    <div className="px-2 pb-1 pt-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        {item.sectionHeader}
                                    </div>
                                )}
                                <SidebarNavButton
                                    icon={item.icon}
                                    label={item.title}
                                    href={item.href}
                                    isActive={pathname === item.href}
                                    isExpanded={isExpanded}
                                    onClick={onLinkClick}
                                />
                            </React.Fragment>
                        ))}
                    </nav>
                )}

                {/* ============================================================ */}
                {/* LEARNINGS STATE */}
                {/* ============================================================ */}
                {drillState === "learnings" && (
                    <nav className={cn("flex flex-col gap-2 px-2", slideClass)} key="learnings">
                        {/* Back Button */}
                        <SidebarNavButton
                            icon={ArrowLeft}
                            label="Volver"
                            isExpanded={isExpanded}
                            onClick={handleBack}
                        />

                        <div className="w-full h-px bg-border/30 my-1" />

                        {/* Academia Header */}
                        {isExpanded && (
                            <div className="px-3 py-2 text-sm font-semibold text-primary">
                                Academia
                            </div>
                        )}

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

                {/* ============================================================ */}
                {/* COMMUNITY STATE */}
                {/* ============================================================ */}
                {drillState === "community" && (
                    <nav className={cn("flex flex-col gap-2 px-2", slideClass)} key="community">
                        <SidebarNavButton
                            icon={ArrowLeft}
                            label="Volver"
                            isExpanded={isExpanded}
                            onClick={handleBack}
                        />

                        <div className="w-full h-px bg-border/30 my-1" />

                        {isExpanded && (
                            <div className="px-3 py-2 text-sm font-semibold text-primary">
                                Comunidad
                            </div>
                        )}

                        {getNavItems("community").map((item, idx) => (
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

                {/* ============================================================ */}
                {/* ADMIN STATE */}
                {/* ============================================================ */}
                {drillState === "admin" && (
                    <nav className={cn("flex flex-col gap-2 px-2", slideClass)} key="admin">
                        <SidebarNavButton
                            icon={ArrowLeft}
                            label="Volver"
                            isExpanded={isExpanded}
                            onClick={handleBack}
                        />

                        <div className="w-full h-px bg-border/30 my-1" />

                        {isExpanded && (
                            <div className="px-3 py-2 text-sm font-semibold text-primary">
                                Administración
                            </div>
                        )}

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

            {/* Mode Toggle (bottom, desktop only) */}
            {!isMobile && (
                <div className="mt-auto pt-2 border-t border-sidebar-border/50 px-2 space-y-1">
                    <SidebarNavButton
                        icon={getModeIcon()}
                        label={getModeLabel()}
                        isExpanded={isExpanded}
                        onClick={cycleSidebarMode}
                    />

                    {/* Feedback Button */}
                    <SidebarFeedbackButton isExpanded={isExpanded} />

                    {/* Notifications Button */}
                    <SidebarNotificationsButton isExpanded={isExpanded} />

                    {/* User Avatar Button */}
                    <SidebarAvatarButton
                        avatarUrl={user?.avatar_url}
                        name={user?.full_name || "Usuario"}
                        email={user?.email}
                        isExpanded={isExpanded}
                    />
                </div>
            )}
        </div>
    );
}

