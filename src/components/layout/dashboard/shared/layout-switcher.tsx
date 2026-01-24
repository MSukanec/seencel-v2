"use client";

import * as React from "react";
import { Header } from "../mega-menu-version/header";
import { SidebarLayout } from "../sidebar-version/sidebar-layout";
import { GlobalDrawer } from "./drawer/global-drawer";
import { useLayoutStore } from "@/store/layout-store";
import { UserProfile } from "@/types/user";

import { UserProvider } from "@/context/user-context";
import { QueryProvider } from "@/providers/query-provider";
import { ContextSidebarProvider } from "@/providers/context-sidebar-provider";

export function LayoutSwitcher({
    children,
    user,
    activeOrgId
}: {
    children: React.ReactNode;
    user?: UserProfile | null;
    activeOrgId?: string;
}) {
    const { layoutMode } = useLayoutStore();
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

    if (layoutMode === 'sidebar') {
        return (
            <QueryProvider>
                <UserProvider user={user}>
                    <ContextSidebarProvider>
                        <SidebarLayout user={user}>
                            {children}
                        </SidebarLayout>
                    </ContextSidebarProvider>
                    <GlobalDrawer />
                </UserProvider>
            </QueryProvider>
        );
    }

    // Default Layout
    return (
        <QueryProvider>
            <UserProvider user={user}>
                <div className="flex min-h-screen flex-col bg-background">
                    <Header variant="app" user={user} activeOrgId={activeOrgId} />
                    <GlobalDrawer />
                    <div className="flex-1 flex flex-col">
                        <main className="flex-1">
                            <div className="w-full mx-auto max-w-[1800px] p-3 md:p-4 animate-in fade-in py-4 md:py-6">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </UserProvider>
        </QueryProvider>
    );
}


