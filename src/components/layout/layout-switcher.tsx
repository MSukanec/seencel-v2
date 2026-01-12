"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { GlobalDrawer } from "@/components/layout/global-drawer";
import { useLayoutStore } from "@/store/layout-store";
import { UserProfile } from "@/types/user";

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
            <>
                <SidebarLayout user={user}>
                    {children}
                </SidebarLayout>
                <GlobalDrawer />
            </>
        );
    }

    // Default Layout
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header variant="app" user={user} activeOrgId={activeOrgId} />
            <GlobalDrawer />
            <div className="flex-1 flex flex-col">
                <main className="flex-1">
                    <div className="w-full mx-auto max-w-[1800px] p-4 animate-in fade-in py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
