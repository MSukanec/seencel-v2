"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLayoutStore, NavigationContext } from "@/stores/layout-store";
import { useRouter } from "@/i18n/routing";
import { useSidebarNavigation, contextRoutes } from "@/hooks/use-sidebar-navigation";
import { SidebarNavButton } from "./sidebar-button";
import { SidebarNotificationsButton } from "./sidebar-notifications-button";
import { SidebarUserButton } from "./sidebar-user-button";
import { SidebarLogoButton } from "./sidebar-logo-button";
import { SidebarTooltipProvider, SidebarTooltip } from "./sidebar-tooltip";
import { Building, GraduationCap, Sparkles, Users, Shield } from "lucide-react";
import { useFeatureFlags } from "@/providers/feature-flags-provider";

// ============================================================================
// ACTIVITY BAR — Persistent vertical icon strip (VS Code / Slack pattern)
// ============================================================================
// Always visible at 50px width. Contains:
//   TOP:    Seencel Logo (→ Hub)
//   MIDDLE: Workspace, Academy, Community, Admin
//   BOTTOM: Notifications, User
// ============================================================================

interface ActivityBarProps {
    user?: {
        full_name?: string | null;
        email?: string | null;
        avatar_url?: string | null;
    } | null;
}

export function ActivityBar({ user }: ActivityBarProps) {
    const router = useRouter();
    const { activeContext, actions } = useLayoutStore();
    const { contexts } = useSidebarNavigation();
    const { isAdmin } = useFeatureFlags();

    // Icon map for each context
    const contextIcons: Record<string, React.ElementType> = {
        organization: Building,
        learnings: GraduationCap,
        founders: Sparkles,
        community: Users,
        admin: Shield,
    };

    // Handle context switch
    const handleContextClick = (ctx: NavigationContext) => {
        actions.setActiveContext(ctx);
        router.push(contextRoutes[ctx] as any);
    };

    // Context items (excluding home — that's the logo)
    const contextItems = contexts.map(ctx => ({
        id: ctx.id,
        label: ctx.label,
        icon: contextIcons[ctx.id] || ctx.icon,
        disabled: ctx.disabled,
        hidden: ctx.hidden,
        status: ctx.status,
    }));

    return (
        <SidebarTooltipProvider>
            <div className="flex flex-col items-center w-[50px] h-full bg-sidebar shrink-0 py-2 border-r border-sidebar-border/30">
                {/* Logo → Hub */}
                <SidebarTooltip label="Hub" isExpanded={false}>
                    <SidebarLogoButton />
                </SidebarTooltip>

                {/* Separator */}
                <div className="w-5 h-px bg-border/40 my-1" />

                {/* Context buttons */}
                <div className="flex flex-col items-center gap-1 flex-1">
                    {contextItems.map((item) => (
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
                                isActive={activeContext === item.id}
                                disabled={item.disabled}
                                hidden={item.hidden}
                                status={item.status}
                                onClick={() => handleContextClick(item.id)}
                            />
                        </SidebarTooltip>
                    ))}
                </div>

                {/* Separator */}
                <div className="w-5 h-px bg-border/40 my-1" />

                {/* Bottom: Notifications + User */}
                <div className="flex flex-col items-center gap-1 pb-2">
                    <SidebarNotificationsButton
                        isExpanded={false}
                        variant="quick-access"
                        className="w-9 h-9 rounded-lg"
                    />
                    <SidebarUserButton isExpanded={false} />
                </div>
            </div>
        </SidebarTooltipProvider>
    );
}
