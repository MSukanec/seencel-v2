"use client";

import * as React from "react";
import { SidebarLayout } from "../sidebar/sidebar-layout";
import { GlobalDrawer } from "./drawer/global-drawer";
import { UserProfile } from "@/types/user";

import { useUserStore } from "@/stores/user-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { QueryProvider } from "@/providers/query-provider";
import { PresenceProvider } from "@/providers/presence-provider";
import { OnboardingWidgetWrapper } from "@/features/onboarding/checklist";
import { ImpersonationBanner } from "./impersonation-banner";

export function LayoutSwitcher({
    children,
    user,
}: {
    children: React.ReactNode;
    user?: UserProfile | null;
    activeOrgId?: string; // Keep for backwards compatibility but unused
}) {
    const [mounted, setMounted] = React.useState(false);
    const isImpersonating = useOrganizationStore(state => state.isImpersonating);

    React.useEffect(() => {
        setMounted(true);
        // Hydrate user store when component mounts
        if (user) {
            useUserStore.getState().setUser(user);
        }
    }, [user]);

    // Prevent hydration mismatch by rendering a default state initially
    if (!mounted) {
        return (
            <div className="flex min-h-screen flex-col bg-background opacity-0">
                {children}
            </div>
        );
    }

    // Always use Sidebar Layout - Mega Menu is deprecated
    // ContextSidebarProvider eliminated - now using Zustand store
    return (
        <QueryProvider>
            <ImpersonationBanner />
            <div className={isImpersonating ? "pt-9" : ""}>
                {user?.id ? (
                    <PresenceProvider userId={user.id}>
                        <SidebarLayout user={user}>
                            {children}
                        </SidebarLayout>
                        <GlobalDrawer />
                        <OnboardingWidgetWrapper />
                    </PresenceProvider>
                ) : (
                    <SidebarLayout user={user}>
                        {children}
                    </SidebarLayout>
                )}
            </div>
        </QueryProvider>
    );
}
