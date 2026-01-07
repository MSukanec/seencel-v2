"use client";

import * as React from "react"
import { Sidebar } from "./sidebar";
import { SidebarHeader } from "./sidebar-header";
import { UserProfile } from "@/types/user";

import { usePathname } from "next/navigation"; // Updated import for App Router
import { cn } from "@/lib/utils";

export function SidebarLayout({ children, user }: { children: React.ReactNode, user?: UserProfile | null }) {
    const pathname = usePathname();
    const isFullWidthPage = pathname?.includes('/organization/details') || (pathname?.includes('/project/') && pathname?.includes('/details'));

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            <SidebarHeader user={user} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className={cn(
                    "flex-1 overflow-y-auto bg-muted/10",
                    isFullWidthPage ? "p-0" : "p-4"
                )}>
                    <div className={cn(
                        "animate-in fade-in slide-in-from-bottom-4 duration-500",
                        isFullWidthPage ? "w-full h-full" : "mx-auto max-w-[95%]"
                    )}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
