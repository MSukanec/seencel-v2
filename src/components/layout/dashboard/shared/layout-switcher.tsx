"use client";

import * as React from "react";
import { SidebarLayout } from "../sidebar-version/sidebar-layout";
import { GlobalDrawer } from "./drawer/global-drawer";
import { UserProfile } from "@/types/user";

import { UserProvider } from "@/context/user-context";
import { QueryProvider } from "@/providers/query-provider";
import { ContextSidebarProvider } from "@/providers/context-sidebar-provider";
import { PresenceProvider } from "@/providers/presence-provider";
import { OnboardingWidgetWrapper } from "@/features/onboarding/checklist";

export function LayoutSwitcher({
    children,
    user,
}: {
    children: React.ReactNode;
    user?: UserProfile | null;
    activeOrgId?: string; // Keep for backwards compatibility but unused
}) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by rendering a default state initially
    if (!mounted) {
        return (
            <div className="flex min-h-screen flex-col bg-background opacity-0">
                {children}
            </div>
        );
    }

    // Always use Sidebar Layout - Mega Menu is deprecated
    return (
        <QueryProvider>
            <UserProvider user={user}>
                {user?.id ? (
                    <PresenceProvider userId={user.id}>
                        <ContextSidebarProvider>
                            <SidebarLayout user={user}>
                                {children}
                            </SidebarLayout>
                        </ContextSidebarProvider>
                        <GlobalDrawer />
                        <OnboardingWidgetWrapper />
                    </PresenceProvider>
                ) : (
                    <ContextSidebarProvider>
                        <SidebarLayout user={user}>
                            {children}
                        </SidebarLayout>
                    </ContextSidebarProvider>
                )}
            </UserProvider>
        </QueryProvider>
    );
}

