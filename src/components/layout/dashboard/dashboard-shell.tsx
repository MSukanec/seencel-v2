"use client";

import * as React from "react";
import { SidebarLayout } from "./sidebar/sidebar-layout";
import { UserProfile } from "@/types/user";

import { PresenceProvider } from "@/providers/presence-provider";
import { OnboardingWidgetWrapper } from "@/features/onboarding/checklist";
import { BannerStack } from '../banners/banner-stack';

export function DashboardShell({
    children,
    user,
}: {
    children: React.ReactNode;
    user?: UserProfile | null;
}) {
    // Wrap the application in Core Providers and render the Vercel-style App Shell
    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-shell">
            {/* Layer 1: Global Status Indicators (Banners Orchestrator) */}
            <BannerStack />
            
            {/* Layer 2: Application Core Workspace */}
            <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
                <PresenceProvider userId={user?.id || null}>
                    <SidebarLayout user={user}>
                        {children}
                    </SidebarLayout>
                    {user?.id ? <OnboardingWidgetWrapper /> : null}
                </PresenceProvider>
            </div>
        </div>
    );
}
